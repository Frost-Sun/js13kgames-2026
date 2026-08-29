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

import { cx } from "../graphics";

export interface StrawParams {
    // Gives variance to wobble animation
    wobblePhase: number;

    width: number;
    height: number;
    xAdjust: number;
    yAdjust: number;
}

export const renderStraw = (
    x: number,
    y: number,
    params: StrawParams,
    t: number,
): void => {
    const { wobblePhase, width, height, xAdjust, yAdjust } = params;
    const angle = 0.25 * (Math.sin(t / 640 + wobblePhase) * (Math.PI / 8));
    cx.save();
    cx.translate(x + xAdjust, y + yAdjust);
    cx.rotate(angle);
    cx.fillRect(-width / 2, -height / 2, width / 2, height / 2);
    cx.restore();
};
