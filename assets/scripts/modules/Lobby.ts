// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import SoundUtil from "../utils/SoundUtil";
import PopUp from "./gamePlay/PopUp";

const {ccclass, property} = cc._decorator;

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

    sashimi: number = 250;
    coin: number = 500;
    bait: number = 3;
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        Lobby.instance = this;
        SoundUtil.instance.playMusic(2);
        this.popup.active = false;
        this.bg.on(cc.Node.EventType.TOUCH_END, function (event) {
            SoundUtil.instance.playEffect(6);
            this.popup.active = true;
        }, this);

        this.btnclose.on(cc.Node.EventType.TOUCH_START, function (event) {
            SoundUtil.instance.playEffect(6);
            this.popup.active = false;
        }, this);

        this.btnno.on(cc.Node.EventType.TOUCH_START, function (event) {
            SoundUtil.instance.playEffect(6);
            this.popup.active = false;
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
    }

    updateLabels() {
        this.lblsashimi.string = this.sashimi.toString();
        this.lblcoin.string = this.coin.toString();
    }
}
