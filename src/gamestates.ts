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

import { waitForKey, waitForInteraction } from "./core/controls/keyboard";
import { SFX_RUNNING } from "./audio/sfx";
import type { TimeStep } from "./core/time/TimeStep";
import {
    getGameState,
    setGameState,
    type GameStateLevelFinished,
    type GameStateRun,
} from "./GameState";
import { createMap, maps } from "./maps";
import { load, saveHighestLevel } from "./storage";

export const setStateLoaded = (time: TimeStep): void => {
    setGameState({
        type: "loaded",
        start: time.t,
    });
    waitForInteraction(SFX_RUNNING).then(() => setStateIntro(time));
};

export const setStateIntro = (time: TimeStep): void => {
    setGameState({
        type: "intro",
        start: time.t,
    });
    waitForInteraction().then(() => setStateLevelSelection(time));
};

export const setStateLevelSelection = (time: TimeStep): void => {
    const persistentState = load();
    setGameState({
        type: "levels",
        start: time.t,
        highestLevel: persistentState.highestLevel,
    });
    waitForKey("Escape").then(() => setStateIntro(time));
};

export const setStateRun = (
    time: TimeStep,
    mapIndex: number | undefined = undefined,
): void => {
    const currentState = getGameState();

    if (mapIndex != null) {
        setGameState({
            type: "run",
            start: time.t,
            level: createMap(mapIndex),
        });
        waitForKey("Escape").then(() => setStateLevelSelection(time));
    } else if (currentState.type !== "finished") {
        setGameState({
            type: "run",
            start: time.t,
            level: createMap(0),
        });
        waitForKey("Escape").then(() => setStateLevelSelection(time));
    } else if (currentState.level.number + 1 < maps.length) {
        setGameState({
            type: "run",
            start: time.t,
            level: createMap(currentState.level.number + 1),
        });
        waitForKey("Escape").then(() => setStateLevelSelection(time));
    } else {
        setStateWin(currentState, time);
    }
};

export const setStateLevelFinished = (
    currentState: GameStateRun,
    time: TimeStep,
): void => {
    setGameState({
        type: "finished",
        start: time.t,
        level: currentState.level,
    });
    saveHighestLevel(currentState.level.number + 1);
    waitForInteraction().then(() => setStateRun(time));
};

export const setStateLose = (
    currentState: GameStateRun,
    time: TimeStep,
): void => {
    setGameState({
        type: "lose",
        level: currentState.level,
    });
    waitForInteraction().then(() => setStateIntro(time));
};

export const setStateWin = (
    currentState: GameStateLevelFinished,
    time: TimeStep,
): void => {
    setGameState({
        type: "win",
        start: time.t,
        level: currentState.level,
    });
    waitForInteraction().then(() => setStateIntro(time));
};
