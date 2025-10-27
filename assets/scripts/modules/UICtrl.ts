
const { ccclass, property } = cc._decorator;

@ccclass
export default class UICtrl extends cc.Component {
    public static instance: UICtrl = null;

    @property(cc.Node)
    nInfo: cc.Node = null;

    @property(cc.Label)
    lblSashimi: cc.Label = null;

    @property(cc.Label)
    lblCoin: cc.Label = null;

    @property(cc.Node)
    powerBar: cc.Node = null;

    private _sashimi: number = 250;

    getSashimi(): number {
        return this._sashimi;
    }

    updateSashimi(amount: number) {
        this._sashimi += amount;
        this.updateLabels();
    }

    private _coin: number = 500;

    getCoin(): number {
        return this._coin;
    }

    updateCoin(amount: number) {
        this._coin += amount;
        this.updateLabels();
    }

    private _bait: number = 3;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        UICtrl.instance = this;
        this.updateLabels();

    }

    protected start(): void {
        this.nInfo.active = false;
        this.powerBar.active = false;
    }


    updateLabels() {
        this.lblSashimi.string = this._sashimi.toString();
        this.lblCoin.string = this._coin.toString();
    }

    activeatePowerBar(bool: boolean) {
        this.powerBar.active = bool;
    }

    updatePowerBarProgress(progress: number = 0) {
        this.powerBar.getComponent(cc.ProgressBar).progress = progress;
    }

    updatePBColor(c: cc.Color){
        this.powerBar.children[0].color = c;
    }
}
