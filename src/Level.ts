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

import { updateCamera, type Camera } from "./core/gameplay/Camera";
import type { TimeStep } from "./core/time/TimeStep";
import { CHARACTER_SPEED, type GameObject } from "./GameObject";
import type { GameStateRun } from "./GameState";
import { canvas, cx } from "./graphics";
import type { TileMap } from "./core/tiles/TileMap";
import {
    drawMap,
    getTileAt,
    moveObject,
    TILE_HEIGHT,
    TILE_WIDTH,
    tileToArea,
    type Tile,
} from "./tiles";
import { createAi, getAiAction } from "./ai";
import { multiply } from "./core/math/Vector";
import { getCenter, includesArea, overlap, type Area } from "./core/math/Area";
import { setStateLevelFinished, setStateLose } from "./gamestates";

const CHARACTER_SPAWN_INTERVAL = 3000;

interface TilePosition {
    ix: number;
    iy: number;
}

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
}

const addCharacter = (level: Level): void => {
    const width = 5,
        height = 4;
    const startPos = level.startTile;

    const character: GameObject = {
        type: "character",
        x: startPos.ix * TILE_WIDTH + (TILE_WIDTH - width) / 2,
        y: startPos.iy * TILE_HEIGHT + (TILE_HEIGHT - height) / 2,
        width,
        height,
        ai: createAi(),
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
            const action = getAiAction(time, level, o);
            const movement = multiply(action, CHARACTER_SPEED);
            moveObject(time, level, o, movement);

            if (overlap(o, level.finishArea)) {
                o.toDelete = true;
                level.charactersFinished++;

                if (level.charactersFinished >= level.charactersToFinish) {
                    setStateLevelFinished(state, time);
                }
            }

            const center = getCenter(o);
            const tile = getTileAt(level, center);
            if (tile?.type === "water" && includesArea(tileToArea(tile), o)) {
                killCharacter(time, state, o);
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

export const drawLevel = (time: TimeStep, level: Level): void => {
    const { camera } = level;
    updateCamera(camera, canvas, level);

    cx.save();

    cx.translate(canvas.width / 2, canvas.height / 2);
    cx.scale(camera.zoom, camera.zoom);
    cx.translate(-camera.x, -camera.y);

    drawMap(time, level, level.objects);

    cx.restore();
};
