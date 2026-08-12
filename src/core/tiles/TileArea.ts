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

/**
 * A module for doing a layout for a tile-based level.
 *
 * The TileArea type describes a area in a tile-based level or a
 * portion of it.
 *
 * Split functions (and different functions derived of it) can be used
 * to split an area to sub-areas. It is then up to the user of the
 * module to fill each area with game-specific tiles.
 *
 * Also, walk methods can be used to join separate areas together (for
 * example, different rooms in a dungeon game).
 */

export interface TileArea {
    readonly ix: number;
    readonly iy: number;
    readonly xCount: number;
    readonly yCount: number;
}

export const splitX = (
    area: TileArea,
    leftCount?: number,
): [TileArea, TileArea] => {
    leftCount = leftCount ?? area.xCount / 2;

    const actualLeftCount =
        leftCount < 0
            ? Math.min(
                  Math.max(0, area.xCount + Math.floor(leftCount)),
                  area.xCount,
              )
            : Math.min(Math.ceil(leftCount), area.xCount);

    return [
        {
            ix: area.ix,
            iy: area.iy,
            xCount: actualLeftCount,
            yCount: area.yCount,
        },
        {
            ix: area.ix + actualLeftCount,
            iy: area.iy,
            xCount: area.xCount - actualLeftCount,
            yCount: area.yCount,
        },
    ];
};

export const splitY = (
    area: TileArea,
    topCount?: number,
): [TileArea, TileArea] => {
    topCount = topCount ?? area.yCount / 2;

    const actualTopCount =
        topCount < 0
            ? Math.min(
                  Math.max(0, area.yCount + Math.floor(topCount)),
                  area.yCount,
              )
            : Math.min(Math.ceil(topCount), area.yCount);

    return [
        {
            ix: area.ix,
            iy: area.iy,
            xCount: area.xCount,
            yCount: actualTopCount,
        },
        {
            ix: area.ix,
            iy: area.iy + actualTopCount,
            xCount: area.xCount,
            yCount: area.yCount - actualTopCount,
        },
    ];
};

export const splitX3 = (
    area: TileArea,
    leftCount: number,
    middleCount: number = 1,
): [TileArea, TileArea, TileArea] => {
    const [left, temp] = splitX(area, leftCount);
    const [middle, right] = splitX(temp, middleCount);
    return [left, middle, right];
};

export const splitY3 = (
    area: TileArea,
    topCount: number,
    middleCount: number = 1,
): [TileArea, TileArea, TileArea] => {
    const [top, temp] = splitY(area, topCount);
    const [middle, bottom] = splitY(temp, middleCount);
    return [top, middle, bottom];
};

export const segment4 = (
    area: TileArea,
    topCount?: number,
    leftCount?: number,
): [TileArea, TileArea, TileArea, TileArea] => {
    const [top, bottom] = splitY(area, topCount);
    const [topLeft, topRight] = splitX(top, leftCount);
    const [bottomLeft, bottomRight] = splitX(bottom, leftCount);
    return [topLeft, topRight, bottomLeft, bottomRight];
};

export const segment9 = (
    area: TileArea,
    topCount1?: number,
    topCount2?: number,
    leftCount1?: number,
    leftCount2?: number,
): [
    TileArea,
    TileArea,
    TileArea,
    TileArea,
    TileArea,
    TileArea,
    TileArea,
    TileArea,
    TileArea,
] => {
    topCount1 = topCount1 ?? area.yCount / 3;
    topCount2 = topCount2 ?? area.yCount / 3;
    leftCount1 = leftCount1 ?? area.xCount / 3;
    leftCount2 = leftCount2 ?? area.xCount / 3;

    const [top, middle, bottom] = splitY3(area, topCount1, topCount2);
    const [top1, top2, top3] = splitX3(top, leftCount1, leftCount2);
    const [middle1, middle2, middle3] = splitX3(middle, leftCount1, leftCount2);
    const [bottom1, bottom2, bottom3] = splitX3(bottom, leftCount1, leftCount2);

    return [
        top1,
        top2,
        top3,
        middle1,
        middle2,
        middle3,
        bottom1,
        bottom2,
        bottom3,
    ];
};

