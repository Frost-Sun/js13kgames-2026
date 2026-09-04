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

import { Action } from "./Action";
import { createLevel, type Level } from "./Level";
import {
    carve,
    carveRight,
    carveTop,
    carveX,
    carveY,
    core,
    coreX,
    coreY,
    segment4,
    sliceBottom,
    sliceLeft,
    sliceRight,
    sliceTop,
    splitX,
    splitY,
} from "./core/tiles/TileArea";
import { fill, findTilePosition, tileToArea } from "./tiles";

export type CreateMapFunction = (number: number) => Level;

const createMapRockSimple = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "There's something blocking my way",
        xCount: 8,
        yCount: 5,
        characterCount: 1,
        charactersToFinish: 1,
        actionCounts: {
            [Action.Dig]: 2,
        },
        theme: "spring",
    });
    fill(level, level, "water");

    const inner = carve(level);
    fill(level, inner, "land");

    const [_left, right] = splitX(inner);
    fill(level, sliceLeft(right), "rock");

    fill(level, coreY(sliceLeft(inner)), "start");
    fill(level, coreY(sliceRight(inner)), "finish");

    level.startTile = findTilePosition(level, "start") ?? { ix: 0, iy: 0 };
    const finishPosition = findTilePosition(level, "finish") ?? {
        ix: 0,
        iy: 0,
    };
    level.finishArea = tileToArea(finishPosition);

    return level;
};

const createMapRiver = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "How shall we get over the river?",
        xCount: 10,
        yCount: 6,
        characterCount: 3,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Up]: 2,
            [Action.Down]: 2,
            [Action.Left]: 2,
            [Action.Right]: 2,
            [Action.RainbowHorizontal]: 1,
        },
        theme: "summer",
    });
    fill(level, level, "water");

    const inner = carve(level);
    fill(level, inner, "land");

    const [left, right] = splitX(inner, inner.xCount * 0.6);
    fill(level, sliceRight(left), "water");
    fill(level, sliceBottom(sliceLeft(right), 2), "water"); // River

    fill(level, coreY(sliceLeft(inner)), "start");
    fill(level, coreY(sliceRight(inner)), "finish");

    level.startTile = findTilePosition(level, "start") ?? { ix: 0, iy: 0 };
    const finishPosition = findTilePosition(level, "finish") ?? {
        ix: 0,
        iy: 0,
    };
    level.finishArea = tileToArea(finishPosition);

    return level;
};

const createMapRocks = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Keep digging.",
        xCount: 18,
        yCount: 10,
        characterCount: 10,
        charactersToFinish: 8,
        actionCounts: {
            [Action.Up]: 3,
            [Action.Down]: 3,
            [Action.Left]: 3,
            [Action.Right]: 3,
            [Action.Dig]: 2,
            [Action.RainbowHorizontal]: 1,
            [Action.RainbowVertical]: 1,
        },
        theme: "autumn",
    });
    fill(level, level, "water");

    const island = carve(level);
    fill(level, island, "land");
    const [left, right] = splitX(island);

    const [topLeft, bottomLeft] = splitY(left);
    fill(level, topLeft, "water");

    const rockWall = carveRight(sliceRight(bottomLeft, 3));
    fill(level, rockWall, "rock");

    fill(level, core(right, 2), "water");

    const [a, b, c, d] = segment4(right);
    fill(level, core(a, 3), "water");
    fill(level, coreY(sliceLeft(a)), "water");
    fill(level, carveY(sliceRight(b, 2)), "rock");
    fill(level, sliceBottom(c), "water");
    fill(level, sliceRight(d, 2), "water");

    fill(level, coreY(sliceLeft(bottomLeft)), "start");
    fill(level, sliceTop(sliceRight(topLeft)), "finish");

    level.startTile = findTilePosition(level, "start") ?? { ix: 0, iy: 0 };
    const finishPosition = findTilePosition(level, "finish") ?? {
        ix: 0,
        iy: 0,
    };
    level.finishArea = tileToArea(finishPosition);

    return level;
};

const createMapIslands = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Islands",
        xCount: 20,
        yCount: 14,
        characterCount: 3,
        charactersToFinish: 3,
        actionCounts: {
            [Action.Up]: 3,
            [Action.Down]: 3,
            [Action.Left]: 3,
            [Action.Right]: 3,
            [Action.RainbowHorizontal]: 4,
            [Action.RainbowVertical]: 4,
        },
        theme: "summer",
    });
    fill(level, level, "water");

    const inner = carve(level);
    const [topLeft, topRight, _bottomLeft, bottomRight] = segment4(inner);

    const startIsland = carveX(topLeft);
    const middleIsland = carve(topRight);
    const middle2 = coreX(sliceTop(bottomRight, 2), 4);
    const finishIsland = carveTop(carveRight(bottomRight, 4), 3);

    fill(level, startIsland, "land");
    fill(level, sliceRight(sliceTop(startIsland, 2), 3), "water");
    fill(level, sliceRight(sliceBottom(startIsland, 1), 3), "water");
    fill(level, middleIsland, "land");
    fill(level, middle2, "land");
    fill(level, finishIsland, "land");

    fill(level, coreY(sliceLeft(startIsland)), "start");
    fill(level, sliceLeft(coreY(finishIsland)), "finish");

    return level;
};

export const maps: CreateMapFunction[] = [
    createMapRockSimple,
    createMapRiver,
    createMapRocks,
    createMapIslands,
];

export const createMap = (number: number): Level => {
    const index = number < maps.length ? number : maps.length - 1;
    const level = maps[index](number);

    level.startTile = findTilePosition(level, "start") ?? { ix: 0, iy: 0 };
    const finishPosition = findTilePosition(level, "finish") ?? {
        ix: 0,
        iy: 0,
    };
    level.finishArea = tileToArea(finishPosition);

    return level;
};
