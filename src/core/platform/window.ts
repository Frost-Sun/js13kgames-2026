/*
 * Copyright (c) 2025 - 2026 Frost Sun
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { type Vector, type VectorMutable } from "../math/Vector";

let canvasScale = 1;

export const resizeCanvasMaintainingAspectRatio = (
    canvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number,
): void => {
    const aspectRatio = maxWidth / maxHeight;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Ensure the width and height do not exceed the maximum resolution
    if (width > maxWidth) {
        width = maxWidth;
    }
    if (height > maxHeight) {
        height = maxHeight;
    }

    height = maxWidth / aspectRatio;
    width = maxHeight * aspectRatio;

    const finalWidth = Math.floor(width);
    const finalHeight = Math.floor(height);

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const scaleX = window.innerWidth / finalWidth;
    const scaleY = window.innerHeight / finalHeight;
    const scale = Math.min(scaleX, scaleY);

    canvasScale = scale;

    canvas.style.position = "absolute";
    // Calculate offsets and floor them to ensure they are on the pixel grid
    const offsetX = Math.floor((window.innerWidth - finalWidth * scale) / 2);
    const offsetY = Math.floor((window.innerHeight - finalHeight * scale) / 2);

    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;

    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = "top left";
};

export const mousePositionToCanvasPosition = (
    canvas: HTMLCanvasElement,
    event: MouseEvent,
): Vector => {
    const offset = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - offset.left) / canvasScale,
        y: (event.clientY - offset.top) / canvasScale,
    };
};

export const setCanvasPositionFromScreenPosition = (
    canvas: HTMLCanvasElement,
    target: VectorMutable,
    touch: Touch,
): void => {
    const offset = canvas.getBoundingClientRect();
    target.x = (touch.clientX - offset.left) / canvasScale;
    target.y = (touch.clientY - offset.top) / canvasScale;
};
