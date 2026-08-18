import { initializeAudio } from "./audio/sfx";
import { initializeKeyboard } from "./core/controls/keyboard";
import { easeOutElastic } from "./core/math/easings";
import type { TimeStep } from "./core/time/TimeStep";
import { getGameState } from "./GameState";
import { setStateIntro } from "./gamestates";
import { canvas, cx } from "./graphics";
import { drawLevel, levelHandleClick, updateLevel } from "./Level";

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
            cx.fillStyle = "white";
            cx.font = "48px Courier New";
            cx.fillText("LOADING...", canvas.width * 0.33, canvas.height / 2);
            cx.restore();
            break;
        }
        case "intro": {
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);
            cx.fillStyle = "white";
            cx.font = "96px Courier New";
            const phase = easeOutElastic((time.t - state.start) / 1000);
            cx.fillText(
                "GAME TITLE",
                canvas.width * 0.1,
                phase * canvas.height * 0.5,
            );
            cx.font = "48px Courier New";
            cx.fillText(
                "[PRESS SPACE] ",
                canvas.width * 0.3,
                canvas.height * 0.7,
            );
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

            cx.fillStyle = "white";
            cx.font = "38px Courier New";
            cx.fillText(
                `Finish: ${level.charactersFinished} / ${level.charactersToFinish}`,
                canvas.width * 0.05,
                canvas.height * 0.05,
            );

            if (state.type === "run") {
                if (time.t - state.start < IntroductionTextTime) {
                    cx.fillStyle = "white";
                    cx.font = "38px Courier New";
                    const phase = 1;
                    cx.fillText(
                        level.introduction,
                        canvas.width * 0.15,
                        phase * canvas.height * 0.3,
                    );
                }
            } else if (state.type === "finished") {
                cx.fillStyle = "white";
                cx.font = "96px Courier New";
                cx.fillText(
                    "LEVEL FINISHED",
                    canvas.width * 0.2,
                    canvas.height * 0.5,
                );

                cx.font = "48px Courier New";
                cx.fillText(
                    "[PRESS SPACE] ",
                    canvas.width * 0.3,
                    canvas.height * 0.7,
                );
            } else if (state.type === "lose") {
                cx.fillStyle = "white";
                cx.font = "96px Courier New";
                const phase = 1;
                cx.fillText(
                    "YOU LOSE :( ",
                    canvas.width * 0.2,
                    phase * canvas.height * 0.5,
                );

                cx.font = "48px Courier New";
                cx.fillText(
                    "[PRESS SPACE] ",
                    canvas.width * 0.3,
                    canvas.height * 0.7,
                );
            }

            cx.restore();
            break;
        }
        case "win": {
            cx.save();

            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            cx.fillStyle = "white";
            cx.font = "96px Courier New";
            const phase = easeOutElastic((time.t - state.start) / 1000);
            cx.fillText(
                "YOU WIN!",
                canvas.width * 0.2,
                phase * canvas.height * 0.5,
            );

            cx.font = "48px Courier New";
            cx.fillText(
                "[PRESS SPACE] ",
                canvas.width * 0.3,
                canvas.height * 0.7,
            );

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

    setStateIntro(time);
};
