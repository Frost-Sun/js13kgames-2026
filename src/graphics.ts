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
 * Returns the direction where the rainbow is moving in the x-axis or zoom.
 */
export const drawRainbowBackground = (
    time: TimeStep,
    start: number,
    zoom?: boolean,
): 1 | -1 => {
    cx.save();

    const speed = 0.2;
    const stripeWidth = canvas.width / 2;

    const logicalWidth = (RainbowColors.length - 2) * stripeWidth;
    const localTime = time.t - (start || 0);

    const rawOffset = (localTime * speed) % (logicalWidth * 2);
    const offset =
        rawOffset > logicalWidth ? 2 * logicalWidth - rawOffset : rawOffset;

    const totalWidth = RainbowColors.length * stripeWidth;
    const centerOffset = totalWidth / 2 - canvas.width / 2;

    const xOffset = zoom ? centerOffset : offset;

    if (zoom) {
        const w2 = canvas.width / 2;
        const targetScale = canvas.width / totalWidth;

        const progress = Math.min((localTime * speed) / logicalWidth, 1.0);

        const scale = 1.0 - progress * (1.0 - targetScale);

        cx.translate(w2, 0);
        cx.scale(scale, 1);
        cx.translate(-w2, 0);
    }

    for (let i = 0; i < RainbowColors.length; i++) {
        cx.fillStyle = RainbowColors[i];

        cx.fillRect(
            i * stripeWidth - xOffset,
            0,
            stripeWidth * 2,
            canvas.height,
        );
    }

    cx.restore();

    return rawOffset > logicalWidth ? 1 : -1;
};
