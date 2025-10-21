import GamePlayManager from "../manager/GamePlayMgr";
import Skill from "./skill";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PowerReel extends Skill {
    constructor() {
        super("Power Reel", 8);
    }

    conditionMet(): boolean {
        return this.owner && this.owner.collectedCount >= 0;
    }

    cast(): void {
        this.lastCastTime = GamePlayManager.instance.getTimeNow();

        GamePlayManager.instance.powerReel();
    }

}
