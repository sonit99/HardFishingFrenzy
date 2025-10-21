import { LANGUAGE } from "../manager/LanguageMgr";

const { ccclass, property } = cc._decorator;

const LANGUAGE_SPRITE = cc.Enum({
    VN: 0,
    EN: 1,
    MM: 2,
    TL: 3,
    CAM: 4,
});
@ccclass("SpriteFrameSet")
export default class SpriteFrameSet {

    @property({
        type: LANGUAGE_SPRITE
    })
    language = LANGUAGE_SPRITE.VN;

    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null;

    setLang(lang: number){
        this.language = lang;
    }

    getLang(): string {
        if (this.language == LANGUAGE_SPRITE.VN) {
            return LANGUAGE.VIETNAMESE;
        }

        if (this.language == LANGUAGE_SPRITE.EN) {
            return LANGUAGE.ENGLISH;
        }

        if (this.language == LANGUAGE_SPRITE.MM) {
            return LANGUAGE.MYANMAR;
        }

        if (this.language == LANGUAGE_SPRITE.TL) {
            return LANGUAGE.THAILAN;
        }

        if (this.language == LANGUAGE_SPRITE.CAM) {
            return LANGUAGE.CAMBODIA;
        }

    }
}
