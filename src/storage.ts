import { GAME_TITLE } from "./constants";

export interface PersistentState {
    highestLevel: number;
}

const KEY: string = GAME_TITLE + "_" + "state";

export const saveHighestLevel = (level: number): void => {
    const currentState = load();
    if (level > currentState.highestLevel) {
        const newState: PersistentState = {
            highestLevel: level,
        };
        const serialized = JSON.stringify(newState);
        localStorage.setItem(KEY, serialized);
    }
};

export const load = (): PersistentState => {
    const serialized = localStorage.getItem(KEY);
    return serialized ? JSON.parse(serialized) : { highestLevel: 0 };
};
