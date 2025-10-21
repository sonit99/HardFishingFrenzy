import { LANGUAGE } from "../manager/LanguageMgr";
import SpineAnimationSet from "./SpineAnimationSet";

const {ccclass, property,menu} = cc._decorator;

@ccclass
@menu("BGUI/Multi Language/Spine")
export default class SpineLocalized extends cc.Component {
    @property(cc.Boolean)
    isRunNew: boolean = false;

    @property(cc.Boolean)
    isLoop: boolean = true;

 
    @property({
        type: [SpineAnimationSet],
        visible: function (this: SpineLocalized) { return !this.isRunNew }
    })
    spineConfigs: SpineAnimationSet[] = this.loadLang();

    loadLang(): Array<SpineAnimationSet> {
        var newArr: Array<SpineAnimationSet> = [];
        for (var i = 0; i < Object.keys(LANGUAGE).length; i++) {
            var spin = new SpineAnimationSet();
            spin.setLang(i);
            newArr.push(spin);
        }
        return newArr;
    }


 
}
