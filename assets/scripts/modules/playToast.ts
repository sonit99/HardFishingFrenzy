import GamePlayManager from "../manager/GamePlayMgr";


const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayToast extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.Button)
    btn: cc.Button[] = [];

    init(isWin: boolean) {
        this.node.active = true;
        if (isWin) {
            // this.label.string = LanguageMgr.getString("toast_win");
            this.btn[0].node.active = true;
            this.btn[1].node.active = false;
            this.btn[2].node.active = true;
            this.btn[3].node.active = false;
        } else {
            // this.label.string = LanguageMgr.getString("toast_lose");
            this.btn[0].node.active = false;
            this.btn[1].node.active = true;
            this.btn[2].node.active = false;
            this.btn[3].node.active = true;
        }

    }

    onClickOpenShop() {
        GamePlayManager.instance.openShop();
        this.node.active = false;
    }

    onClickNextLevel() {
        GamePlayManager.instance.nextLevel();
        this.node.active = false;
    }

    onClickRestartLevel() {
        GamePlayManager.instance.restartLevel();
        this.node.active = false;
    }

    onClickReturnHome() {
        GamePlayManager.instance.returnHome();
        this.node.active = false;
    }
}
