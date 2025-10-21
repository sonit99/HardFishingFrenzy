
import GamePlayManager from "../manager/GamePlayMgr";
import Player from "../modules/player";
import Skill from "./skill";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SkillMgr extends cc.Component {
    @property(cc.SpriteFrame) skillSF: cc.SpriteFrame[] = []; // nếu muốn drag prefab
    skills: Skill[] = [];

    addSkill(skill: Skill, owner: Player, matchTime: number) {
        skill.setOwner(owner);
        this.skills.push(skill);
        cc.log(matchTime, skill.cooldown);
        skill.updateLastCastTime(matchTime + skill.cooldown);
    }

    clearSkill() {
        this.skills = [];
    }

    updateSkillCooldown(skill: Skill) {
        let cd = skill.cooldown;
        GamePlayManager.instance.initSkill(cd.toFixed());
        this.schedule(() => {
            cd -= 1;
            if (cd === 0) 
                GamePlayManager.instance.initSkill(skill.name);
            else 
                GamePlayManager.instance.initSkill(cd.toFixed());
        }, 1, skill.cooldown - 1)
    }

    tryCast() {
        // let skill = this.skills.find(s => s.name === name);
        let skill = this.skills[0];
        cc.log("can cast:", skill, skill.canCast(), skill.conditionMet());
        if (skill && skill.canCast() && skill.conditionMet()) {
            skill.cast();
            this.updateSkillCooldown(skill);
        } else {
            cc.log("skill on cooldown!")
        }
    }
}
