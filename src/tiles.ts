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

import { ZERO_VECTOR, type Vector } from "./core/math/Vector";
import type { TimeStep } from "./core/time/TimeStep";
import { type GameObject } from "./GameObject";
import { cx } from "./graphics";
import type { TileArea } from "./core/tiles/TileArea";
import { tileMapGet, tileMapSet, type TileMap } from "./core/tiles/TileMap";
import type { Area } from "./core/math/Area";
import { renderStraw, type StrawParams } from "./animations/straw";
import { random } from "./core/math/random";

export const TILE_WIDTH = 10;
export const TILE_HEIGHT = 10;

export type TileType =
    | "grass"
    | "rock"
    | "water"
    | "start"
    | "finish"
    | "up"
    | "down"
    | "left"
    | "right";

export interface Tile {
    type: TileType;
    object?: GameObject;
    finish?: boolean;
    straw?: StrawParams;
}

export const getTileCenter = (ix: number, iy: number): Vector => {
    return {
        x: ix * TILE_WIDTH + TILE_WIDTH / 2,
        y: iy * TILE_HEIGHT + TILE_HEIGHT / 2,
    };
};

export const getTilePosAt = (position: Vector): { ix: number; iy: number } => {
    const ix = Math.floor(position.x / TILE_WIDTH);
    const iy = Math.floor(position.y / TILE_HEIGHT);
    return { ix, iy };
};

export const getTileAt = (
    map: TileMap<Tile>,
    position: Vector,
): Tile | undefined => {
    const ix = Math.floor(position.x / TILE_WIDTH);
    const iy = Math.floor(position.y / TILE_HEIGHT);
    return tileMapGet(map, ix, iy);
};

export const tileToArea = (pos: { ix: number; iy: number }): Area => ({
    x: pos.ix * TILE_WIDTH,
    y: pos.iy * TILE_HEIGHT,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
});

export const isOnArea = (o: GameObject, area: TileArea): boolean => {
    const areaX = area.ix * TILE_WIDTH;
    const areaY = area.iy * TILE_HEIGHT;
    const areaWidth = area.xCount * TILE_WIDTH;
    const areaHeight = area.yCount * TILE_HEIGHT;
    return (
        areaX <= o.x &&
        o.x + o.width <= areaX + areaWidth &&
        areaY <= o.y &&
        o.y + o.height <= areaY + areaHeight
    );
};

export const findTilePosition = (
    map: TileMap<Tile>,
    type: TileType,
): { ix: number; iy: number } | undefined => {
    for (let iy = 0; iy < map.yCount; iy++) {
        for (let ix = 0; ix < map.xCount; ix++) {
            const tile = tileMapGet(map, ix, iy);
            if (tile?.type === type) {
                return { ix, iy };
            }
        }
    }

    return undefined;
};

const createTile = (
    type: TileType,
    ix: number,
    iy: number,
    finish?: boolean,
): Tile | undefined => {
    switch (type) {
        case "rock":
            return {
                type,
                object: {
                    type: "rock",
                    x: ix * TILE_WIDTH,
                    y: iy * TILE_HEIGHT,
                    width: TILE_WIDTH,
                    height: TILE_HEIGHT,
                },
            };
        case "finish":
            return {
                type,
                object: {
                    type: "finish",
                    x: ix * TILE_WIDTH,
                    y: iy * TILE_HEIGHT,
                    width: TILE_WIDTH,
                    height: TILE_HEIGHT,
                },
            };
        case "grass":
            return {
                type,
                finish,
                straw:
                    random() > 0.2
                        ? {
                              wobblePhase: random(Math.PI),
                              width: TILE_WIDTH / 16,
                              height: random(TILE_HEIGHT / 4) + TILE_HEIGHT / 8,
                              xAdjust: random(TILE_WIDTH),
                              yAdjust: random(TILE_HEIGHT),
                          }
                        : undefined,
            };
        default:
            return {
                type,
                finish,
            };
    }
};

const setTile = (
    map: TileMap<Tile>,
    type: TileType | undefined,
    ix: number,
    iy: number,
    finish?: boolean,
): void => {
    const tile = type ? createTile(type, ix, iy, finish) : undefined;
    tileMapSet(map, tile, ix, iy);
};

export const fill = (
    map: TileMap<Tile>,
    area: TileArea,
    tile?: TileType,
    finish?: boolean,
): void => {
    for (let iy = area.iy; iy < area.iy + area.yCount; iy++) {
        for (let ix = area.ix; ix < area.ix + area.xCount; ix++) {
            setTile(map, tile, ix, iy, finish);
        }
    }
};

export const isBlocking = (
    map: TileMap<Tile>,
    ix: number,
    iy: number,
): boolean => {
    const o = tileMapGet(map, ix, iy)?.object;
    return (
        (o != null && o.type !== "finish") ||
        ix < 0 ||
        ix >= map.xCount ||
        iy < 0 ||
        iy >= map.yCount
    );
};

