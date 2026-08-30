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

import type { Level } from "./Level";

export type GameStateLoad = {
    type: "load";
};

export type GameStateLoaded = {
    type: "loaded";
    start: number;
};

export type GameStateIntro = {
    type: "intro";
    start: number;
};

export type GameStateLevelSelection = {
    type: "levels";
    start: number;
};

export type GameStateRun = {
    type: "run";
    start: number;
    level: Level;
};

export type GameStateLevelFinished = {
    type: "finished";
    start: number;
    level: Level;
};

export type GameStateLose = {
    type: "lose";
    level: Level;
};

export type GameStateWin = {
    type: "win";
    start: number;
    level: Level;
};

export type GameState =
    | GameStateLoad
    | GameStateLoaded
    | GameStateIntro
    | GameStateLevelSelection
    | GameStateRun
    | GameStateLevelFinished
    | GameStateLose
    | GameStateWin;

export type CleanupFunction = () => void;

let state: GameState = { type: "load" };
let cleanup: CleanupFunction | undefined;

export const getGameState = (): GameState => state;

export const setGameState = (
    newState: GameState,
    newCleanup?: CleanupFunction,
): void => {
    if (cleanup) {
        cleanup();
    }

    state = newState;
    cleanup = newCleanup;
};
