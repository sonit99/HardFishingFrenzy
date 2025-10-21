// GameEventBus.ts
const { ccclass } = cc._decorator;

/**
 * Các event typed của game
 */
export interface GameEvents {
    skillPressed: number;
    swipe: { direction: "up" | "down" | "left" | "right"; delta: cc.Vec2 };
    tap: { id: number; pos: cc.Vec2 };
    longPress: { id: number; pos: cc.Vec2 };
    touchStart: { id: number; pos: cc.Vec2 };
    touchMove: { id: number; pos: cc.Vec2 };
    touchEnd: { id: number; pos: cc.Vec2 };
    touchCancel: { id: number; pos: cc.Vec2 };
    keyDown: number;
    keyUp: number;
    languageChanged: string;
    UI_OpenPage: { prefabPath: string; node: cc.Node };
    UI_ClosePage: { prefabPath: string };
    UI_OpenPopup: { prefabPath: string; node: cc.Node };
    UI_ClosePopup: { prefabPath: string };
    UI_BringToFront: { prefabPath: string; node: cc.Node };
    UI_BackPage?: undefined;
}

/**
 * EventBus typed
 */
@ccclass
export class EventMgr {
    private static _instance: EventMgr;

    public static get instance(): EventMgr {
        if (!this._instance) {
            this._instance = new EventMgr();
        }
        return this._instance;
    }

    private eventTarget: cc.EventTarget;

    constructor() {
        this.eventTarget = new cc.EventTarget();
    }

    public on<K extends keyof GameEvents>(eventName: K, callback: (arg: GameEvents[K]) => void, target?: any) {
        this.eventTarget.on(eventName, callback, target);
    }

    public once<K extends keyof GameEvents>(eventName: K, callback: (arg: GameEvents[K]) => void, target?: any) {
        this.eventTarget.once(eventName, callback, target);
    }

    public off<K extends keyof GameEvents>(eventName: K, callback?: (arg: GameEvents[K]) => void, target?: any) {
        this.eventTarget.off(eventName, callback, target);
    }

    public emit<K extends keyof GameEvents>(eventName: K, data: GameEvents[K]) {
        this.eventTarget.emit(eventName, data);
    }
}
