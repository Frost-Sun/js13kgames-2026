import type { Tile, TileType } from "./tiles";

export enum Action {
    Up,
    Down,
    Left,
    Right,
    Rainbow,
    Dig,
}

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
