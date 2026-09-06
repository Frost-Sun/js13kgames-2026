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
    carveBottom,
    carveLeft,
    carveRight,
    carveTop,
    carveX,
    carveY,
    core,
    coreX,
    coreY,
    extendDown,
    extendLeft,
    extendRight,
    extendUp,
    segment4,
    segment9,
    sliceBottom,
    sliceLeft,
    sliceRight,
    sliceTop,
    splitX,
    splitX3,
    splitY,
} from "./core/tiles/TileArea";
import { fill, findTilePosition, tileToArea } from "./tiles";

export type CreateMapFunction = (number: number) => Level;

const createMapRockTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "There's something blocking my way",
        xCount: 11,
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

    return level;
};

const createMapRainbowTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "How shall we get over the water?",
        xCount: 14,
        yCount: 7,
        characterCount: 3,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Down]: 2,
            [Action.RainbowHorizontal]: 1,
        },
        theme: "summer",
    });
    fill(level, level, "water");

    const inner = carve(level);
    const [left, right] = splitX(inner, inner.xCount * 0.6);

    const leftIsland = carveRight(carveBottom(left, 2), 2);
    const rightIsland = carve(right);

    fill(level, leftIsland, "land");
    fill(level, rightIsland, "land");

    fill(level, coreY(sliceLeft(leftIsland)), "start");
    fill(level, coreX(sliceBottom(rightIsland)), "finish");

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

    return level;
};

const createMapRainbowIslands = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Rainbow islands",
        xCount: 20,
        yCount: 14,
        characterCount: 10,
        charactersToFinish: 10,
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
    const [a, b, c, d, _e, _f, _g, h, _i] = segment9(inner);

    const startIsland = a;
    const startExtend = extendRight(extendDown(sliceRight(sliceBottom(a)), 2));
    const finishIsland = extendDown(
        carveRight(carveTop(d, d.yCount / 2), 3),
        3,
    );
    const rocks = extendDown(core(b, 2));
    const rocks2 = sliceTop(extendUp(finishIsland));
    const tempIsland = core(c, 2);
    const tempLeft = extendLeft(tempIsland, 3);
    const tempDown = extendDown(tempIsland, 3);
    const temp2Island = extendRight(carve(h), 2);

    fill(level, startIsland, "land");
    fill(level, startExtend, "land");
    fill(level, rocks, "rock");
    fill(level, tempLeft, "land");
    fill(level, tempDown, "land");
    fill(level, temp2Island, "land");
    fill(level, rocks2, "rock");
    fill(level, finishIsland, "land");

    fill(level, sliceLeft(coreY(startIsland)), "start");
    fill(level, sliceTop(coreX(finishIsland)), "finish");

    return level;
};

const createMapCaves = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Use wisely what you've got.",
        xCount: 24,
        yCount: 20,
        characterCount: 8,
        charactersToFinish: 5,
        actionCounts: {
            [Action.Up]: 1,
            [Action.Down]: 1,
            [Action.Left]: 1,
            [Action.Right]: 1,
            [Action.Dig]: 2,
            [Action.RainbowHorizontal]: 1,
            [Action.RainbowVertical]: 1,
        },
        theme: "summer",
    });
    fill(level, level, "water");

    const inner = carve(level);
    fill(level, inner, "land");

    const [a, b, c, _d, e, f, _g, h, _i] = segment9(
        inner,
        inner.yCount / 4,
        inner.yCount / 2,
        inner.xCount / 6,
        inner.xCount * (4 / 6),
    );

    const water1 = extendRight(extendDown(a, 2));
    const [waterBottom1, waterBottom2] = splitX(carveX(h, 2));
    const water3 = f;
    const water4 = extendLeft(carve(c), 5);
    const landPassage2 = carveBottom(sliceRight(water3), 4);
    const landPassage3 = coreY(water3);
    const bigRock1 = sliceBottom(coreX(b, 8), 2);
    const bigRock2 = extendUp(sliceLeft(bigRock1, 4));
    const bigRock3 = extendUp(sliceLeft(bigRock2), 2);
    const caveArea = e;
    const rooms = carve(caveArea, 2);
    const [leftRoom, walls, rightRoom] = splitX3(rooms, rooms.xCount / 3, 5);

    fill(level, water1, "water");
    fill(level, waterBottom1, "water");
    fill(level, waterBottom2, "water");
    fill(level, water3, "water");
    fill(level, water4, "water");
    fill(level, sliceRight(waterBottom1), "land");
    fill(level, sliceBottom(waterBottom1), "land");
    fill(level, landPassage2, "land");
    fill(level, landPassage3, "land");

    fill(level, bigRock1, "rock");
    fill(level, bigRock2, "rock");
    fill(level, bigRock3, "rock");
    fill(level, caveArea, "rock");
    fill(level, leftRoom, "land");
    fill(level, rightRoom, "land");
    fill(level, sliceLeft(carveLeft(walls)), "land");
    fill(level, sliceRight(carveRight(walls)), "land");

    fill(level, coreY(sliceLeft(leftRoom)), "start");
    fill(level, coreY(carveBottom(sliceLeft(rightRoom), 2)), "finish");

    return level;
};

export const maps: CreateMapFunction[] = [
    createMapRockTutorial,
    createMapRainbowTutorial,
    createMapRocks,
    createMapRainbowIslands,
    createMapCaves,
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
