
import SoundUtil from "../utils/SoundUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Lobby extends cc.Component {
    static instance: Lobby = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Node)
    popup: cc.Node = null;

    @property(cc.Node)
    btnyes: cc.Node = null;

    @property(cc.Node)
    btnno: cc.Node = null;

    @property(cc.Node)
    btnclose: cc.Node = null;

    @property(cc.Node)
    gameplay: cc.Node = null;

    @property(cc.Label)
    lblsashimi: cc.Label = null;

    @property(cc.Label)
    lblcoin: cc.Label = null;

    @property(cc.Node)
    title: cc.Node = null;

    sashimi: number = 250;
    coin: number = 500;
    bait: number = 3;

    isOpen: boolean = false;
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.SHOW_ALL);
        cc.view.resizeWithBrowserSize(true);
        Lobby.instance = this;
        this.node.active = true;
        SoundUtil.instance.playMusic(2);
        this.popup.active = this.isOpen = false;
        this.bg.on(cc.Node.EventType.TOUCH_END, function (event) {
            SoundUtil.instance.playEffect(6);
            this.onClick();
        }, this);

        this.btnclose.on(cc.Node.EventType.TOUCH_START, function (event) {
            SoundUtil.instance.playEffect(6);
            this.closePopup();
        }, this);

        this.btnno.on(cc.Node.EventType.TOUCH_START, function (event) {
            SoundUtil.instance.playEffect(6);
            this.closePopup();
        }, this);

        this.btnyes.on(cc.Node.EventType.TOUCH_START, function (event) {
            SoundUtil.instance.playEffect(6);
            this.bg.active = false;
            this.node.active = false;
            this.gameplay.active = true;

            this.sashimi -= 50;
            this.updateLabels();
        }, this);

        this.updateLabels();
        this.zoomInOut();
    }

    onClick() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openPopup();
        } else {
            this.closePopup();
        }
    }

    openPopup() {
        this.popup.active = true;
        this.popup.opacity = 0;
        this.popup.runAction(cc.fadeIn(0.25));
    }

    closePopup() {
        let fadeOut = cc.fadeOut(0.25);
        let deactivate = cc.callFunc(() => {
            this.popup.active = false;
            this.isOpen = false;
        });
        let seq = cc.sequence(fadeOut, deactivate);
        this.popup.runAction(seq);
    }

    updateLabels() {
        this.lblsashimi.string = this.sashimi.toString();
        this.lblcoin.string = this.coin.toString();
    }

    zoomInOut() {
        let scaleUp = cc.scaleTo(0.5, 1.1);
        let scaleDown = cc.scaleTo(0.5, 1.0);
        let seq = cc.sequence(scaleUp, scaleDown);
        this.title.runAction(cc.repeatForever(seq));
    }
}
