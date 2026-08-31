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
    applyCamera,
    CameraMode,
    screenToLevel,
    type Camera,
} from "./core/gameplay/Camera";
import type { TimeStep } from "./core/time/TimeStep";
import {
    CHARACTER_SPEED,
    GameObjectAction,
    UNICORN_HEIGHT,
    UNICORN_WIDTH,
    VELOCITY_DOWN,
    VELOCITY_LEFT,
    VELOCITY_RIGHT,
    VELOCITY_UP,
    type GameObject,
} from "./GameObject";
import type { GameStateRun } from "./GameState";
import { canvas, cx } from "./graphics";
import type { TileMap } from "./core/tiles/TileMap";
import {
    Arrow,
    drawMap,
    getTileAt,
    getTilePosAt,
    moveObject,
    TILE_HEIGHT,
    TILE_WIDTH,
    tileToArea,
    type Tile,
} from "./tiles";
import {
    getCenter,
    includesArea,
    includesPoint,
    overlap,
    type Area,
    type Dimensions,
} from "./core/math/Area";
import { setStateLevelFinished, setStateLose } from "./gamestates";
import { Action, actionToArrow, isApplicable } from "./Action";
import { distanceSquared, type Vector } from "./core/math/Vector";
import { playTune, SFX_HOME } from "./audio/sfx";

const CHARACTER_SPAWN_INTERVAL = 3000;

const MAX_CHARACTER_CLICK_DISTANCE = UNICORN_WIDTH * 0.75;

interface TilePosition {
    ix: number;
    iy: number;
}

// The portion of canvas on which the map is drawn.
const levelDrawArea: Dimensions = {
    width: canvas.width,
    height: canvas.height,
};

interface Button extends Area {
    text: string;
    action: Action;
}

const actionButtons: Button[] = [
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "UP",
        action: Action.Up,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "DOWN",
        action: Action.Down,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "LEFT",
        action: Action.Left,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "RIGHT",
        action: Action.Right,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "RAINBOW",
        action: Action.Rainbow,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "DIG",
        action: Action.Dig,
    },
];

export interface LevelParameters {
    readonly number: number;
    readonly introduction: string;
    readonly xCount: number;
    readonly yCount: number;
    readonly characterCount: number;
    readonly charactersToFinish: number;
    readonly actionCounts: Partial<Record<Action, number>>;
}

export interface Level extends TileMap<Tile>, LevelParameters {
    width: number;
    height: number;
    camera: Camera;
    tiles: (Tile | undefined)[];
    objects: GameObject[];
    startTile: TilePosition;
    finishArea: Area;
    charactersLeft: number;
    charactersLost: number;
    charactersFinished: number;
    lastSpawnTime: number;
    selectedActionIndex?: number;
    actionsUsed: Partial<Record<Action, number>>;
}

export const createLevel = (params: LevelParameters): Level => ({
    ...params,
    ix: 0,
    iy: 0,
    width: params.xCount * TILE_WIDTH,
    height: params.yCount * TILE_HEIGHT,
    camera: {
        mode: CameraMode.ShowWholeLevel,
        x: 50,
        y: 50,
        zoom: 8,
    },
    tiles: Array.from({ length: params.xCount * params.yCount }),
    objects: [],
    startTile: { ix: 0, iy: 0 },
    finishArea: { x: 0, y: 0, width: TILE_WIDTH, height: TILE_HEIGHT },
    charactersLeft: params.characterCount,
    charactersLost: 0,
    charactersFinished: 0,
    lastSpawnTime: 0,
    actionsUsed: {},
});

const toggleActionButton = (level: Level, i: number): void => {
    if (i === level.selectedActionIndex) {
        level.selectedActionIndex = undefined;
    } else {
        level.selectedActionIndex = i;
    }
};

const addCharacter = (level: Level): void => {
    const startPos = level.startTile;

    const character: GameObject = {
        type: "character",
        x: startPos.ix * TILE_WIDTH + (TILE_WIDTH - UNICORN_WIDTH) / 2,
        y: startPos.iy * TILE_HEIGHT + (TILE_HEIGHT - UNICORN_HEIGHT) / 2,
        width: UNICORN_WIDTH,
        height: UNICORN_HEIGHT,
        velocity: { x: CHARACTER_SPEED, y: 0 },
        action: GameObjectAction.Walk,
    };

    level.objects.push(character);
};

export const updateLevel = (time: TimeStep, state: GameStateRun): void => {
    const { level } = state;

    if (
        level.charactersLeft > 0 &&
        CHARACTER_SPAWN_INTERVAL < time.t - level.lastSpawnTime
    ) {
        level.lastSpawnTime = time.t;
        level.charactersLeft--;
        addCharacter(level);
    }

    for (let i = 0; i < level.objects.length; i++) {
        const o = level.objects[i];

        if (o.type === "character") {
            moveObject(time, level, o);

            if (overlap(o, level.finishArea)) {
                o.toDelete = true;
                level.charactersFinished++;

                if (level.charactersFinished >= level.charactersToFinish) {
                    setStateLevelFinished(state, time);
                }
                playTune(SFX_HOME);
            }

            const center = getCenter(o);
            const tile = getTileAt(level, center);
            const tilePos = getTilePosAt(center);

            if (
                tile?.type === "water" &&
                includesArea(tileToArea(tilePos), o)
            ) {
                killCharacter(time, state, o);
            } else if (
                tile?.arrow === Arrow.Up &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_UP;
            } else if (
                tile?.arrow === Arrow.Down &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_DOWN;
            } else if (
                tile?.arrow === Arrow.Left &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_LEFT;
            } else if (
                tile?.arrow === Arrow.Right &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_RIGHT;
            }
        }
    }

    level.objects = level.objects.filter((o) => !o.toDelete);
};

