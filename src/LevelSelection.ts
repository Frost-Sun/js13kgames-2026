import { includesPoint, type Area } from "./core/math/Area";
import type { TimeStep } from "./core/time/TimeStep";
import type { GameStateLevelSelection } from "./GameState";
import { setStateRun } from "./gamestates";
import { canvas, cx, drawRainbowBackground } from "./graphics";
import { maps } from "./maps";

interface Button extends Area {
    text: string;
}

const buttons: Button[] = maps.map((_, i) => ({
    text: (i + 1).toString(),

    // Button positions are set in the draw function
    // so that changes in window size are taken care of.
})) as Button[];

export const drawLevelSelection = (
    time: TimeStep,
    state: GameStateLevelSelection,
): void => {
    cx.save();

    drawRainbowBackground(time, state.start);

    const iconWidth = Math.max(150, canvas.width / 10);
    const iconHeight = iconWidth;
    const marginX = 20;
    const marginY = 20;
    const iconsPerRow = Math.floor(
        (canvas.width - marginX) / (iconWidth + marginX),
    );

    cx.strokeStyle = "rgb(10, 100, 10)";
    cx.lineWidth = 5;
    cx.font = "38px Courier New";

    for (let i = 0; i < maps.length; i++) {
        const x = marginX + (i % iconsPerRow) * (iconWidth + marginX);
        const y =
            marginY + Math.floor(i / iconsPerRow) * (iconHeight + marginY);

        const button = buttons[i];
        button.text = (i + 1).toString();
        button.x = x;
        button.y = y;
        button.width = iconWidth;
        button.height = iconHeight;

        cx.fillStyle = "rgb(10, 150, 10)";
        cx.fillRect(button.x, button.y, button.width, button.height);
        cx.strokeRect(button.x, button.y, button.width, button.height);
        cx.fillStyle = "yellow";
        cx.fillText(
            button.text,
            button.x + iconWidth * 0.4,
            button.y + iconHeight * 0.6,
        );
    }

    cx.restore();
};

export const levelSelectionHandleClick = (
    time: TimeStep,
    event: MouseEvent,
): void => {
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (includesPoint(button, event)) {
            setStateRun(time, i);
            return;
        }
    }
};
