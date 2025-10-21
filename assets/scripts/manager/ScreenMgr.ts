// ScreenManager.ts
import { DataManager } from "./DataMgr";
import { EventMgr } from "./EventMgr";
import UIManager, { UILayer, UIPrefabType, UITransition } from "./UIMgr";

export const PAGE = {
    CUSTOMIZATION: "Customization",
    GAMEPLAY: "GamePlay",
    HOME: "Home",
    MODE: "Mode",
    RANKING: "Ranking",
    SHOP: "Shop",
    EVENT: "Event",
    SEASONPASS: "SeasonPass",
    LOBBY: "Lobby"
}

export const POPUP = {
    PLAYERDETAIL: "PlayerDetail"
}

export const ITEM = {
    RANKINGITEM: "RankingItem"
}

export default class ScreenManager {
    /** O̲p̲e̲n̲ ̲P̲A̲G̲E̲ ̲(full screen) */
    static async openPage(
        prefabPath: string,
        transition: UITransition = UITransition.NONE,
        callback?: (node: cc.Node) => void
    ) {
        const uiMgr = UIManager.instance;
        const stack = uiMgr.getUIStack();

        // Nếu đang mở đúng page đó → bring to front
        if (stack.length > 0) {
            const current = stack[stack.length - 1];
            if (current === prefabPath) {
                const node = uiMgr.getUI(prefabPath);
                if (node) {
                    // Bring lên đầu layer
                    const pageLayer = uiMgr.getLayer(UILayer.PAGE);
                    node.removeFromParent(false);
                    pageLayer.addChild(node);

                    uiMgr["_playTransition"]?.(node, transition);
                    callback && callback(node);
                    EventMgr.instance.emit("UI_BringToFront", { prefabPath, node });
                    return;
                }
            } else {
                // Đóng page hiện tại trước
                await uiMgr.deactivateUI(current, transition);
            }
        }

        // Mở mới
        uiMgr.openUI(prefabPath, UIPrefabType.PAGE, transition, node => {
            EventMgr.instance.emit("UI_OpenPage", { prefabPath, node });
            callback && callback(node);
        });
    }

    /** B̲a̲c̲k̲ ̲t̲o̲ ̲p̲r̲e̲v̲i̲o̲u̲s̲ ̲p̲a̲g̲e̲ */
    static backPage(transition: UITransition = UITransition.NONE) {
        UIManager.instance.back(transition);
        EventMgr.instance.emit("UI_BackPage", undefined);
    }

    /** C̲l̲o̲s̲e̲ ̲c̲u̲r̲r̲e̲n̲t̲ ̲p̲a̲g̲e̲ */
    static closePage(transition: UITransition = UITransition.NONE) {
        const uiMgr = UIManager.instance;
        const stack = uiMgr.getUIStack();
        if (stack.length === 0) return;

        const current = stack[stack.length - 1];
        uiMgr.closeCurrent(transition);
        EventMgr.instance.emit("UI_ClosePage", { prefabPath: current });
    }

    /** O̲p̲e̲n̲ ̲P̲O̲P̲U̲P */
    static openPopup(
        prefabPath: string,
        transition: UITransition = UITransition.POPUP_SCALE,
        callback?: (node: cc.Node) => void
    ) {
        const uiMgr = UIManager.instance;
        uiMgr.openUI(prefabPath, UIPrefabType.POPUP, transition, node => {
            EventMgr.instance.emit("UI_OpenPopup", { prefabPath, node });
            callback && callback(node);
        });
    }

    /** C̲l̲o̲s̲e̲ 1 popup cụ thể */
    static closePopup(prefabPath: string, transition: UITransition = UITransition.POPUP_SCALE) {
        UIManager.instance.closeUI(prefabPath, transition);
        EventMgr.instance.emit("UI_ClosePopup", { prefabPath });
    }

    /** C̲l̲o̲s̲e̲ ̲T̲A̲T̲ ̲C̲Ả popup (không ảnh hưởng PAGE) */
    static closeAllPopups(transition: UITransition = UITransition.POPUP_SCALE) {
        const uiMgr = UIManager.instance;
        const popupLayer = uiMgr.getLayer(UILayer.POPUP);

        // Duyệt trong _uiMap
        uiMgr["_uiMap"]?.forEach((node, path) => {
            if (node.parent === popupLayer) {
                uiMgr.closeUI(path, transition);
                EventMgr.instance.emit("UI_ClosePopup", { prefabPath: path });
            }
        });
    }

    /** K̲i̲ể̲m̲ ̲t̲r̲a̲ UI có đang bật không */
    static isOpen(prefabPath: string): boolean {
        return UIManager.instance.isOpen(prefabPath);
    }

    static backHome() {
        this.openPage(DataManager.instance.getPrefabPath(PAGE.HOME),UITransition.FADE)
    }
}