const killCharacter = (
    time: TimeStep,
    state: GameStateRun,
    o: GameObject,
): void => {
    const { level } = state;
    o.toDelete = true;
    level.charactersLost++;

    if (
        level.characterCount - level.charactersLost <
        level.charactersToFinish
    ) {
        setStateLose(state, time);
    }
};

const consumeAction = (level: Level, action: Action, tile: Tile): boolean => {
    if (!isApplicable(action, tile)) {
        return false;
    }

    if (!level.actionCounts[action]) {
        return false;
    }

    if (level.actionsUsed[action] == null) {
        level.actionsUsed[action] = 1;
        return true;
    }

    if (level.actionsUsed[action] < level.actionCounts[action]) {
        level.actionsUsed[action]++;
        return true;
    }

    return false;
};

let highlightedCharacter: GameObject | undefined;
let highlightedTile: Tile | undefined;

export const levelHandleMouseMove = (level: Level, event: MouseEvent): void => {
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const pointOnLevel = screenToLevel(camera, levelDrawArea, event);
        const selectedAction = actionButtons[level.selectedActionIndex].action;
        const tile = getTileAt(level, pointOnLevel);
        let character: GameObject | undefined;

        if (selectedAction != null && tile != null) {
            if (selectedAction === Action.Dig) {
                if (
                    (character = findClosestCharacter(
                        level,
                        pointOnLevel,
                        MAX_CHARACTER_CLICK_DISTANCE,
                    )) &&
                    character.action !== GameObjectAction.Dig
                ) {
                    highlightedCharacter = character;
                } else {
                    highlightedCharacter = undefined;
                }
            } else {
                if (isApplicable(selectedAction, tile)) {
                    highlightedTile = tile;
                } else {
                    highlightedTile = undefined;
                }
            }
        }
    }
};

export const levelHandleClick = (level: Level, event: MouseEvent): void => {
    // Check buttons
    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        if (includesPoint(button, event)) {
            toggleActionButton(level, i);
            return;
        }
    }

    // Check action click
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const pointOnLevel = screenToLevel(camera, levelDrawArea, event);
        const selectedAction = actionButtons[level.selectedActionIndex].action;
        const tile = getTileAt(level, pointOnLevel);
        let character: GameObject | undefined;

        if (selectedAction != null && tile != null) {
            if (selectedAction === Action.Rainbow) {
                if (consumeAction(level, selectedAction, tile)) {
                    tile.type = "rainbow";
                }
            } else if (selectedAction === Action.Dig) {
                if (
                    (character = findClosestCharacter(
                        level,
                        pointOnLevel,
                        MAX_CHARACTER_CLICK_DISTANCE,
                    )) &&
                    character.action !== GameObjectAction.Dig &&
                    consumeAction(level, selectedAction, tile)
                ) {
                    character.action = GameObjectAction.Dig;
                }
            } else if (
                selectedAction === Action.Up ||
                selectedAction === Action.Down ||
                selectedAction === Action.Left ||
                selectedAction === Action.Right
            ) {
                if (consumeAction(level, selectedAction, tile)) {
                    const arrow = actionToArrow(selectedAction);
                    if (arrow) {
                        tile.arrow = arrow;
                    }
                }
            }
        }
    }
};

const findClosestCharacter = (
    level: Level,
    point: Vector,
    maxDistance: number,
): GameObject | undefined => {
    let minDistance = Number.MAX_VALUE;
    let closestCharacter: GameObject | undefined;

    for (let i = 0; i < level.objects.length; i++) {
        const o = level.objects[i];
        if (o.type !== "character") {
            continue;
        }
        const dst = distanceSquared(point, getCenter(o));
        if (dst < maxDistance * maxDistance && dst < minDistance) {
            minDistance = dst;
            closestCharacter = o;
        }
    }

    return closestCharacter;
};

export const drawLevel = (time: TimeStep, level: Level): void => {
    const { camera } = level;

    const ButtonRowHeightFraction = 0.2;
    const buttonRowHeight = canvas.height * ButtonRowHeightFraction;
    const buttonRowY = canvas.height - buttonRowHeight;

    // Update the draw area on each draw so that it works also even when
    // the canvas is resized.
    levelDrawArea.width = canvas.width;
    levelDrawArea.height = canvas.height - buttonRowHeight;

    // Draw the level according to camera angle
    applyCamera(camera, cx, levelDrawArea, level, () => {
        drawMap(
            time,
            level,
            level.objects,
            highlightedTile,
            highlightedCharacter,
        );
    });

    // Draw button row
    const buttonWidth = Math.min(
        buttonRowHeight,
        levelDrawArea.width / actionButtons.length,
    );
    const buttonRowWidth = buttonWidth * actionButtons.length;
    const buttonRowX = (canvas.width - buttonRowWidth) / 2;

    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        const count =
            (level.actionCounts[button.action] ?? 0) -
            (level.actionsUsed[button.action] ?? 0);

        button.x = buttonRowX + i * buttonWidth;
        button.y = buttonRowY;
        button.width = buttonWidth;
        button.height = buttonRowHeight;

        cx.fillStyle =
            i === level.selectedActionIndex
                ? "rgb(120, 90, 90)"
                : "rgb(80, 50, 50)";
        cx.fillRect(button.x, button.y, button.width, button.height);

        cx.fillStyle = count > 0 ? "white" : "grey";
        cx.font = "38px Courier New";
        cx.fillText(
            button.text,
            button.x + button.width * 0.2,
            button.y + button.height / 2,
        );
        cx.font = "32px Courier New";
        cx.fillText(
            count.toString(),
            button.x + button.width * 0.4,
            button.y + button.height * 0.75,
        );
    }
};
