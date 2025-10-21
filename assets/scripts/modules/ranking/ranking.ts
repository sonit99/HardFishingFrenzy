import { DataManager } from "../../manager/DataMgr";
import ScreenManager, { ITEM, POPUP } from "../../manager/ScreenMgr";
import { UITransition } from "../../manager/UIMgr";
import RankingItem, { RankingItemStats } from "./rankingItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Ranking extends cc.Component {

    @property(cc.ScrollView)
    scrollview: cc.ScrollView = null;

    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;

    private data: string[] = [];
    private data1 = ["Apple", "Banana", "Orange", "Mango"];
    private data2 = ["Banana", "Orange", "Mango", "Grapes", "Apple", "Orange", "Mango", "Grapes", "Apple", "Orange", "Mango", "Grapes", "Apple"];
    private data5 = ["Orange", "Banana", "Orange", "Mango", "Grapes", "Apple", "Orange", "Mango", "Grapes", "Apple", "Mango", "Grapes", "Apple"];
    private data3 = ["Orange", "Mango", "Grapes", "Apple", "Banana"];
    private data4 = ["Mango", "Grapes", "Apple", "Banana"];

    // ========== Function ========== 
    updateData(): void {
        const content = this.scrollview.content;
        const children = content.children;
        const curCount = children.length;
        const newCount = this.data.length;

        // 1. Cập nhật (và kích hoạt) các item có sẵn nếu còn trong phạm vi data
        for (let i = 0; i < Math.min(curCount, newCount); i++) {
            const itemNode = children[i];
            itemNode.active = true;
            let stat: RankingItemStats = {
                rank: i + 1,
                name: this.data[i],
                point: 1300 - i * 100,
                tier: "Cooper"
            }
            itemNode.getComponent(RankingItem).createItem(stat);
            itemNode.getChildByName("BG").color = cc.Color.WHITE;
        }

        // 2. Nếu thiếu item => tạo thêm
        if (newCount > curCount) {
            for (let i = curCount; i < newCount; i++) {
                const itemNode = cc.instantiate(this.itemPrefab);
                let stat: RankingItemStats = {
                    rank: i + 1,
                    name: this.data[i],
                    point: 1300 - i * 100,
                    tier: "Cooper"
                }
                itemNode.getComponent(RankingItem).createItem(stat);
                itemNode.getChildByName("BG").color = cc.Color.WHITE;
                content.addChild(itemNode);
            }
        }

        // 3. Nếu dư item => ẩn bớt
        if (newCount < curCount) {
            for (let i = newCount; i < curCount; i++) {
                children[i].active = false;
            }
        }
    }

    animation(oldRank: number, newRank: number) {
        const content = this.scrollview.content;
        const layout = content.getComponent(cc.Layout);
        const oldNode = content.children[oldRank - 1];
        const newNode = content.children[newRank - 1];

        // const startWorldPos = oldNode.parent.convertToWorldSpaceAR(oldNode.position);
        // const endWorldPos = newNode.parent.convertToWorldSpaceAR(newNode.position);
        // const startLocalPos = this.scrollview.node.convertToNodeSpaceAR(startWorldPos);
        // const endLocalPos = this.scrollview.node.convertToNodeSpaceAR(endWorldPos);
        // cc.log("position", startLocalPos, endLocalPos);

        const startPos = oldNode.position.clone();
        const endPos = newNode.position.clone();

        DataManager.instance.getPrefabs(ITEM.RANKINGITEM).then(prf => {

            let offset = this.getScrollVector(oldRank);
            cc.error(offset)
            this.scrollview.scrollTo(offset, 0.3); // 0.3s để scroll mượt

            let movingNode = cc.instantiate(prf);
            movingNode.getComponent(RankingItem).createItem(oldNode.getComponent(RankingItem).stat);
            movingNode.getChildByName("BG").color = cc.Color.YELLOW;
            oldNode.active = false;
            layout.updateLayout();
            layout.enabled = false;
            content.addChild(movingNode);
            movingNode.setPosition(startPos);

            this.scheduleOnce(() => {
                offset = this.getScrollVector(newRank);
                cc.error(offset)
                this.scrollview.scrollTo(offset, 0.75, false);

                cc.tween(movingNode)
                    .to(1, { position: endPos }, { easing: '' })
                    .call(() => {
                        movingNode.destroy();
                        // oldNode.active = true;
                        layout.enabled = true;
                        layout.updateLayout();
                        this.data = this.data5;
                        this.updateData()
                        newNode.getChildByName("BG").color = cc.Color.YELLOW;
                    })
                    .start();
            }, 0.25)
        })
            .catch(err => cc.error(err))
    }

    getScrollVector(rank: number) {
        let offY = (this.data.length - rank) / this.data.length;
        if (rank === 1) {
            offY = 1
        } else if (rank === this.data.length) {
            offY === 0
        }
        return cc.v2(0, offY);
    }

    // ========== Cycle ========== 
    protected onLoad(): void {
        this.onClickArenaRanking();
    }

    // ========== On Click ========== 
    onClickArenaRanking() {
        this.data = this.data1;
        this.updateData();
    }

    onClickMineLevel() {
        this.data = this.data2;
        this.updateData();
    }

    onClickMineScore() {
        this.data = this.data3;
        this.updateData();
    }

    onClickFriendComparison() {
        this.data = this.data4;
        this.updateData();
    }

    onClickBack() {
        ScreenManager.backPage();
        // this.animation(6, 5)
    }

    onClickPlayer() {
        ScreenManager.openPopup(DataManager.instance.getPrefabPath(POPUP.PLAYERDETAIL), UITransition.POPUP_SCALE);
    }
}
