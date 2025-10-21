import { DataManager } from "../manager/DataMgr";
import ScreenManager, { PAGE } from "../manager/ScreenMgr";
import { UITransition } from "../manager/UIMgr";

const {ccclass, property} = cc._decorator;
 
@ccclass
export default class Home extends cc.Component {

    @property(cc.Button)
    label: cc.Button[] = [];

    ///////////////////////////////////////////////////////

    onClickRanking(){
        ScreenManager.openPage(DataManager.instance.getPrefabPath(PAGE.RANKING),UITransition.FADE);
    }

    onClickShop(){
        ScreenManager.openPage(DataManager.instance.getPrefabPath(PAGE.SHOP),UITransition.FADE);
    }

    onClickEvent(){}

    onClickCustomization(){
        ScreenManager.openPage(DataManager.instance.getPrefabPath(PAGE.CUSTOMIZATION),UITransition.FADE);
    }

    onClickSeasonPass(){}

    onClickPlay(){
        ScreenManager.openPage(DataManager.instance.getPrefabPath(PAGE.MODE),UITransition.FADE);
    }
}
