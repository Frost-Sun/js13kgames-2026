import type { TimeStep } from "./core/time/TimeStep";

export const canvas = document.querySelector("canvas") as HTMLCanvasElement;

export const cx: CanvasRenderingContext2D = canvas.getContext("2d")!;

cx.imageSmoothingEnabled = false;

export type DrawCommand = [
    x: number,
    y: number,
    w: number,
    h: number,
    dx: number,
    dy: number,
    ang: number,
    col: string | any, // Use any or a specific Canvas type for colors/gradients
];

/**
 * The core drawing function.
 * It takes a single DrawCommand tuple.
 */
export const drawPart = (params: DrawCommand) => {
    const [x, y, w, h, dx, dy, ang, col] = params;

    cx.save();
    cx.translate(dx, dy);
    cx.rotate(ang);
    cx.fillStyle = col;

    cx.beginPath();
    cx.roundRect(x, y, w, h, 2);
    cx.fill();

    cx.restore();
};

export const RainbowColors: Readonly<string[]> = [
    "red",
    "orange",
    "yellow",
    "green",
    "cyan",
    "blue",
    "violet",
];

/*
 * Draws a rainbow background that fills the entire canvas.
 * Returns the direction where the rainbow is moving in the x-axis.
 */
export const drawRainbowBackground = (
    time: TimeStep,
    start: number,
): 1 | -1 => {
    cx.save();

    const speed = 0.2;
    const stripeWidth = canvas.width / 2;

    const logicalWidth = (RainbowColors.length - 2) * stripeWidth;
    const stateStartTime = start || 0;
    const localTime = time.t - stateStartTime;

    const rawOffset = (localTime * speed) % (logicalWidth * 2);

    const offset =
        rawOffset > logicalWidth ? 2 * logicalWidth - rawOffset : rawOffset;

    for (let i = 0; i < RainbowColors.length; i++) {
        cx.fillStyle = RainbowColors[i];

        cx.fillRect(
            i * stripeWidth - offset,
            0,
            stripeWidth * 2,
            canvas.height,
        );
    }

    cx.restore();

    return rawOffset > logicalWidth ? 1 : -1;
};
