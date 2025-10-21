
const { ccclass, property } = cc._decorator;

export namespace Constants {
}

export const uniScale: number = 2;
export const explosionRadius: number = 3;

export const itemHookName = ["ROCK_SMALL", "ROCK_MEDIUM", "ROCK_LARGE", "GOLD_SMALL", "GOLD_MEDIUM", "GOLD_LARGE", "DIAMOND_SMALL", "DIAMOND_MEDIUM",  "BAG", "TNT", "SKE_HEAD", "SKE_BONE", "MOLE", "MOLE_DIA_SMALL", "MOLE_DIA_MEDIUM"];

export const characterAnims = {
    MINER_DOWN : 0,
    MINER_UP : 1,
    MINER_STR : 2,
    MINER_THROW : 3,
}

export interface iItemHookStats {
    id: number,
    m: number,
    v: number,
    w: number,
    h: number
    d?: number,
    s?: number
}

