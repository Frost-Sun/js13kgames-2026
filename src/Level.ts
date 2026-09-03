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
import type {
    GameStateLevelFinished,
    GameStateLose,
    GameStateRun,
} from "./GameState";
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
import { Action, actionIsArrow, actionToArrow, isApplicable } from "./Action";
import { distanceSquared, ZERO_VECTOR, type Vector } from "./core/math/Vector";
import { playTune, SFX_HOME } from "./audio/sfx";
import type { Theme } from "./theme";
import { mousePositionToCanvasPosition } from "./core/platform/window";

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
    action?: Action;
}

const actionButtons: Button[] = [
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "🗺️",
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "▲",
        action: Action.Up,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "▼",
        action: Action.Down,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "◀",
        action: Action.Left,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "▶",
        action: Action.Right,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "🌈",
        action: Action.Rainbow,
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "🦄",
    },
    {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        text: "⛏️",
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
    readonly theme?: Theme;
}

export interface Level extends TileMap<Tile>, LevelParameters {
    width: number;
    height: number;
    camera: Camera;
    tiles: (Tile | undefined)[];
    objects: GameObject[];
    objectsToAdd: GameObject[];
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
    objectsToAdd: [],
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

const createSplash = (time: TimeStep, position: Vector): GameObject => ({
    type: "splash",
    x: position.x,
    y: position.y,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    velocity: ZERO_VECTOR,
    createTime: time.t,
});

export const updateLevel = (
    time: TimeStep,
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
): void => {
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

                if (
                    state.type === "run" &&
                    level.charactersFinished >= level.charactersToFinish
                ) {
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
                level.objectsToAdd.push(
                    createSplash(time, {
                        x: o.x + o.width / 2,
                        y: o.y + o.height / 2,
                    }),
                );
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
    level.objects.push(...level.objectsToAdd);
    level.objectsToAdd = [];
};

const killCharacter = (
    time: TimeStep,
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
    o: GameObject,
): void => {
    const { level } = state;
    o.toDelete = true;
    level.charactersLost++;

    if (
        state.type === "run" &&
        level.characterCount - level.charactersLost < level.charactersToFinish
    ) {
        setStateLose(state, time);
    }
};

const hasActionsLeft = (level: Level, action: Action): boolean =>
    !!level.actionCounts[action] &&
    (level.actionsUsed[action] == null ||
        level.actionsUsed[action] < level.actionCounts[action]);

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
        const position = mousePositionToCanvasPosition(canvas, event);
        const pointOnLevel = screenToLevel(camera, levelDrawArea, position);
        const selectedAction = actionButtons[level.selectedActionIndex].action;
        const tile = getTileAt(level, pointOnLevel);
        let character: GameObject | undefined;

        if (
            selectedAction != null &&
            hasActionsLeft(level, selectedAction) &&
            tile != null
        ) {
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
        } else {
            highlightedTile = undefined;
            highlightedCharacter = undefined;
        }
    }
};

export const levelHandleClick = (level: Level, event: MouseEvent): void => {
    const position = mousePositionToCanvasPosition(canvas, event);

    // Check buttons
    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        if (includesPoint(button, position)) {
            toggleActionButton(level, i);
            return;
        }
    }

    // Check action click
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const pointOnLevel = screenToLevel(camera, levelDrawArea, position);
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
            } else if (actionIsArrow(selectedAction)) {
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

    const ButtonRowHeightFraction = 0.15;
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
            level.theme ?? "summer",
        );
    });

    // Draw button row
    const buttonWidth = canvas.width / actionButtons.length;
    const buttonRowX = 0;

    const fontSize = Math.floor(28 * (canvas.width / 1000));

    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        const count =
            button.action != null &&
            (level.actionCounts[button.action] ?? 0) -
                (level.actionsUsed[button.action] ?? 0);

        button.x = buttonRowX + i * buttonWidth;
        button.y = buttonRowY;
        button.width = buttonWidth - 2;
        button.height = buttonRowHeight;

        cx.save();

        // Determine color based on selection or hover
        let fillColor = "rgb(133, 11, 72)";
        if (button.action) {
            fillColor =
                i === level.selectedActionIndex
                    ? "rgb(219, 52, 141)"
                    : "rgb(172, 15, 94)";
        }

        cx.fillStyle = fillColor;

        cx.fillRect(button.x, button.y, button.width, button.height);

        cx.fillStyle = "rgba(0, 0, 0, 0.25)";

        cx.fillRect(
            button.x,
            button.y + button.height / 2,
            button.width,
            button.height / 2,
        );

        cx.textAlign = "center";
        cx.textBaseline = "middle";

        cx.fillStyle = "rgb(253, 240, 247)";
        cx.font = `${fontSize}px Courier New`;
        cx.fillText(
            button.text,
            button.x + button.width / 2,
            button.y + button.height / 3,
        );

        if (button.action) {
            cx.font = `${fontSize}px Courier New`;
            cx.fillText(
                count.toString(),
                button.x + button.width / 2,
                button.y + button.height * 0.75,
            );
        }

        cx.restore();
    }
};
