import GamePlayManager from "../manager/GamePlayMgr";
import Player from "../modules/player";

const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class Skill {
    name: string;
    cooldown: number;
    lastCastTime: number = -999;
    owner: Player = null; // Player gán sau

    constructor(name: string, cooldown: number) {
        this.name = name;
        this.cooldown = cooldown;
        GamePlayManager.instance.initSkill(name);
    }

    setOwner(player: Player
    ) {
        this.owner = player;
    }

    canCast(): boolean {
        let now = GamePlayManager.instance.getTimeNow();
        cc.log(this.lastCastTime - now, this.cooldown)
        return (this.lastCastTime - now) >= this.cooldown;
    }

    updateLastCastTime(time: number) {
        this.lastCastTime = time;
    }

    abstract conditionMet(): boolean;
    abstract cast(): void;
}
