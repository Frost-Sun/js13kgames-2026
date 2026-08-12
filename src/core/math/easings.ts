/*
 * Easing functions from
 * https://easings.net/
 */

export function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

export function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

export function easeInQuad(x: number): number {
    return x * x;
}

export function easeInOutExpo(x: number): number {
    return x === 0
        ? 0
        : x === 1
          ? 1
          : x < 0.5
            ? Math.pow(2, 20 * x - 10) / 2
            : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

export function easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
        ? 0
        : x === 1
          ? 1
          : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}
