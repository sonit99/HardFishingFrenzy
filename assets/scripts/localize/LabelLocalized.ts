

import { LABEL_FONT_SIZE_CONFIG, LANGUAGE, LanguageManager } from "../manager/LanguageMgr";
import LabelFontSet from "./LabelFontSet";

const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.Label)
export default class LabelLocalized extends cc.Component {
    @property
    isUseCCFont: boolean = false;

    @property({
        type: cc.Enum(LABEL_FONT_SIZE_CONFIG),
        visible: function (this: LabelLocalized) { return !this.isCustomFontSize}
    })
    fontSizeActive: number = LABEL_FONT_SIZE_CONFIG.NORMAL;

    @property
    isCustomFontSize: boolean = false;

    @property({
        multiline: true,
        tooltip: 'Enter i18n key here',

    })
    textKey: string = "";

    @property
    upperCaseString: boolean = false;

    // @property({
    //     visible: function (this: LabelLocalized) { return !this.isCustomFontSize }
    // })
    // isOutline: boolean = false;

    // @property({
    //     visible: function (this: LabelLocalized) { return !this.isCustomFontSize }
    // })
    // isShadow: boolean = false;

    private isSystemFontUsed: boolean = false;

    @property
    get notify() {
        return this._updateText();
    }

    @property({
        override: true,
        tooltip: 'Here shows the localized string of Text Key',
    })
    private _localizedString: string = "";

    @property
    get localizedString() {
        return LanguageManager.getString(this.textKey) || "";
    }

    set localizedString(value: string) {
        this.textKey = value;
        if (CC_EDITOR) {
            cc.warn('Please set label text key in Text Key property.');
        }
    }


    @property({
        type: LabelFontSet,
        visible: function (this: LabelLocalized) { return this.isCustomFontSize }
    })
    lbFont: LabelFontSet[] = this.loadLang();

    


    loadLang(): Array<LabelFontSet> {
        var newArr: Array<LabelFontSet> = [];
        for (var i = 0; i < Object.keys(LANGUAGE).length; i++) {
            var lbFont = new LabelFontSet();
            lbFont.setLang(i);
            newArr.push(lbFont);
        }
        return newArr;
    }

    start() {
        if (cc.Canvas.instance) {
            // cc.Canvas.instance.node.on(BGUI.EVENT_GAMECORE.EVENT_UPDATE_LANGUAGE_LABEL, this.updateLanguage, this);
        }
    }

    updateLanguage() {
        this._updateCustomFont();
        this._updateText();
    }


    private _updateCustomFont() {
        if(!this.isUseCCFont) return;
        let lang = LanguageManager.getCurrentLanguage();

        const keys = Object.values(LANGUAGE);
        const requiredIndex = keys.indexOf(lang);

        if (this.isCustomFontSize) {
            if (this.lbFont[requiredIndex].fontName) {
                this.node.getComponent(cc.Label).font = this.lbFont[requiredIndex].fontName;
            }

            if (this.lbFont[requiredIndex].fontSize) {
                this.node.getComponent(cc.Label).fontSize = this.lbFont[requiredIndex].fontSize;
            }
        } else {
            this.node.getComponent(cc.Label).fontSize = this.getSizeByKeyEnum(this.fontSizeActive);
            if (this.fontSizeActive == LABEL_FONT_SIZE_CONFIG.TITLE_MENU || this.fontSizeActive == LABEL_FONT_SIZE_CONFIG.CONTENT_POPUP || this.fontSizeActive == LABEL_FONT_SIZE_CONFIG.CONTENT_MENU || this.fontSizeActive == LABEL_FONT_SIZE_CONFIG.NORMAL) {
                // this.node.getComponent(cc.Label).font =  BGUI.GameCoreManager.instance.listFontCommon;
                if(this.fontSizeActive == LABEL_FONT_SIZE_CONFIG.TITLE_MENU){
                    this.node.getComponent(cc.Label).enableBold = true;
                }
            } else {
                // this.node.getComponent(cc.Label).font = BGUI.GameCoreManager.instance.listFontLanguage[requiredIndex];
                this.node.getComponent(cc.Label).enableBold = true;

                this._addLabelShadow()

                switch (this.fontSizeActive) {
                    case LABEL_FONT_SIZE_CONFIG.TITLE_POPUP:
                        this._addLabelOutLine(cc.color(184, 74, 1, 255))
                        this.node.color = cc.color(255, 218, 45, 255);
                        break;
                    case LABEL_FONT_SIZE_CONFIG.BUTTON_POPUP:
                        this._addLabelOutLine(cc.color(106, 71, 3, 255))
                        this.node.color = cc.color(255, 204, 45, 255);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    private getSizeByKeyEnum(x) {
        let size = 20;
        switch (x) {
            case LABEL_FONT_SIZE_CONFIG.TITLE_POPUP:
                size = 40;
                break;
            case LABEL_FONT_SIZE_CONFIG.CONTENT_POPUP:
                size = 28;
                break;
            case LABEL_FONT_SIZE_CONFIG.BUTTON_POPUP:
                size = 30;
                break;

            case LABEL_FONT_SIZE_CONFIG.TITLE_MENU:
                size = 26;
                break;

            case LABEL_FONT_SIZE_CONFIG.CONTENT_MENU:
                size = 20;
                break;

            case LABEL_FONT_SIZE_CONFIG.NORMAL:
                size = 22;
                break;
            default:
                break;
        }
        return size;
    }


    private _addLabelShadow(blur = 2, offsetY = -3) {
        let shadow = this.node.getComponent(cc.LabelShadow);
        if (!shadow) {
            shadow = this.node.addComponent(cc.LabelShadow);
        }

        shadow.color = cc.Color.BLACK
        shadow.blur = blur;
        shadow.offset.x = 0
        shadow.offset.y = offsetY
    }

    private _addLabelOutLine(color = cc.Color.ORANGE, width = 2) {
        let outline = this.node.getComponent(cc.LabelOutline);
        if (!outline) {
            outline = this.node.addComponent(cc.LabelOutline);
        }
        outline.color = color
        outline.width = width;
    }

   
    onLoad() {
        if (CC_EDITOR) return;
        this._updateCustomFont();
        this._updateText();
    }

    _updateText() {
        if (this.localizedString) {
            if (this.upperCaseString) {
                this.node.getComponent(cc.Label).string = LanguageManager.getString(this.textKey).toUpperCase();
            } else {
                this.node.getComponent(cc.Label).string = LanguageManager.getString(this.textKey);
            }
        }
        return this.node.getComponent(cc.Label).string;
    }
}
