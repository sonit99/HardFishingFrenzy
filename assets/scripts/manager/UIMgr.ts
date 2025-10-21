import { DataManager } from "./DataMgr";
import { PAGE } from "./ScreenMgr";

const { ccclass, property } = cc._decorator;

enum UILayer {
    BACKGROUND = 0,
    PAGE = 1,      // Pages
    POPUP = 2,     // Multi-instance popups
    OVERLAY = 3,
}

enum UITransition {
    NONE = 0,
    FADE = 1,
    POPUP_SCALE = 2,
}

enum UIPrefabType {
    PAGE = 0,
    POPUP = 1,
}


@ccclass
export default class UIManager extends cc.Component {
    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        return this._instance;
    }

    @property(cc.Node)
    uiRoot: cc.Node = null;

    @property(cc.Prefab)
    FadedBgPrf: cc.Prefab = null;

    private _layers: Map<UILayer, cc.Node> = new Map();
    private _uiMap: Map<string, cc.Node> = new Map();
    private _uiStack: string[] = []; // chỉ quản lý Pages

    onLoad() {
        if (UIManager._instance) {
            this.destroy();
            return;
        }
        UIManager._instance = this;
        cc.game.addPersistRootNode(this.node);
        this._initLayers();
    }

    private _initLayers() {
        Object.values(UILayer)
            .filter(v => typeof v === "number")
            .forEach((layerIndex: UILayer) => {
                let layerNode = new cc.Node(UILayer[layerIndex]);
                layerNode.addComponent(cc.Widget);
                let w = layerNode.getComponent(cc.Widget);
                w.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE;
                w.isAlignLeft = w.isAlignRight = w.isAlignTop = w.isAlignBottom = true;
                w.left = w.right = w.top = w.bottom = 0;
                this.uiRoot.addChild(layerNode);
                w.updateAlignment();
                this._layers.set(layerIndex, layerNode);
            });
    }

    public openUI(
        prefabPath: string,
        type: UIPrefabType = UIPrefabType.PAGE,
        transition: UITransition = UITransition.NONE,
        callback?: (node: cc.Node) => void
    ) {
        const isPage = type === UIPrefabType.PAGE;
        const layer = this._layers.get(isPage ? UILayer.PAGE : UILayer.POPUP);

        cc.log(isPage && this._uiMap.has(prefabPath))
        // Nếu là PAGE và đã có => kích hoạt lại
        if (isPage && this._uiMap.has(prefabPath)) {
            this._activateUI(prefabPath, transition, callback);
            return;
        }

        // Load mới
        cc.resources.load(prefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
            if (err) {
                cc.error(`[UIManager] Load prefab fail: ${prefabPath}`, err);
                this._handlePageLoadError(prefabPath);
                return;
            }

            const wrapper = new cc.Node("UIWrapper");
            wrapper.addComponent(cc.Widget);
            let w = wrapper.getComponent(cc.Widget);
            w.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE;
            w.isAlignLeft = w.isAlignRight = w.isAlignTop = w.isAlignBottom = true;
            w.left = w.right = w.top = w.bottom = 0;

            const blocker = cc.instantiate(this.FadedBgPrf);
            const node = cc.instantiate(prefab);
            wrapper.addChild(blocker);
            wrapper.addChild(node);
            layer.addChild(wrapper);
            // wrapper.getComponent(cc.Widget).updateAlignment();
            // blocker.getComponent(cc.Widget).updateAlignment();

            this._uiMap.set(prefabPath, wrapper);
            if (isPage) {
                this._pushToStack(prefabPath);
                // blocker.on(cc.Node.EventType.TOUCH_END, () => {
                //     this.closeUI(prefabPath, transition);
                // });
            } else {
                blocker.on(cc.Node.EventType.TOUCH_END, () => {
                    this.closeUI(prefabPath, transition);
                });
                cc.log("on click close popup", prefabPath)
            }

            this._playTransition(wrapper, transition);
            callback && callback(node);
        });
    }

    private _activateUI(prefabPath: string, transition: UITransition, callback?: (node: cc.Node) => void) {
        const node = this._uiMap.get(prefabPath);
        cc.log(node)
        node.active = true;
        this._playTransition(node, transition);
        // this._pushToStack(prefabPath);
        callback && callback(node);
    }

    public _pushToStack(prefabPath: string) {
        if (!this._uiStack.includes(prefabPath)) {
            this._uiStack.push(prefabPath);
            cc.log("Stack", this._uiStack);
        }
    }

    public closeUI(prefabPath: string, transition: UITransition = UITransition.NONE) {
        cc.log("closeUI", this._uiMap.has(prefabPath))
        if (!this._uiMap.has(prefabPath)) return;
        const node = this._uiMap.get(prefabPath);

        this._playCloseTransition(node, transition, () => {
            node.active = false;
            if (prefabPath !== DataManager.instance.getPrefabPath(PAGE.HOME)) {
                this._popFromStack(prefabPath);
            }
        });
    }

    public deactivateUI(prefabPath: string, transition: UITransition = UITransition.NONE): Promise<void> {
        return new Promise(resolve => {
            const node = this._uiMap.get(prefabPath);
            if (!node) return resolve();

            this._playCloseTransition(node, transition, () => {
                node.active = false;
                resolve();  // ✅ Đánh dấu xong
            });
        });
    }

    private _popFromStack(prefabPath: string) {
        const idx = this._uiStack.indexOf(prefabPath);
        if (idx !== -1) this._uiStack.splice(idx, 1);
        cc.log("Stack", this._uiStack);
    }

    public closeCurrent(transition: UITransition = UITransition.NONE) {
        if (this._uiStack.length === 0) return;
        const current = this._uiStack[this._uiStack.length - 1];
        this.closeUI(current, transition);
        cc.log("Stack", this._uiStack);
    }

    public back(transition: UITransition = UITransition.NONE) {
        if (this._uiStack.length <= 1) return;

        // đóng trang hiện tại
        const current = this._uiStack.pop();
        const currentNode = this._uiMap.get(current);
        this._playCloseTransition(currentNode, transition, () => currentNode.active = false);

        // kích hoạt trang trước
        const prev = this._uiStack[this._uiStack.length - 1];
        const prevNode = this._uiMap.get(prev);
        prevNode.active = true;
        this._playTransition(prevNode, transition);
        cc.log("Stack", this._uiStack);
    }


    /** Transitions */
    private _playTransition(node: cc.Node, type: UITransition) {
        switch (type) {
            case UITransition.FADE:
                node.opacity = 0;
                cc.tween(node).to(0.3, { opacity: 255 }).start();
                break;
            case UITransition.POPUP_SCALE:
                node.scale = 0.5;
                node.opacity = 0;
                cc.tween(node)
                    .to(0.3, { scale: 1, opacity: 255 }, { easing: "backOut" })
                    .start();
                break;
        }
    }

    private _playCloseTransition(node: cc.Node, type: UITransition, onFinish: () => void) {
        switch (type) {
            case UITransition.FADE:
                cc.tween(node).to(0.25, { opacity: 0 }).call(() => {
                    onFinish();
                    node.opacity = 255;
                }).start();
                break;
            case UITransition.POPUP_SCALE:
                cc.tween(node).to(0.25, { scale: 0.5, opacity: 0 }, { easing: "backIn" })
                    .call(() => {
                        onFinish();
                        node.scale = 1;
                        node.opacity = 255;
                    }).start();
                break;
            default:
                onFinish();
        }
    }


    // Lấy node theo path
    public getUI(prefabPath: string): cc.Node | null {
        return this._uiMap.get(prefabPath) || null;
    }

    // Lấy stack hiện tại
    public getUIStack(): string[] {
        return this._uiStack;
    }

    // Lấy layer page / popup
    public getLayer(type: UILayer): cc.Node {
        return this._layers.get(type);
    }

    // Kiểm tra UI đang active
    public isOpen(prefabPath: string): boolean {
        const node = this._uiMap.get(prefabPath);
        return !!node && node.active;
    }

    private _handlePageLoadError(failedPath: string) {
        const fallback = this.getPreviousPage() || "pages/Home";
        cc.log("fallback", fallback, this._uiStack)
        this.openUI(fallback, UIPrefabType.PAGE);
    }

    private getPreviousPage() {
        if (this._uiStack.length < 2) return null;
        return this._uiStack[this._uiStack.length - 1];
    }
}

export { UILayer, UITransition, UIPrefabType };
