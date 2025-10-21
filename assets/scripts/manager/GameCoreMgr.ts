import { DataManager } from "../../scripts/manager/DataMgr";
import LoadingLayer from "../modules/loadingLayer";
import { LanguageManager } from "./LanguageMgr";
import ScreenManager from "./ScreenMgr";
import { UITransition } from "./UIMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameCoreManager extends cc.Component {
  public static instance: GameCoreManager = null;

  @property(cc.Font)
  listFontCommon: cc.Font = null;

  @property(cc.Font)
  listFontLanguage: Array<cc.Font> = [];

  @property(cc.Node)
  mainLoadingLayer: LoadingLayer = null;


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
        this.loadProgressCb(finished, total, item);
      },
      (err, assets) => {
        if (err) {
          console.error("Lỗi load:", err);
          return;
        }
        console.log("Load xong toàn bộ:", assets.length);
        ScreenManager.openPage(DataManager.instance.getPrefabPath("GamePlay"),UITransition.FADE)
      }
    );

  }

  /////////////////////////////////////////////////////////////////////////////////

  loadProgressCb(completedCount: number, totalCount: number, item: any): void {
    this.mainLoadingLayer
      .getComponent(LoadingLayer)
      .changeProgress(completedCount / totalCount);
  }
}
