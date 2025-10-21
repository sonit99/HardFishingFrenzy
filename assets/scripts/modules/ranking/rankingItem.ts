import { DataManager } from "../../manager/DataMgr";
import ScreenManager, { POPUP } from "../../manager/ScreenMgr";
import { UITransition } from "../../manager/UIMgr";

const {ccclass, property} = cc._decorator;



@ccclass
export default class RankingItem extends cc.Component {

    @property(cc.Label)
    nRank: cc.Label = null;
 
    @property(cc.Label)
    nName: cc.Label = null;
 
    @property(cc.Label)
    nPoint: cc.Label = null;
 
    @property(cc.Label)
    nTier: cc.Label = null;

    stat: RankingItemStats = {
        rank: 0,
        name: "",
        point: 0,
        tier: ""
    }
 
    // =========================================

    createItem(stat: RankingItemStats){
        this.stat = stat;
        this.nRank.string = stat.rank.toFixed();
        this.nName.string = stat.name;
        this.nPoint.string = stat.point.toFixed();
        this.nTier.string = stat.tier;
    }

    onClickItem() {
        // ScreenManager.openPopup(DataManager.instance.getPrefabPath(POPUP.PLAYERDETAIL), UITransition.POPUP_SCALE, (node) => {
        //     node.getComponent(PlayerDetail).nameLbl.string = this.nName.string;
        // });
    }
}

export interface RankingItemStats {
    rank: number;
    name: string;
    point: number;
    tier: string;
}