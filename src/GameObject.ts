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

import type { Area } from "./core/math/Area";
import type { Vector } from "./core/math/Vector";

export const CHARACTER_SPEED = 0.005;

export const VELOCITY_UP: Vector = { x: 0, y: -CHARACTER_SPEED };
export const VELOCITY_DOWN: Vector = { x: 0, y: CHARACTER_SPEED };
export const VELOCITY_LEFT: Vector = { x: -CHARACTER_SPEED, y: 0 };
export const VELOCITY_RIGHT: Vector = { x: CHARACTER_SPEED, y: 0 };

export type GameObjectType = "rock" | "character" | "finish";

export interface GameObject extends Area {
    type: GameObjectType;
    x: number;
    y: number;
    width: number;
    height: number;
    velocity?: Vector;
    toDelete?: boolean;
}
