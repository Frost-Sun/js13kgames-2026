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

import { negate, ZERO_VECTOR, type Vector } from "./core/math/Vector";
import type { TimeStep } from "./core/time/TimeStep";
import {
    CHARACTER_SPEED,
    DIGGING_SPEED,
    GameObjectAction,
    type GameObject,
} from "./GameObject";
import { cx } from "./graphics";
import type { TileArea } from "./core/tiles/TileArea";
import { tileMapGet, tileMapSet, type TileMap } from "./core/tiles/TileMap";
import { getCenter, type Area } from "./core/math/Area";
import { renderStraw, type StrawParams } from "./animations/straw";
import { random } from "./core/math/random";
import { renderUnicorn } from "./animations/unicorn";
import {
    ArrowColorByTheme,
    HIGHLIGHT_COLOR,
    LandColorByTheme,
    StrawColorByTheme,
    type Theme,
} from "./theme";

export const TILE_WIDTH = 10;
export const TILE_HEIGHT = 10;

export const TILE_UPWARD_HEIGHT = TILE_HEIGHT / 2;

export type TileType =
    "land" | "rock" | "water" | "start" | "finish" | "rainbow";

export const enum Arrow {
    Up = 1,
    Down = 2,
    Left = 3,
    Right = 4,
}

export interface Tile {
    type: TileType;
    arrow?: Arrow;
    object?: GameObject;
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
    arrow?: Arrow,
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
                    velocity: ZERO_VECTOR,
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
                    velocity: ZERO_VECTOR,
                },
            };
        case "land":
            return {
                type,
                arrow,
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
            };
    }
};

export const setTile = (
    map: TileMap<Tile>,
    type: TileType | undefined,
    ix: number,
    iy: number,
    arrow?: Arrow,
): void => {
    const tile = type ? createTile(type, ix, iy, arrow) : undefined;
    tileMapSet(map, tile, ix, iy);
};

