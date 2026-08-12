import { canvas, cx } from "./graphics";

const TIME_STEP = 1000 / 60;
const MAX_FRAME = TIME_STEP * 5;

interface TimeStep {
    t: number;
    dt: number;
}

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

let x = 0;
let y = 0;

const update = (time: TimeStep): void => {
    const newX = x + time.dt * 0.5;
    const newY = time.t < 5000 ? (time.t / 5000) * 300 : 300;
    x = newX < canvas.width ? newX : 0;
    y = newY;
};

const draw = (time: TimeStep): void => {
    cx.save();
    cx.fillStyle = "black";
    cx.fillRect(0, 0, canvas.width, canvas.height);
    cx.fillStyle = `rgb(100, 100, ${200 + Math.sin(time.t / 500) * 55})`;
    cx.fillRect(x, y, 150, 150);
    cx.restore();
};

export const start = async (): Promise<void> => {
    window.requestAnimationFrame(gameLoop);
};
