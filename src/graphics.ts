export const canvas = document.querySelector("canvas") as HTMLCanvasElement;

export const cx: CanvasRenderingContext2D = canvas.getContext("2d")!;

export type DrawCommand = [
    x: number,
    y: number,
    w: number,
    h: number,
    dx: number,
    dy: number,
    ang: number,
    col: string | any // Use any or a specific Canvas type for colors/gradients
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
