import { EventMgr } from "./EventMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class InputManager extends cc.Component {
    static instance: InputManager = null;

    private activeTouches: Map<number, { startPos: cc.Vec2; startTime: number }> = new Map();
    private longPressThreshold = 0.5; // giây
    private swipeThreshold = 50; // pixel

    onLoad() {
        if (!InputManager.instance) InputManager.instance = this;

        // Touch
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        // Keyboard
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onTouchStart(event: cc.Event.EventTouch) {
        const id = event.getID();
        const pos = event.getLocation();
        const startTime = Date.now() / 1000;
        this.activeTouches.set(id, { startPos: pos, startTime });

        // Long press check
        this.scheduleOnce(() => {
            if (this.activeTouches.has(id)) {
                EventMgr.instance.emit("longPress", { id, pos });
            }
        }, this.longPressThreshold);

        EventMgr.instance.emit("touchStart", { id, pos });
    }

    onTouchMove(event: cc.Event.EventTouch) {
        const id = event.getID();
        const pos = event.getLocation();
        const data = this.activeTouches.get(id);
        if (!data) return;

        // Swipe detection
        const delta = pos.sub(data.startPos);
        if (Math.abs(delta.x) > this.swipeThreshold || Math.abs(delta.y) > this.swipeThreshold) {
            let direction: "up" | "down" | "left" | "right";
            if (Math.abs(delta.x) > Math.abs(delta.y)) {
                direction = delta.x > 0 ? "right" : "left";
            } else {
                direction = delta.y > 0 ? "up" : "down";
            }
            EventMgr.instance.emit("swipe", { direction, delta });
            this.activeTouches.delete(id); // chỉ 1 lần swipe
        }

        EventMgr.instance.emit("touchMove", { id, pos });
    }

    onTouchEnd(event: cc.Event.EventTouch) {
        const id = event.getID();
        const pos = event.getLocation();
        const data = this.activeTouches.get(id);
        if (!data) return;

        const duration = Date.now() / 1000 - data.startTime;
        if (duration < this.longPressThreshold) {
            EventMgr.instance.emit("tap", { id, pos });
        }

        this.activeTouches.delete(id);
        EventMgr.instance.emit("touchEnd", { id, pos });
    }

    onTouchCancel(event: cc.Event.EventTouch) {
        const id = event.getID();
        const pos = event.getLocation();
        this.activeTouches.delete(id);
        EventMgr.instance.emit("touchCancel", { id, pos });
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        EventMgr.instance.emit("keyDown", event.keyCode);
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        EventMgr.instance.emit("keyUp", event.keyCode);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }
}