export const moveObject = (
    time: TimeStep,
    map: TileMap<Tile>,
    o: GameObject,
): void => {
    const velocity = o.velocity ?? ZERO_VECTOR;
    let dx = velocity.x * time.dt;
    let dy = velocity.y * time.dt;

    const newX = o.x + dx;
    const newY = o.y + dy;

    const minXIndex: number = Math.floor(newX / TILE_WIDTH);
    const maxXIndex: number = Math.floor((newX + o.width) / TILE_WIDTH);
    const minYIndex: number = Math.floor(newY / TILE_HEIGHT);
    const maxYIndex: number = Math.floor((newY + o.height) / TILE_HEIGHT);

    const blockUpLeft = isBlocking(map, minXIndex, minYIndex);
    const blockDownLeft = isBlocking(map, minXIndex, maxYIndex);
    const blockUpRight = isBlocking(map, maxXIndex, minYIndex);
    const blockDownRight = isBlocking(map, maxXIndex, maxYIndex);

    if (dx < 0 && (blockUpLeft || blockDownLeft)) {
        dx = 0;
    } else if (dx > 0 && (blockUpRight || blockDownRight)) {
        dx = 0;
    }

    if (dy < 0 && (blockUpLeft || blockUpRight)) {
        dy = 0;
    } else if (dy > 0 && (blockDownLeft || blockDownRight)) {
        dy = 0;
    }

    o.x += dx;
    o.y += dy;
};

export const drawMap = (
    time: TimeStep,
    map: TileMap<Tile>,
    objects: GameObject[],
): void => {
    const objectsToDraw: GameObject[] = [];

    for (let iy = 0; iy < map.yCount; iy++) {
        const y = iy * TILE_HEIGHT;
        for (let ix = 0; ix < map.xCount; ix++) {
            const x = ix * TILE_WIDTH;
            const tile = tileMapGet(map, ix, iy);
            switch (tile?.type) {
                case "grass":
                    cx.fillStyle = `rgb(0, 160, 0)`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                    if (tile.straw) {
                        cx.fillStyle = `rgb(0, 190, 0)`;
                        renderStraw(x, y, tile.straw, time.t);
                    }
                    break;
                case "up": {
                    cx.fillStyle = `rgb(0, 160, 0)`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                    // Draw arrow
                    cx.fillStyle = "pink";
                    cx.beginPath();
                    const qw = TILE_WIDTH / 4;
                    const qh = TILE_HEIGHT / 4;
                    cx.moveTo(x + qw, y + 3 * qh);
                    cx.lineTo(x + 2 * qw, y + qh);
                    cx.lineTo(x + 3 * qw, y + 3 * qh);
                    cx.fill();
                    break;
                }
                case "down": {
                    cx.fillStyle = `rgb(0, 160, 0)`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                    // Draw arrow
                    cx.fillStyle = "pink";
                    cx.beginPath();
                    const qw = TILE_WIDTH / 4;
                    const qh = TILE_HEIGHT / 4;
                    cx.moveTo(x + qw, y + qh);
                    cx.lineTo(x + 3 * qw, y + qh);
                    cx.lineTo(x + 2 * qw, y + 3 * qh);
                    cx.fill();
                    break;
                }
                case "left": {
                    cx.fillStyle = `rgb(0, 160, 0)`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                    // Draw arrow
                    cx.fillStyle = "pink";
                    cx.beginPath();
                    const qw = TILE_WIDTH / 4;
                    const qh = TILE_HEIGHT / 4;
                    cx.moveTo(x + qw, y + 2 * qh);
                    cx.lineTo(x + 3 * qw, y + qh);
                    cx.lineTo(x + 3 * qw, y + 3 * qh);
                    cx.fill();
                    break;
                }
                case "right": {
                    cx.fillStyle = `rgb(0, 160, 0)`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                    // Draw arrow
                    cx.fillStyle = "pink";
                    cx.beginPath();
                    const qw = TILE_WIDTH / 4;
                    const qh = TILE_HEIGHT / 4;
                    cx.moveTo(x + qw, y + qh);
                    cx.lineTo(x + 3 * qw, y + 2 * qh);
                    cx.lineTo(x + qw, y + 3 * qh);
                    cx.fill();
                    break;
                }
                case "water":
                    cx.fillStyle = `rgb(40, 30, ${150 + (ix * iy) / 2})`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
                    break;
                case "start":
                    cx.fillStyle = "rgb(80, 50, 150)";
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
                    break;
                default:
                    cx.fillStyle = "black";
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
                    break;
            }

            if (tile?.object) {
                objectsToDraw.push(tile.object);
            }
        }
    }

    objectsToDraw.push(...objects);

    objectsToDraw.sort((a, b) => a.y + a.height - (b.y + b.height));

    for (let i = 0; i < objectsToDraw.length; i++) {
        const o = objectsToDraw[i];
        switch (o.type) {
            case "character":
                cx.fillStyle = "rgb(30, 30, 220)";
                cx.fillRect(o.x, o.y, o.width, o.height);
                cx.fillStyle = "rgb(50, 50, 250)";
                cx.fillRect(o.x, o.y - o.height / 2, o.width, o.height);
                break;
            case "rock": {
                cx.fillStyle = "rgb(80, 50, 30)";
                cx.fillRect(o.x, o.y, o.width, o.height);
                cx.fillStyle = "rgb(100, 70, 50)";
                cx.fillRect(
                    o.x,
                    o.y - TILE_HEIGHT / 2,
                    TILE_WIDTH,
                    TILE_HEIGHT,
                );
                break;
            }
            case "finish": {
                cx.fillStyle = "rgb(150, 50, 50)";
                cx.fillRect(o.x, o.y, o.width, o.height);
                cx.fillStyle = "rgb(180, 70, 70)";
                cx.fillRect(o.x, o.y - o.height / 2, o.width, o.height);
                break;
            }
            default:
                break;
        }
    }

    cx.restore();
};
