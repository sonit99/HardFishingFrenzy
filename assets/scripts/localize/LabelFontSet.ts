
const { ccclass, property } = cc._decorator;

const LANGUAGE_FONT = cc.Enum({
    VN: 0,
    EN: 1,
    MM: 2,
    TL: 3,
    CAM: 4,
});
@ccclass("LabelFontSet")
export default class LabelFontSet {
    @property({
        type: LANGUAGE_FONT
    })
    language = LANGUAGE_FONT.VN;

    @property(cc.Font)
    fontName: cc.Font = null;

    @property({
        type: cc.Integer,

    })
    fontSize: number = 20;

    setLang(lang: number) {
        this.language = lang;
    }
}
