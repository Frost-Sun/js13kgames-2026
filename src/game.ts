import { renderUnicorn } from "./animations/unicorn";
import { initializeAudio } from "./audio/sfx";
import { initializeKeyboard } from "./core/controls/keyboard";
import { renderGradient } from "./core/graphics/gradient";
import type { TimeStep } from "./core/time/TimeStep";
import { VELOCITY_LEFT, VELOCITY_RIGHT } from "./GameObject";
import { getGameState } from "./GameState";
import { setStateLoaded } from "./gamestates";
import { canvas, cx } from "./graphics";
import { drawLevel, levelHandleClick, updateLevel } from "./Level";
import { renderText, renderWaitForProgressInput, TextSize } from "./text";

export const IntroductionTextTime = 4000;

const TIME_STEP = 1000 / 60;
const MAX_FRAME = TIME_STEP * 5;

let lastTime = 0;
const time: TimeStep = {
    t: 0,
    dt: 0,
};

const gameLoop = (t: number): void => {
    requestAnimationFrame(gameLoop);

    time.t = t;
    time.dt = Math.min(t - lastTime, MAX_FRAME);
    lastTime = t;

    update(time);
    draw(time);
};

const update = (time: TimeStep): void => {
    const state = getGameState();

    switch (state.type) {
        case "run": {
            updateLevel(time, state);
            break;
        }
        default:
            break;
    }
};

const draw = (time: TimeStep): void => {
    const state = getGameState();

    switch (state.type) {
        case "load": {
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            renderText("LOADING...", TextSize.Huge);
            cx.restore();
            break;
        }
        case "loaded": {
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            renderText("© FROST SUN", TextSize.Huge);
            renderText("2026", TextSize.Large, 1, 4);

            renderWaitForProgressInput();

            cx.restore();
            break;
        }
        case "intro": {
            cx.save();

            const colors = [
                "red",
                "orange",
                "yellow",
                "green",
                "cyan",
                "blue",
                "violet",
            ];

            const speed = 0.2;
            const stripeWidth = canvas.width / 2;

            const logicalWidth = (colors.length - 2) * stripeWidth;
            const stateStartTime = state.start || 0;
            const localTime = time.t - stateStartTime;

            const rawOffset = (localTime * speed) % (logicalWidth * 2);

            const offset =
                rawOffset > logicalWidth
                    ? 2 * logicalWidth - rawOffset
                    : rawOffset;

            for (let i = 0; i < colors.length; i++) {
                cx.fillStyle = colors[i];

                cx.fillRect(
                    i * stripeWidth - offset,
                    0,
                    stripeWidth * 2,
                    canvas.height,
                );
            }

            const currentVelocity =
                rawOffset > logicalWidth ? VELOCITY_LEFT : VELOCITY_RIGHT;

            renderUnicorn({
                x: canvas.width / 2,
                y: canvas.height / 1.4,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderUnicorn({
                x: canvas.width / 4,
                y: canvas.height / 1.3,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderUnicorn({
                x: canvas.width / 32,
                y: canvas.height / 1.4,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderText("UNICORNS!", TextSize.Huge);

            renderGradient(canvas, cx, 0.5);

            renderWaitForProgressInput();

            cx.restore();
            break;
        }
        case "run":
        case "finished":
        case "lose": {
            const { level } = state;
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            drawLevel(time, level);

            renderText(
                `Finish: ${level.charactersFinished} / ${level.charactersToFinish}`,
                TextSize.Normal,
                1,
                3,
                false,
            );

            if (state.type === "run") {
                if (time.t - state.start < IntroductionTextTime) {
                    renderText(level.introduction, TextSize.Normal, 1, -20);
                }
            } else if (state.type === "finished") {
                renderText("LEVEL FINISHED", TextSize.Large);
                renderWaitForProgressInput();
            } else if (state.type === "lose") {
                renderText("YOU LOSE :( ", TextSize.Large);
                renderWaitForProgressInput();
            }

            cx.restore();
            break;
        }
        case "win": {
            cx.save();

            // Blank screen
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            renderText("YOU WIN!", TextSize.Huge);
            renderWaitForProgressInput();

            cx.restore();
            break;
        }
    }
};

const handleClick = (event: MouseEvent): void => {
    const state = getGameState();
    if (state.type === "run") {
        levelHandleClick(state.level, event);
    }
};

export const start = async (): Promise<void> => {
    initializeKeyboard();
    document.addEventListener("click", handleClick);

    window.requestAnimationFrame(gameLoop);

    await initializeAudio();

    setStateLoaded(time);
};
