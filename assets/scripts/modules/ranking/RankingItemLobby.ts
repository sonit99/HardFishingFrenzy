import { DataManager } from "../../manager/DataMgr";
import ScreenManager, { POPUP } from "../../manager/ScreenMgr";
import { UITransition } from "../../manager/UIMgr";
import { TableViewCell } from "../../utils/Cell";

const {ccclass, property} = cc._decorator;



@ccclass
export default class RankingItemLobby extends TableViewCell {

    @property(cc.Label)
    nRank: cc.Label = null;
 
    @property(cc.Label)
    nName: cc.Label = null;
 
    @property(cc.Label)
    nPoint: cc.Label = null;
 
    @property(cc.Label)
    nTier: cc.Label = null;
 
    // =========================================

    createItem(stat: RankingItemStats){
        this.cellData = stat;
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

    protected onUpdateCell(index: number, data: any, forceUpdate: boolean) {
        // cc.log(`Updating cell at index ${index}`, data);
        if (data) {
            this.createItem(data as RankingItemStats);
        }
    }

    protected onClick() {
        if (this.tableView && this.tableView.onCellClicked) {
            this.tableView.onCellClicked(this.cellIndex, this.cellData, this);
            this.onClickItem();
        }
    }

    protected onLongClick() {
        this.longClickScheduled = false;
        this.node.emit(cc.Node.EventType.TOUCH_CANCEL);
        
        if (this.tableView && this.tableView.onCellLongClicked) {
            this.tableView.onCellLongClicked(this.cellIndex, this.cellData, this);
        }
    }

    protected onDragStart() {
        // Override for custom drag start behavior
    }

    protected onDragEnd() {
        // Override for custom drag end behavior
    }

    getCellIndex(): number {
        return this.cellIndex;
    }

    getCellData(): any {
        return this.cellData;
    }
}

export interface RankingItemStats {
    rank: number;
    name: string;
    point: number;
    tier: string;
}