const {ccclass, property} = cc._decorator;
import { LanguageManager } from "../manager/LanguageMgr";
import PrefabSet from "./PrefabSet";

@ccclass
export default class PrefabLocalized extends cc.Component {
    @property({
        type: [PrefabSet],
        visible: function (this: PrefabLocalized) { return true }
    })
    public prefabConfigs: PrefabSet[] = [];

    // onLoad () {}

    start () {
        // this.updateLanguage();
    }

    protected onEnable(): void {
        this.updateLanguage();
    }

    private mapIndexLanguage() {
        var obj = {};
        for (let i = 0; i < this.prefabConfigs.length; i++) {
            var language = this.prefabConfigs[i].language;
            obj[language] = i
        }
        return obj;
    }

    private updateLanguage() {
        let currentLanguage = LanguageManager.getCurrentLanguage();
        this.node.removeAllChildren();
        // this.node.destroyAllChildren();
        let objLangConfig = { "vn": 0, "en": 1, "mm": 2, "tl": 3, "cam": 4 };    
        // console.log("======vgb=====", objLangConfig[currentLanguage], this.prefabConfigs[objLangConfig[currentLanguage]]);
        var newPrefab = cc.instantiate(this.prefabConfigs[objLangConfig[currentLanguage]].prefLanguage);
        // console.log("newPrefab", newPrefab);
        this.node.addChild(newPrefab);  
        if (objLangConfig[currentLanguage] >= 0) {
          
        }
    }
}
