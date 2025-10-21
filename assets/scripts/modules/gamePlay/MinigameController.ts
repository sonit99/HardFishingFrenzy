const { ccclass, property } = cc._decorator;

@ccclass
export default class MiniGameController extends cc.Component {
    @property(cc.Node)
    balanceBar: cc.Node = null;

    @property(cc.Node)
    pointer: cc.Node = null;

    private balance: number = 0; // -1 to 1
    private targetBalance: number = 0;
    private difficulty: number = 1;

    startMiniGame(difficulty: number = 1) {
        this.node.active = true;
        this.difficulty = difficulty;
        this.balance = 0;
        this.targetBalance = 0;
        this.schedule(this.updateTarget, 0.5);
    }

    updateTarget() {
        this.targetBalance = (Math.random() * 2 - 1) * this.difficulty;
    }

    update(dt: number) {
        if (!this.node.active) return;

        // move pointer toward target
        this.balance += (this.targetBalance - this.balance) * dt * 2;
        this.pointer.x = this.balance * (this.balanceBar.width / 2);

        // failure check
        if (Math.abs(this.balance) > 0.95) {
            this.failMiniGame();
        }
    }

    onTouch(event: cc.Event.EventTouch) {
        // Example: keep in green by pressing to counter fish force
        const loc = event.getLocation();
        const center = cc.v2(cc.winSize.width / 2, cc.winSize.height / 2);
        this.balance += (loc.x < center.x ? -1 : 1) * 0.02;
    }

    failMiniGame() {
        cc.log("💥 Line snapped!");
        this.node.active = false;
        this.unschedule(this.updateTarget);
    }

    winMiniGame() {
        cc.log("🏆 Fish caught!");
        this.node.active = false;
        this.unschedule(this.updateTarget);
    }
}
