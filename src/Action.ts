import type { Arrow, Tile, TileType } from "./tiles";

export enum Action {
    // The directions should match with values of Arrow enum
    // so that we get away with a small mapping function.
    Up = 1,
    Down = 2,
    Left = 3,
    Right = 4,
    Rainbow,
    Dig,
}

export const actionToArrow = (
    action: Action.Up | Action.Down | Action.Left | Action.Right,
): Arrow => action as unknown as Arrow;

const ActionTiles: Record<Action, TileType | undefined> = {
    [Action.Up]: "grass",
    [Action.Down]: "grass",
    [Action.Left]: "grass",
    [Action.Right]: "grass",
    [Action.Rainbow]: "water",
    [Action.Dig]: undefined,
};

export const isApplicable = (action: Action, tile: Tile): boolean => {
    const tileType = ActionTiles[action];
    return tileType == null || tileType === tile.type;
};
