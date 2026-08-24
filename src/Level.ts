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
    screenToLevel,
    type Camera,
} from "./core/gameplay/Camera";
import type { TimeStep } from "./core/time/TimeStep";
import {
    CHARACTER_SPEED,
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
    drawMap,
    getTileAt,
    getTilePosAt,
    moveObject,
    TILE_HEIGHT,
    TILE_WIDTH,
    tileToArea,
    type Tile,
    type TileType,
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
import { Action } from "./Action";

const CHARACTER_SPAWN_INTERVAL = 3000;

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
];

export interface Level extends TileMap<Tile> {
    number: number;
    introduction: string;
    xCount: number;
    yCount: number;
    width: number;
    height: number;
    camera: Camera;
    tiles: (Tile | undefined)[];
    objects: GameObject[];
    startTile: TilePosition;
    finishArea: Area;
    charactersTotal: number;
    charactersToFinish: number;
    charactersLeft: number;
    charactersLost: number;
    charactersFinished: number;
    lastSpawnTime: number;
    selectedActionIndex?: number;
}

const toggleActionButton = (level: Level, i: number): void => {
    if (i === level.selectedActionIndex) {
        level.selectedActionIndex = undefined;
    } else {
        level.selectedActionIndex = i;
    }
};

const addCharacter = (level: Level): void => {
    const width = 5, height = 4;
    const startPos = level.startTile;

    const character: GameObject = {
        type: "character",
        x: startPos.ix * TILE_WIDTH + (TILE_WIDTH - width) / 2,
        y: startPos.iy * TILE_HEIGHT + (TILE_HEIGHT - height) / 2,
        width,
        height,
        velocity: { x: CHARACTER_SPEED, y: 0 },
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
                tile?.type === "up" &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_UP;
            } else if (
                tile?.type === "down" &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_DOWN;
            } else if (
                tile?.type === "left" &&
                includesArea(tileToArea(tilePos), o)
            ) {
                o.velocity = VELOCITY_LEFT;
            } else if (
                tile?.type === "right" &&
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
        level.charactersTotal - level.charactersLost <
        level.charactersToFinish
    ) {
        setStateLose(state, time);
    }
};

export const levelHandleClick = (level: Level, event: MouseEvent): void => {
    // Check buttons
    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        if (includesPoint(button, event)) {
            toggleActionButton(level, i);
        }
    }

    // Check click on a tile
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const pointOnLevel = screenToLevel(camera, levelDrawArea, event);
        const tile = getTileAt(level, pointOnLevel);

        if (tile && tile.type === "grass") {
            const selectedAction =
                actionButtons[level.selectedActionIndex].action;
            const tileType = actionToTileType(selectedAction);
            if (tileType) {
                tile.type = tileType;
            }
        }
    }
};

const actionToTileType = (action: Action): TileType | undefined => {
    switch (action) {
        case Action.Up:
            return "up";
        case Action.Down:
            return "down";
        case Action.Left:
            return "left";
        case Action.Right:
            return "right";

        default:
            return undefined;
    }
};

export const drawLevel = (time: TimeStep, level: Level): void => {
    const { camera } = level;

    const ButtonRowHeightFraction = 0.2;
    const buttonRowHeight = canvas.height * ButtonRowHeightFraction;
    const buttonWidth = buttonRowHeight;
    const buttonRowY = canvas.height - buttonRowHeight;

    // Update the draw area on each draw so that it works also even when
    // the canvas is resized.
    levelDrawArea.width = canvas.width;
    levelDrawArea.height = canvas.height - buttonRowHeight;

    // Draw the level according to camera angle

    applyCamera(camera, cx, levelDrawArea, level, () => {
        drawMap(time, level, level.objects);
    });

    // Draw button row
    const buttonRowWidth = buttonWidth * actionButtons.length;
    const buttonRowX = (canvas.width - buttonRowWidth) / 2;

    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        button.x = buttonRowX + i * buttonWidth;
        button.y = buttonRowY;
        button.width = buttonWidth;
        button.height = buttonRowHeight;

        cx.fillStyle =
            i === level.selectedActionIndex
                ? "rgb(120, 90, 90)"
                : "rgb(80, 50, 50)";
        cx.fillRect(button.x, button.y, button.width, button.height);

        cx.fillStyle = "white";
        cx.font = "38px Courier New";
        cx.fillText(
            button.text,
            button.x + button.width * 0.3,
            button.y + button.height / 2,
        );
    }
};