export const carveLeft = (area: TileArea, count: number = 1): TileArea =>
    splitX(area, count)[1];

export const carveRight = (area: TileArea, count: number = 1): TileArea =>
    splitX(area, -count)[0];

export const carveX = (area: TileArea, count: number = 1): TileArea =>
    carveLeft(carveRight(area, count), count);

export const carveTop = (area: TileArea, count: number = 1): TileArea =>
    splitY(area, count)[1];

export const carveBottom = (area: TileArea, count: number = 1): TileArea =>
    splitY(area, -count)[0];

export const carveY = (area: TileArea, count: number = 1): TileArea =>
    carveTop(carveBottom(area, count), count);

export const carve = (area: TileArea, count: number = 1): TileArea =>
    carveX(carveY(area, count), count);

export const sliceTop = (area: TileArea, count: number = 1): TileArea =>
    splitY(area, count)[0];

export const sliceBottom = (area: TileArea, count: number = 1): TileArea =>
    splitY(area, -count)[1];

export const sliceLeft = (area: TileArea, count: number = 1): TileArea =>
    splitX(area, count)[0];

export const sliceRight = (area: TileArea, count: number = 1): TileArea =>
    splitX(area, -count)[1];

export const padRight = (area: TileArea, count: number = 1): TileArea => ({
    ix: area.ix + area.xCount,
    iy: area.iy,
    xCount: count,
    yCount: area.yCount,
});

export const coreX = (area: TileArea, size: number = 1): TileArea => {
    const edgeCount = area.xCount - size;
    const right = splitX(area, edgeCount / 2)[1];
    return splitX(right, size)[0];
};

export const coreY = (area: TileArea, size: number = 1): TileArea => {
    const edgeCount = area.yCount - size;
    const bottom = splitY(area, edgeCount / 2)[1];
    return splitY(bottom, size)[0];
};

export const core = (area: TileArea, size: number = 1): TileArea =>
    coreX(coreY(area, size), size);

export const walk = (
    a: TileArea,
    b: TileArea,
    step: (area: TileArea) => void,
): void => {
    const xDistance = Math.abs(b.ix - a.ix);
    const yDistance = Math.abs(b.iy - a.iy);

    if (xDistance > yDistance) {
        let left: TileArea, right: TileArea;
        if (a.ix < b.ix) {
            left = a;
            right = b;
        } else {
            left = b;
            right = a;
        }

        for (let ix = left.ix; ix <= right.ix; ix++) {
            const xProgress = Math.abs(ix - left.ix) / xDistance;
            const iy = left.iy + Math.round(xProgress * (right.iy - left.iy));
            const xCount =
                left.xCount +
                Math.floor(xProgress * (right.xCount - left.yCount));
            const yCount =
                left.yCount +
                Math.floor(xProgress * (right.yCount - left.yCount));

            step({
                ix,
                iy,
                xCount,
                yCount,
            });
        }
    } else {
        let top: TileArea, bottom: TileArea;
        if (a.iy < b.iy) {
            top = a;
            bottom = b;
        } else {
            top = b;
            bottom = a;
        }

        for (let iy = top.iy; iy <= bottom.iy; iy++) {
            const yProgress = Math.abs(iy - top.iy) / yDistance;
            const ix = top.ix + Math.round(yProgress * (bottom.ix - top.ix));
            const yCount =
                top.yCount +
                Math.floor(yProgress * (bottom.yCount - top.yCount));
            const xCount =
                top.xCount +
                Math.floor(yProgress * (bottom.xCount - top.xCount));

            step({
                ix,
                iy,
                xCount,
                yCount,
            });
        }
    }
};

export const randomTile = (area: TileArea): { ix: number; iy: number } => ({
    ix: area.ix + Math.floor(Math.random() * area.xCount),
    iy: area.iy + Math.floor(Math.random() * area.yCount),
});
