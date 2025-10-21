const { ccclass, property } = cc._decorator;

@ccclass
export default class HookController extends cc.Component {
    private velocity: cc.Vec3 = cc.v3();
    private isFlying: boolean = false;

    onLaunch(initialVelocity: cc.Vec3) {
        this.velocity = initialVelocity.clone();
        this.isFlying = true;
    }

    stop() {
        this.isFlying = false;
        this.velocity = cc.v3();
    }

    update(dt: number) {
        if (!this.isFlying) return;
        // optional hook animation could go here
    }
}
