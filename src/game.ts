import { renderUnicorn } from "./animations/unicorn";
import { GAME_TITLE } from "./constants";
import { initializeAudio, playTune, SFX_CLICK } from "./audio/sfx";
import { initializeKeyboard } from "./core/controls/keyboard";
import { renderGradient } from "./core/graphics/gradient";
import type { TimeStep } from "./core/time/TimeStep";
import { VELOCITY_LEFT, VELOCITY_RIGHT } from "./GameObject";
import { getGameState } from "./GameState";
import { setStateLoaded } from "./gamestates";
import { canvas, cx, drawRainbowBackground } from "./graphics";
import {
    drawLevel,
    levelHandleClick,
    levelHandleMouseMove,
    updateLevel,
} from "./Level";
import {
    drawLevelSelection,
    levelSelectionHandeMouseMove,
    levelSelectionHandleClick,
} from "./LevelSelection";
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
        case "run":
        case "lose":
        case "finished": {
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

            const direction = drawRainbowBackground(time, state.start);

            const currentVelocity =
                direction > 0 ? VELOCITY_LEFT : VELOCITY_RIGHT;

            renderUnicorn({
                x: canvas.width / 128,
                y: canvas.height / 1.4,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderUnicorn({
                x: canvas.width / 3.5,
                y: canvas.height / 1.3,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderUnicorn({
                x: canvas.width / 1.75,
                y: canvas.height / 1.4,
                width: canvas.width / 2.5,
                height: canvas.height / 2.5,
                type: "character",
                velocity: currentVelocity,
            });

            renderText(GAME_TITLE, TextSize.Huge);

            renderWaitForProgressInput();

            cx.restore();
            break;
        }
        case "levels": {
            drawLevelSelection(time, state);
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
                `🦄 in: ${level.charactersFinished} - target: ${level.charactersToFinish}`,
                TextSize.Normal,
                1,
                3,
                false,
            );

            if (state.type === "run") {
                if (time.t - state.start < IntroductionTextTime) {
                    renderText(level.introduction, TextSize.Normal, 1, -10);
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

            drawRainbowBackground(time, state.start);

            renderText("YOU WIN!", TextSize.Huge);
            renderWaitForProgressInput();

            cx.restore();
            break;
        }
    }
    renderGradient(canvas, cx, 0.5);
};

const handleMouseMove = (event: MouseEvent): void => {
    const state = getGameState();
    switch (state.type) {
        case "levels": {
            levelSelectionHandeMouseMove(event);
            break;
        }
        case "run": {
            levelHandleMouseMove(state.level, event);
            break;
        }
    }
};

const handleClick = (event: MouseEvent): void => {
    const state = getGameState();
    switch (state.type) {
        case "levels": {
            levelSelectionHandleClick(time, event);
            playTune(SFX_CLICK);
            break;
        }
        case "run": {
            levelHandleClick(state.level, event);
            playTune(SFX_CLICK);
            break;
        }
    }
};

export const start = async (): Promise<void> => {
    initializeKeyboard();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    window.requestAnimationFrame(gameLoop);

    await initializeAudio();

    setStateLoaded(time);
};
