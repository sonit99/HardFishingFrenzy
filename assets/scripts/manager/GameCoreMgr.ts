import { DataManager } from "../../scripts/manager/DataMgr";
import { LanguageManager } from "./LanguageMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameCoreManager extends cc.Component {
  public static instance: GameCoreManager = null;

  // @property(cc.Node)
  // mainLoadingLayer: LoadingLayer = null;

  private _nGamePlay: cc.Node = null;
  private _nLobby: cc.Node = null;
  private _nCamera: cc.Node = null;
  private _nBG: cc.Node = null;

  ////////////////////////////////////////////////////////////////////////////////////////////////

  onLoad() {
    GameCoreManager.instance = this;

    cc.view.setDesignResolutionSize(1080, 1920, cc.ResolutionPolicy.SHOW_ALL);
    cc.debug.setDisplayStats(CC_DEBUG);
    cc.view.resizeWithBrowserSize(true);
    // cc.view.enableAutoFullScreen(true);
    LanguageManager.updateLang();
  }

  async start(): Promise<void> {
    await DataManager.instance.loadAll();
    cc.resources.preloadDir(
      "prefabs",
      (finished: number, total: number, item: any) => {
        // this.loadProgressCb(finished, total, item);
        this.initBGNode();
        this.initGamePlayNode();
        this.initLobbyNode();
        this.initCameraNode();
        this.node.sortAllChildren();
      },
      (err, assets) => {
        if (err) {
          console.error("Lỗi load:", err);
          return;
        }
        console.log("Load xong toàn bộ:", assets.length);
      }
    );
  }

  initBGNode() {
    this._nBG = cc.find("BG", this.node);
    this._nBG.setSiblingIndex(0);
    this._nBG.active = true;
  }

  initGamePlayNode() {
    DataManager.instance.getPrefabs("GamePlay").then((prefab) => {
      this._nGamePlay = cc.instantiate(prefab);
      this._nGamePlay.parent = this.node;
      this._nGamePlay.setSiblingIndex(1);
      this._nGamePlay.active = false;
    });
  }

  initLobbyNode() {
    DataManager.instance.getPrefabs("Lobby").then((prefab) => {
      this._nLobby = cc.instantiate(prefab);
      this._nLobby.parent = this.node;
      this._nLobby.setSiblingIndex(2);
      this._nLobby.active = true;
    });
  }

  initCameraNode() {
    this._nBG = cc.find("Main Camera", this.node);
    this._nBG.setSiblingIndex(10);
    this._nBG.active = true;
  }

  /////////////////////////////////////////////////////////////////////////////////

  // loadProgressCb(completedCount: number, totalCount: number, item: any): void {
  //   this.mainLoadingLayer
  //     .getComponent(LoadingLayer)
  //     .changeProgress(completedCount / totalCount);
  // }

  activateGamePlay() {
    this._nBG.children[2].active = false; // disable lobby bg
    this._nBG.children[0].active = true;
    this._nBG.children[1].active = true;
    this._nBG.children[0].getComponent(cc.Widget).updateAlignment();
    this._nBG.children[1].getComponent(cc.Widget).updateAlignment();
    this._nLobby.active = false;
    this._nGamePlay.active = true;
  }

  lobbyBgEvent(callFunc: Function) {
    this._nBG.children[2].on(cc.Node.EventType.TOUCH_START, callFunc, this);
  }

  getCameraPos(): cc.Vec2 {
    return this._nCamera.getPosition();
  }

  getCameraWorldPos(): cc.Vec2 {
    return this._nCamera.convertToWorldSpaceAR(cc.v2(0, 0));
  }

  setCameraPosition(pos: cc.Vec2) {
    this._nCamera.setPosition(pos);
  }

  updateCameraFollow(targetHookPos: cc.Vec2) {
    if (!this._nCamera) return;

    // 🎯 Chỉ follow ngang theo hook
    const currentCamPos = this._nCamera.getPosition();

    // Vị trí camera mục tiêu chỉ thay đổi X, giữ nguyên Y và Z hiện tại
    const targetCamX = cc.misc.lerp(currentCamPos.x, targetHookPos.x, 1);

    this._nCamera.setPosition(targetCamX, currentCamPos.y);
  }
}
