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
import { playTune, SFX_INTRO, SFX_RUNNING } from "./audio/sfx";
import type { TimeStep } from "./core/time/TimeStep";
import {
    getGameState,
    setGameState,
    WAIT_FOR_NEXT_STATE,
    type GameStateLevelFinished,
    type GameStateLose,
    type GameStateRun,
} from "./GameState";
import { createMap, maps } from "./maps";
import { load, saveHighestLevel } from "./storage";
import { setSpeedRatio } from "./GameObject";
import { sleep } from "./core/time/sleep";
import { clearLevelControls } from "./Level";

export const setStateLoaded = (time: TimeStep): void => {
    setGameState({
        type: "loaded",
        start: time.t,
    });
    waitForInteraction(SFX_INTRO).then(() => setStateIntro(time));
};

export const setStateIntro = (time: TimeStep): void => {
    setGameState({
        type: "intro",
        start: time.t,
    });
    playTune(SFX_INTRO);
    sleep(WAIT_FOR_NEXT_STATE)
        .then(() => waitForInteraction())
        .then(() => setStateLevelSelection(time));
};

export const setStateLevelSelection = (time: TimeStep): void => {
    const persistentState = load();
    setGameState({
        type: "levels",
        start: time.t,
        highestLevel: persistentState.highestLevel,
    });
    playTune(SFX_INTRO);
    waitForKey("Escape").then(() => setStateIntro(time));
};

export const setStateRun = (
    time: TimeStep,
    mapIndex: number | undefined = undefined,
): void => {
    const currentState = getGameState();
    playTune(SFX_RUNNING);
    setSpeedRatio(1);
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
    clearLevelControls(currentState.level);
    setGameState({
        type: "finished",
        start: time.t,
        level: currentState.level,
    });
    saveHighestLevel(currentState.level.number + 1);
    sleep(WAIT_FOR_NEXT_STATE)
        .then(() => waitForInteraction())
        .then(() => setStateRun(time));
};

export const setStateLose = (
    currentState: GameStateRun,
    time: TimeStep,
): void => {
    clearLevelControls(currentState.level);
    setGameState({
        type: "lose",
        start: time.t,
        level: currentState.level,
    });
    sleep(WAIT_FOR_NEXT_STATE)
        .then(() => waitForInteraction())
        .then(() => setStateRun(time, currentState.level.number));
};

export const setStateWin = (
    currentState: GameStateLevelFinished,
    time: TimeStep,
): void => {
    clearLevelControls(currentState.level);
    setGameState({
        type: "win",
        start: time.t,
        level: currentState.level,
    });
    sleep(WAIT_FOR_NEXT_STATE)
        .then(() => waitForInteraction())
        .then(() => setStateIntro(time));
};

export const isLastLevel = (
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
): boolean => state.level.number === maps.length - 1;
