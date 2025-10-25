import GameCoreManager from "../manager/GameCoreMgr";
import SoundUtil, { BGM, SFX } from "../utils/SoundUtil";
import UICtrl from "./UICtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Lobby extends cc.Component {

  @property(cc.Node)
  popup: cc.Node = null;

  @property(cc.Node)
  btnyes: cc.Node = null;

  @property(cc.Node)
  btnno: cc.Node = null;

  @property(cc.Node)
  btnclose: cc.Node = null;

  isOpen: boolean = false;

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this.popup.active = this.isOpen = false;

    this.btnclose.on(
      cc.Node.EventType.TOUCH_START,
      function () {
        SoundUtil.instance.playSFX(SFX.Click);
        this.closePopup();
      },
      this
    );

    this.btnno.on(
      cc.Node.EventType.TOUCH_START,
      function () {
        SoundUtil.instance.playSFX(SFX.Click);
        this.closePopup();
      },
      this
    );

    this.btnyes.on(
      cc.Node.EventType.TOUCH_START,
      function () {
        SoundUtil.instance.playSFX(SFX.Click);
        this.closePopup();
        GameCoreManager.instance.activateGamePlay();
        UICtrl.instance.updateSashimi(-50);
      },
      this
    );
  }

  onStart() {
    SoundUtil.instance.playBGM(BGM.Lobby);
    GameCoreManager.instance.lobbyBgEvent(function () {
      SoundUtil.instance.playSFX(SFX.Click);
      this.onClick();
    });
  }

  onDestroy() {
    this.btnclose.off(cc.Node.EventType.TOUCH_START);
    this.btnno.off(cc.Node.EventType.TOUCH_START);
    this.btnyes.off(cc.Node.EventType.TOUCH_START);
  }

  // ======================================================================
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
}
