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
    core,
    coreX,
    coreY,
    segment4,
    segment9,
    sliceLeft,
    sliceRight,
    sliceTop,
    walk,
} from "./core/tiles/TileArea";
import { fill, findTilePosition, tileToArea } from "./tiles";

const createMapInitial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Level 1",
        xCount: 10,
        yCount: 10,
        characterCount: 3,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Rainbow]: 2,
        },
    });
    fill(level, level, "water");

    const inner = carve(level);
    fill(level, inner, "grass");

    fill(level, coreX(inner), "water");

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
        introduction: "Level 2",
        xCount: 13,
        yCount: 13,
        characterCount: 5,
        charactersToFinish: 4,
        actionCounts: {
            [Action.Up]: 2,
            [Action.Down]: 2,
            [Action.Left]: 2,
            [Action.Right]: 2,
            [Action.Dig]: 2,
        },
    });
    fill(level, level, "water");

    const inner = carve(level);
    fill(level, inner, "grass");

    const [topLeft, topRight, bottomLeft, _bottomRight] = segment4(inner);

    fill(level, topLeft, "water");

    const rockWall = sliceRight(bottomLeft);
    fill(level, rockWall, "rock");

    walk(core(rockWall), coreY(sliceRight(topRight, 2), 2), (area) =>
        fill(level, area, "rock"),
    );

    fill(level, coreY(sliceLeft(bottomLeft)), "start");
    fill(level, coreY(sliceRight(topLeft)), "finish");

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
        introduction: "Level 3",
        xCount: 12,
        yCount: 12,
        characterCount: 3,
        charactersToFinish: 3,
        actionCounts: {
            [Action.Up]: 1,
            [Action.Down]: 1,
            [Action.Left]: 1,
            [Action.Right]: 1,
            [Action.Rainbow]: 2,
        },
    });
    fill(level, level, "water");

    const inner = carve(level);

    const [
        topLeft,
        _top,
        topRight,
        _middleLeft,
        _middle,
        _middleRight,
        bottomLeft,
        _bottom,
        bottomRight,
    ] = segment9(inner, inner.yCount / 2, 1, inner.xCount / 2, 1);

    fill(level, topLeft, "grass");
    fill(level, topRight, "grass");
    fill(level, bottomLeft, "grass");
    fill(level, bottomRight, "grass");

    const [a, _b, c, _d] = segment4(bottomRight);
    fill(level, a, "water");

    fill(level, coreY(sliceLeft(topLeft)), "start");
    fill(level, sliceLeft(sliceTop(c)), "finish");

    return level;
};

export const maps: ((number: number) => Level)[] = [
    createMapInitial,
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
