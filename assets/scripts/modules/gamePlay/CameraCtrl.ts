const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraController extends cc.Component {
    @property(cc.Node)
    target: cc.Node = null;

    @property
    smoothFactor: number = 0.1;

    private offset: cc.Vec3 = cc.v3();

    start() {
        if (this.target) {
            this.offset = this.node.position.sub(this.target.position);
        }
    }

    lateUpdate() {
        if (!this.target) return;
        const desired = this.target.position.add(this.offset);
        this.node.setPosition(this.node.position.lerp(desired, this.smoothFactor));
    }

    moveToWater(waterPos: cc.Vec2) {
        this.node.stopAllActions();
        this.node.runAction(
            cc.moveTo(1, waterPos).easing(cc.easeCubicActionOut())
        );
    }
}
