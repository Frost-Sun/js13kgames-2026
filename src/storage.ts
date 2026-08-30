import { GAME_TITLE } from "./constants";

export interface PersistentState {
    highestLevel: number;
}

const KEY: string = GAME_TITLE + "_" + "state";

export const save = (state: PersistentState): void => {
    const serialized = JSON.stringify(state);
    localStorage.setItem(KEY, serialized);
};

export const load = (): PersistentState => {
    const serialized = localStorage.getItem(KEY);
    return serialized ? JSON.parse(serialized) : { highestLevel: 0 };
};
