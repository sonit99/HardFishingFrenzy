import { LANGUAGE } from "../manager/LanguageMgr";
import SpriteFrameSet from "./SpriteFrameSet";


const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("BGUI/Multi Language/Sprite")
export default class SpriteLocalized extends cc.Component {


    @property([SpriteFrameSet])
    spriteConfigs: SpriteFrameSet[] = this.loadLang();


    loadLang(): Array<SpriteFrameSet> {
        var newArr: Array<SpriteFrameSet> = [];
        for (var i = 0; i < Object.keys(LANGUAGE).length; i++) {
            var spFrameSet = new SpriteFrameSet();
            spFrameSet.setLang(i);
            newArr.push(spFrameSet);
        }
        return newArr;
    }

   
}




