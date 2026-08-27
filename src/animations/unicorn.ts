/*
 * Copyright (c) 2026 Frost Sun
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

import {
    type GameObject,
    VELOCITY_UP,
    VELOCITY_DOWN,
    VELOCITY_LEFT,
} from "../GameObject";

import { cx, drawPart, type DrawCommand } from "../graphics";


/**
 * The function that actually renders the unicorn.
 * This is what you call in your main draw loop.
 */
export const renderUnicorn = (obj: GameObject) => {
    const age = performance.now() / 1000;
    const P = Math.PI;
    const scaleX = obj.velocity === VELOCITY_LEFT ? -1 : 1;

    const w = Math.sin(age * P * 8) * P / 8;
    const dy = Math.sin(age * P * 8) * 3;

    cx.save();
    cx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
    cx.scale((obj.height / 100) * scaleX, obj.height / 100);
    cx.translate(0, -25 + Math.sin(age * P * 4) * 2);

    if (obj.velocity === VELOCITY_DOWN) {
        const partsDown: DrawCommand[] = [
            [-3, 0, 6, 15, -7, 6 - dy, 0, '#d1d5db'],
            [-3, 0, 6, 15, 7, 6 + dy, 0, '#d1d5db'],
            [-3, 0, 6, 15, -6, 12 + dy, 0, '#f3f4f6'],
            [-3, 0, 6, 15, 6, 12 - dy, 0, '#f3f4f6'],

            [-10, -16, 20, 32, 0, 0, 0, '#fff'],
            [-8, -26, 16, 18, 0, 0, 0, '#f3f4f6'],

            [-2, -6, 4, 10, -8, -34, -P / 6, '#fff'],
            [-2, -6, 4, 10, 8, -34, P / 6, '#fff'],

            [-10, -34, 20, 18, 0, 0, 0, '#fff'],
            [-8, -16, 16, 14, 0, 0, 0, '#fff'],

            [-5, -6, 2, 3, 0, 0, 0, '#9ca3af'],
            [3, -6, 2, 3, 0, 0, 0, '#9ca3af'],

            [-11, -26, 2, 5, 0, 0, 0, '#111827'],
            [9, -26, 2, 5, 0, 0, 0, '#111827'],

            [-5, -38, 10, 12, 0, 0, 0, '#f472b6']
        ];
        partsDown.forEach(p => drawPart(p));

        cx.fillStyle = '#fbbf24';
        cx.beginPath();
        cx.moveTo(-3, -36);
        cx.lineTo(3, -36);
        cx.lineTo(0, -56);
        cx.fill();
    } else if (obj.velocity === VELOCITY_UP) {
        const partsUp: DrawCommand[] = [
            [-3, 0, 6, 15, -6, 12 - dy, 0, '#d1d5db'],
            [-3, 0, 6, 15, 6, 12 + dy, 0, '#d1d5db'],
            [-3, 0, 6, 15, -7, 6 + dy, 0, '#f3f4f6'],
            [-3, 0, 6, 15, 7, 6 - dy, 0, '#f3f4f6'],

            [-10, -16, 20, 32, 0, 0, 0, '#fff'],
            [-12, -2, 24, 18, 0, 0, 0, '#e5e7eb'],

            [-9, -32, 18, 22, 0, 0, 0, '#fff'],

            [-2, -6, 4, 10, -8, -28, -P / 6, '#fff'],
            [-2, -6, 4, 10, 8, -28, P / 6, '#fff'],

            [-6, -36, 12, 24, 0, 0, 0, '#f472b6'],
            [-5, 0, 10, 16, 0, 14, w, '#f472b6']
        ];
        partsUp.forEach(p => drawPart(p));

        cx.fillStyle = '#fbbf24';
        cx.beginPath();
        cx.moveTo(-2, -34);
        cx.lineTo(2, -34);
        cx.lineTo(0, -50);
        cx.fill();
    } else {
        const parts: DrawCommand[] = [
            [-3, 0, 6, 15, -10, 10, w, '#d1d5db'],
            [-3, 0, 6, 15, 10, 10, -w, '#d1d5db'],
            [-3, 0, 6, 15, -10, 10, -w, '#f3f4f6'],
            [-3, 0, 6, 15, 10, 10, w, '#f3f4f6'],
            [-12, 0, 12, 6, -16, -8, w / 2 - P / 8, '#f472b6'],
            [-16, -10, 32, 20, 0, 0, 0, '#fff'],

            [-5, -16, 10, 18, 14, -2, P / 6, '#fff'],
            [14, -26, 24, 16, 0, 0, 0, '#fff'],
            [28, -22, 3, 3, 0, 0, 0, '#111827'],

            [14, -28, 30, 4, 0, 0, 0, '#f472b6'],
            [0, -8, 8, 24, 12, -24, P / 4 - w / 4, '#f472b6'],
        ];
        parts.forEach(p => drawPart(p));

        cx.fillStyle = '#fbbf24';
        cx.beginPath();
        cx.moveTo(18, -26);
        cx.lineTo(26, -42);
        cx.lineTo(26, -26);
        cx.fill();
    }

    cx.restore();
};
