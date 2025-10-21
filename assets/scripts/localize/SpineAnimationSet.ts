import { LANGUAGE } from "../manager/LanguageMgr";

const { ccclass, property } = cc._decorator;

const LANGUAGE_SPRITE = cc.Enum({
    VN: 0,
    EN: 1,
    MM: 2,
});

@ccclass("SpineAnimationSet")
export default class SpineAnimationSet {

    @property({
        type: LANGUAGE_SPRITE
    })
    language = LANGUAGE_SPRITE.VN;

    @property(sp.SkeletonData)
    skeletonData: sp.SkeletonData = null;

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

    }
}
