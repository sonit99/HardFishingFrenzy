// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import SoundUtil, { SFX } from "../../utils/SoundUtil";
import UICtrl from "../UICtrl";
import { FishRarity } from "./Fish";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PopUp extends cc.Component {

    @property(cc.Label)
    fishName: cc.Label = null;

    @property(cc.Label)
    fishLength: cc.Label = null;

    @property(cc.Label)
    sellPrice: cc.Label = null;

    @property(cc.Node)
    closeBtn: cc.Node = null;

    @property(cc.Node)
    sellBtn: cc.Node = null;

    @property(cc.Sprite)
    raritySpr: cc.Sprite = null;

    @property(cc.SpriteFrame)
    listSprite: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    listFishSpr: cc.SpriteFrame[] = [];

    @property(cc.Sprite)
    fishSpr: cc.Sprite = null;

    // ======================================
    onLoad() {
        this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClose, this);
        this.sellBtn.on(cc.Node.EventType.TOUCH_END, this.onSell, this);
    }

    protected onDestroy(): void {
        this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClose, this);
        this.sellBtn.off(cc.Node.EventType.TOUCH_END, this.onSell, this);
    }

    // ======================================
    public setFishInfo(name: string, length: number, price: number, rarity: FishRarity = FishRarity.Common, id: number = 1) {
        this.fishName.string = name;
        this.fishLength.string = `${length.toFixed(2)} CM`;
        this.sellPrice.string = `x${price.toFixed()}`;
        switch (rarity) {
            case FishRarity.Common:
                this.raritySpr.spriteFrame = this.listSprite[0];
                break;
            case FishRarity.Uncommon:
                this.raritySpr.spriteFrame = this.listSprite[1];
                break;
            case FishRarity.Rare:
                this.raritySpr.spriteFrame = this.listSprite[2];
                break;
            case FishRarity.Epic:
                this.raritySpr.spriteFrame = this.listSprite[3];
                break;
            case FishRarity.Legend:
                this.raritySpr.spriteFrame = this.listSprite[4];
                break;
        }

        this.fishSpr.spriteFrame = this.listFishSpr[id - 1];
    }

    private onClose() {
        SoundUtil.instance.playSFX(SFX.Click);
        this.closePopup();
    }

    private onSell() {
        cc.log("💰 Fish sold!");
        SoundUtil.instance.playSFX(SFX.Sell, false, 1, 0.2);
        UICtrl.instance.updateCoin(parseFloat(this.sellPrice.string.slice(1)));
        this.closePopup();
    }

    isOpen: boolean = false;
    onClick() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openPopup();
        } else {
            this.closePopup();
        }
    }

    openPopup() {
        this.isOpen = true;
        this.node.active = true;
        this.node.opacity = 0;
        this.node.runAction(cc.fadeIn(0.25));
    }

    closePopup() {
        let fadeOut = cc.fadeOut(0.25);
        let deactivate = cc.callFunc(() => {
            this.node.active = false;
            this.isOpen = false;
        });
        let seq = cc.sequence(fadeOut, deactivate);
        this.node.runAction(seq);
    }
}
