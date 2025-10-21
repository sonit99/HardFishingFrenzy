import { LANGUAGE } from "../manager/LanguageMgr";

const { ccclass, property } = cc._decorator;

const LANGUAGE_PREFAB = cc.Enum({
    VN: 0,
    EN: 1,
    MM: 2,
    TL: 3,
    CAM: 4,
});

@ccclass("PrefabSet")
export default class PrefabSet {

    @property({ type: LANGUAGE_PREFAB })
    language = LANGUAGE_PREFAB.VN;

    @property(cc.Prefab)
    prefLanguage: cc.Prefab = null;

    setLang(lang: number){
        this.language = lang;
    }

    getLang(): string {
        if (this.language == LANGUAGE_PREFAB.VN) {
            return LANGUAGE.VIETNAMESE;
        }

        if (this.language == LANGUAGE_PREFAB.EN) {
            return LANGUAGE.ENGLISH;
        }

        if (this.language == LANGUAGE_PREFAB.MM) {
            return LANGUAGE.MYANMAR;
        }

        if (this.language == LANGUAGE_PREFAB.TL) {
            return LANGUAGE.THAILAN;
        }

        if (this.language == LANGUAGE_PREFAB.CAM) {
            return LANGUAGE.CAMBODIA;
        }

    }
}