export const fill = (
    map: TileMap<Tile>,
    area: TileArea,
    tile?: TileType,
): void => {
    for (let iy = area.iy; iy < area.iy + area.yCount; iy++) {
        for (let ix = area.ix; ix < area.ix + area.xCount; ix++) {
            setTile(map, tile, ix, iy);
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
    let dx = o.velocity.x * time.dt;
    let dy = o.velocity.y * time.dt;

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

    let blockXDirection: -1 | 1 | undefined;
    let blockYDirection: -1 | 1 | undefined;

    if (dx < 0 && (blockUpLeft || blockDownLeft)) {
        blockXDirection = -1;
    } else if (dx > 0 && (blockUpRight || blockDownRight)) {
        blockXDirection = 1;
    } else if (dy < 0 && (blockUpLeft || blockUpRight)) {
        blockYDirection = -1;
    } else if (dy > 0 && (blockDownLeft || blockDownRight)) {
        blockYDirection = 1;
    }

    if (blockXDirection || blockYDirection) {
        if (o.action === GameObjectAction.Dig) {
            if (blockXDirection) {
                digHorizontally(time, map, o, blockXDirection);
            } else if (blockYDirection) {
                digVertically(time, map, o, blockYDirection);
            }
        } else {
            // Go to opposite direction
            o.velocity = negate(o.velocity);
        }
    }

    dx = o.velocity.x * time.dt;
    dy = o.velocity.y * time.dt;

    o.x += dx;
    o.y += dy;
};

const digHorizontally = (
    time: TimeStep,
    map: TileMap<Tile>,
    o: GameObject,
    xDirection: -1 | 1,
): void => {
    const objectCenter = getCenter(o);
    const currentTile = getTileAt(map, objectCenter);
    if (currentTile == null) {
        return;
    }

    const dx = o.velocity.x * time.dt;
    const tilePos = getTilePosAt(objectCenter);
    const nextTile = tileMapGet(map, tilePos.ix + xDirection, tilePos.iy);
    const rock = currentTile.type === "rock" ? currentTile : nextTile;

    if (rock?.type === "rock" && rock?.object) {
        // Set slower speed for digging
        if (Math.abs(o.velocity.x) > DIGGING_SPEED) {
            o.velocity = { x: xDirection * DIGGING_SPEED, y: 0 };
        }

        // Adjust rock size
        if (xDirection > 0) {
            rock.object.x += dx;
        }
        rock.object.width -= Math.abs(dx);

        // Check if the current block is finished
        const BlockFinishedThreshold = TILE_WIDTH / 10;
        if (rock.object.width <= BlockFinishedThreshold) {
            rock.object = undefined;
            rock.type = "land";

            // Check if there are no more rocks to dig
            if (currentTile.type !== "rock" && nextTile?.type !== "rock") {
                o.action = GameObjectAction.Walk;
                o.velocity = { x: xDirection * CHARACTER_SPEED, y: 0 };
            }
        }
    }
};

const digVertically = (
    time: TimeStep,
    map: TileMap<Tile>,
    o: GameObject,
    yDirection: -1 | 1,
): void => {
    const objectCenter = getCenter(o);
    const currentTile = getTileAt(map, objectCenter);
    if (currentTile == null) {
        return;
    }

    const dy = o.velocity.y * time.dt;
    const tilePos = getTilePosAt(objectCenter);
    const nextTile = tileMapGet(map, tilePos.ix, tilePos.iy + yDirection);
    const rock = currentTile.type === "rock" ? currentTile : nextTile;

    if (rock?.type === "rock" && rock?.object) {
        // Set slower speed for digging
        if (Math.abs(o.velocity.y) > DIGGING_SPEED) {
            o.velocity = { x: 0, y: yDirection * DIGGING_SPEED };
        }

        // Adjust rock size
        if (yDirection > 0) {
            rock.object.y += dy;
        }
        rock.object.height -= Math.abs(dy);

        // Check if the current block is finished
        const BlockFinishedThreshold = TILE_HEIGHT / 10;
        if (rock.object.height <= BlockFinishedThreshold) {
            rock.object = undefined;
            rock.type = "land";

            // Check if there are no more rocks to dig
            if (currentTile.type !== "rock" && nextTile?.type !== "rock") {
                o.action = GameObjectAction.Walk;
                o.velocity = { x: 0, y: yDirection * CHARACTER_SPEED };
            }
        }
    }
};

export const drawMap = (
    time: TimeStep,
    map: TileMap<Tile>,
    objects: GameObject[],
    highlightedTile: Tile | undefined,
    highlightedCharacter: GameObject | undefined,
    theme: Theme,
): void => {
    const objectsToDraw: GameObject[] = [];

    const landColor = LandColorByTheme[theme];
    const strawColor = StrawColorByTheme[theme];
    const arrowColor = ArrowColorByTheme[theme];

    // PASS 1: Draw all Land Tiles
    for (let iy = 0; iy < map.yCount; iy++) {
        const y = iy * TILE_HEIGHT;
        for (let ix = 0; ix < map.xCount; ix++) {
            const x = ix * TILE_WIDTH;
            const tile = tileMapGet(map, ix, iy);

            if (!tile) continue;
            if (tile.object) objectsToDraw.push(tile.object);

            if (tile.type === "land" || tile.type === "rock") {
                const up = tileMapGet(map, ix, iy - 1)?.type;
                const down = tileMapGet(map, ix, iy + 1)?.type;
                const left = tileMapGet(map, ix - 1, iy)?.type;
                const right = tileMapGet(map, ix + 1, iy)?.type;
                const upLeft = tileMapGet(map, ix - 1, iy - 1)?.type;
                const upRight = tileMapGet(map, ix + 1, iy - 1)?.type;
                const downLeft = tileMapGet(map, ix - 1, iy + 1)?.type;
                const downRight = tileMapGet(map, ix + 1, iy + 1)?.type;

                const r = 3;
                const isW = (t: string | undefined) =>
                    t === "water" || t === "rainbow";

                const tl = isW(up) && isW(left) && isW(upLeft) ? r : 0;
                const tr = isW(up) && isW(right) && isW(upRight) ? r : 0;
                const br = isW(down) && isW(right) && isW(downRight) ? r : 0;
                const bl = isW(down) && isW(left) && isW(downLeft) ? r : 0;

                // Draw Water background for outer capes so the rounded corners reveal water
                if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
                    cx.fillStyle = `rgb(40, 30, ${150 + (ix * iy) / 2})`;
                    cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
                }

                cx.save();

                // 1. Base Green (defines the absolute outer boundary)
                cx.fillStyle = landColor;

                cx.beginPath();
                cx.roundRect(x, y, TILE_WIDTH, TILE_HEIGHT, [tl, tr, br, bl]);
                cx.fill();

                cx.clip();

                // 2. Tide layer (covers the whole clipped tile)
                const tide = Math.sin(time.t * 0.002) * 1.0;
                cx.fillStyle = `rgb(40, 130, ${150 + (ix * iy) / 2})`;
                cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

                // 3. Inner Green (shrinks away from water to reveal the Tide)
                let ix_in = x,
                    iy_in = y,
                    iw_in = TILE_WIDTH,
                    ih_in = TILE_HEIGHT;
                if (isW(up)) {
                    iy_in += tide;
                    ih_in -= tide;
                }
                if (isW(down)) {
                    ih_in -= tide;
                }
                if (isW(left)) {
                    ix_in += tide;
                    iw_in -= tide;
                }
                if (isW(right)) {
                    iw_in -= tide;
                }

                const itl = tl > 0 ? Math.max(0, tl - tide) : 0;
                const itr = tr > 0 ? Math.max(0, tr - tide) : 0;
                const ibr = br > 0 ? Math.max(0, br - tide) : 0;
                const ibl = bl > 0 ? Math.max(0, bl - tide) : 0;

                cx.fillStyle = landColor;
                cx.beginPath();
                if (iw_in > 0 && ih_in > 0) {
                    cx.roundRect(ix_in, iy_in, iw_in, ih_in, [
                        itl,
                        itr,
                        ibr,
                        ibl,
                    ]);
                    cx.fill();
                }

                cx.restore();

                // 4. Decorations
                if (strawColor && tile.straw) {
                    cx.fillStyle = strawColor;
                    renderStraw(x, y, tile.straw, time.t);
                }

                if (tile.arrow != null) {
                    cx.save();
                    cx.translate(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
                    if (tile.arrow === Arrow.Right) cx.rotate(Math.PI / 2);
                    else if (tile.arrow === Arrow.Down) cx.rotate(Math.PI);
                    else if (tile.arrow === Arrow.Left) cx.rotate(-Math.PI / 2);

                    cx.fillStyle = arrowColor;
                    cx.beginPath();
                    const qw = TILE_WIDTH / 4;
                    const qh = TILE_HEIGHT / 4;
                    cx.moveTo(-qw, qh);
                    cx.lineTo(0, -qh);
                    cx.lineTo(qw, qh);
                    cx.fill();
                    cx.restore();
                }
            } else if (tile.type === "start") {
                cx.fillStyle = "rgb(80, 50, 150)";
                cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
            } else if (tile.type !== "water" && tile.type !== "rainbow") {
                cx.fillStyle = "black";
                cx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
            }
        }
    }

    // PASS 2: Draw all Water Tiles (Bay curves spill over to trim land corners)
    for (let iy = 0; iy < map.yCount; iy++) {
        const y = iy * TILE_HEIGHT;
        for (let ix = 0; ix < map.xCount; ix++) {
            const x = ix * TILE_WIDTH;
            const tile = tileMapGet(map, ix, iy);

            if (tile?.type === "water" || tile?.type === "rainbow") {
                const up = tileMapGet(map, ix, iy - 1)?.type;
                const down = tileMapGet(map, ix, iy + 1)?.type;
                const left = tileMapGet(map, ix - 1, iy)?.type;
                const right = tileMapGet(map, ix + 1, iy)?.type;

                const isLand = (t: string | undefined) =>
                    t !== undefined && t !== "water" && t !== "rainbow";
                const r = 3;

                const tl = isLand(up) && isLand(left) ? r : 0;
                const tr = isLand(up) && isLand(right) ? r : 0;
                const br = isLand(down) && isLand(right) ? r : 0;
                const bl = isLand(down) && isLand(left) ? r : 0;

                // If this water tile has a land bay corner
                if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
                    // Synchronized tide size to perfectly match Pass 1
                    const tide = Math.sin(time.t * 0.002) * 1.0;

                    // 1. Spillover Green Base (expanded safely, no alpha overlap issues)
                    cx.fillStyle = landColor;
                    if (tl > 0)
                        cx.fillRect(
                            x - tide - 1,
                            y - tide - 1,
                            tl + tide + 1,
                            tl + tide + 1,
                        );
                    if (tr > 0)
                        cx.fillRect(
                            x + TILE_WIDTH - tr,
                            y - tide - 1,
                            tr + tide + 1,
                            tr + tide + 1,
                        );
                    if (br > 0)
                        cx.fillRect(
                            x + TILE_WIDTH - br,
                            y + TILE_HEIGHT - br,
                            br + tide + 1,
                            br + tide + 1,
                        );
                    if (bl > 0)
                        cx.fillRect(
                            x - tide - 1,
                            y + TILE_HEIGHT - bl,
                            bl + tide + 1,
                            bl + tide + 1,
                        );

                    // 2. Concentric Tide Arcs
                    // Exact mathematical angles (no extensions) to prevent dark overlapping wedges
                    cx.fillStyle = `rgb(40, 130, ${150 + (ix * iy) / 2})`;
                    cx.beginPath();

                    if (tl > 0) {
                        cx.moveTo(x + tl, y + tl);
                        cx.arc(
                            x + tl,
                            y + tl,
                            tl + tide,
                            Math.PI,
                            Math.PI * 1.5,
                        );
                    }
                    if (tr > 0) {
                        cx.moveTo(x + TILE_WIDTH - tr, y + tr);
                        cx.arc(
                            x + TILE_WIDTH - tr,
                            y + tr,
                            tr + tide,
                            Math.PI * 1.5,
                            Math.PI * 2,
                        );
                    }
                    if (br > 0) {
                        cx.moveTo(x + TILE_WIDTH - br, y + TILE_HEIGHT - br);
                        cx.arc(
                            x + TILE_WIDTH - br,
                            y + TILE_HEIGHT - br,
                            br + tide,
                            0,
                            Math.PI * 0.5,
                        );
                    }
                    if (bl > 0) {
                        cx.moveTo(x + bl, y + TILE_HEIGHT - bl);
                        cx.arc(
                            x + bl,
                            y + TILE_HEIGHT - bl,
                            bl + tide,
                            Math.PI * 0.5,
                            Math.PI,
                        );
                    }
                    cx.fill();
                }
                // 3. Main Water Layer
                cx.fillStyle = `rgb(40, 30, ${150 + (ix * iy) / 2})`;
                cx.beginPath();
                cx.roundRect(x, y, TILE_WIDTH, TILE_HEIGHT, [tl, tr, br, bl]);
                cx.fill();
            }

            if (tile === highlightedTile) {
                cx.save();
                cx.strokeStyle = HIGHLIGHT_COLOR;
                cx.strokeRect(x + 1, y + 1, TILE_WIDTH - 2, TILE_HEIGHT - 2);
                cx.restore();
            }
        }
    }

    // PASS 3: Draw Rainbow Bridges
    for (let iy = 0; iy < map.yCount; iy++) {
        const y = iy * TILE_HEIGHT;
        for (let ix = 0; ix < map.xCount; ix++) {
            const x = ix * TILE_WIDTH;
            const tile = tileMapGet(map, ix, iy);

            if (tile?.type === "rainbow") {
                const left = tileMapGet(map, ix - 1, iy)?.type;
                const right = tileMapGet(map, ix + 1, iy)?.type;
                const up = tileMapGet(map, ix, iy - 1)?.type;
                const down = tileMapGet(map, ix, iy + 1)?.type;

                const isHorizontalBridge =
                    left === "land" ||
                    right === "land" ||
                    left === "start" ||
                    right === "finish" ||
                    up === "water" ||
                    down === "water";

                const over = 2;
                const colors = [
                    "red",
                    "orange",
                    "yellow",
                    "green",
                    "cyan",
                    "blue",
                    "violet",
                ];
                const step = 1 / colors.length;

                cx.save();
                cx.globalAlpha = 0.8;

                if (isHorizontalBridge) {
                    const rx = x - over;
                    const rw = TILE_WIDTH + over * 2;
                    const gradient = cx.createLinearGradient(
                        rx,
                        y,
                        rx,
                        y + TILE_HEIGHT,
                    );
                    for (let i = 0; i < colors.length; i++) {
                        gradient.addColorStop(i * step, colors[i]);
                        gradient.addColorStop(
                            Math.min(1, (i + 1) * step),
                            colors[i],
                        );
                    }
                    cx.fillStyle = gradient;
                    cx.fillRect(rx, y, rw, TILE_HEIGHT);
                } else {
                    const ry = y - over;
                    const rh = TILE_HEIGHT + over * 2;
                    const gradient = cx.createLinearGradient(
                        x,
                        ry,
                        x + TILE_WIDTH,
                        ry,
                    );
                    for (let i = 0; i < colors.length; i++) {
                        gradient.addColorStop(i * step, colors[i]);
                        gradient.addColorStop(
                            Math.min(1, (i + 1) * step),
                            colors[i],
                        );
                    }
                    cx.fillStyle = gradient;
                    cx.fillRect(x, ry, TILE_WIDTH, rh);
                }
                cx.restore();
            }
        }
    }

    objectsToDraw.push(...objects);
    objectsToDraw.sort((a, b) => a.y + a.height - (b.y + b.height));

    // PASS 4: Rest of the objects
    for (let i = 0; i < objectsToDraw.length; i++) {
        const o = objectsToDraw[i];
        switch (o.type) {
            case "character": {
                renderUnicorn(o, o === highlightedCharacter);
                if (o.action === GameObjectAction.Dig) {
                    cx.save();
                    cx.fillStyle = "rgb(29, 26, 26)";
                    cx.font = "2px Courier New";
                    cx.fillText("⛏", o.x + o.width / 2 - 1, o.y - 1);
                    cx.restore();
                }
                break;
            }
            case "splash": {
                const phase = (time.t - (o.createTime ?? 0)) / 1000;
                if (phase > 1) {
                    o.toDelete = true;
                }
                const r = (TILE_WIDTH / 2) * phase;
                cx.fillStyle = "rgb(40, 130, 200)";
                cx.beginPath();
                cx.arc(o.x, o.y, r, 0, 2 * Math.PI);
                cx.fill();
                break;
            }
            case "rock": {
                cx.fillStyle = "rgb(80, 70, 70)";
                cx.fillRect(
                    o.x,
                    o.y - TILE_UPWARD_HEIGHT,
                    o.width,
                    o.height + TILE_UPWARD_HEIGHT,
                );
                cx.fillStyle = "rgb(100, 90, 90)";
                cx.fillRect(o.x, o.y - TILE_UPWARD_HEIGHT, o.width, o.height);
                break;
            }
            case "finish": {
                cx.fillStyle = "rgb(150, 50, 50)";
                cx.fillRect(
                    o.x,
                    o.y - TILE_UPWARD_HEIGHT,
                    o.width,
                    o.height + TILE_UPWARD_HEIGHT,
                );
                cx.fillStyle = "rgb(180, 70, 70)";
                cx.fillRect(o.x, o.y - TILE_UPWARD_HEIGHT, o.width, o.height);
                break;
            }
        }
    }

    cx.restore();
};
