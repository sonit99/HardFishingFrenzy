const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePlayMgr extends cc.Component {
    @property(cc.Node)
    rod: cc.Node = null;

    @property(cc.Node)
    hook: cc.Node = null;

    @property(cc.Node)
    arrow: cc.Node = null;

    @property(cc.Node)
    powerBar: cc.Node = null;

    @property(cc.Node)
    throwBtn: cc.Node = null;

    @property(cc.Node)
    cameraNode: cc.Node = null;

    @property(cc.Node)
    waterArea: cc.Node = null;

    maxPower: number = 300;

    // @property
    gravity: number = -600;

    private isCharging: boolean = false;
    private chargePower: number = 0;
    private currentAngle: number = 45;
    private isFlying: boolean = false;
    private hookVelocity: cc.Vec2 = cc.v2(0, 0);

    private hookInitialPos: cc.Vec2 = cc.v2();
    private cameraOffset: cc.Vec2 = cc.v2();

    onLoad() {
        this.cameraNode = this.cameraNode || cc.find("Canvas/Main Camera");
        this.powerBar.active = false;
        this.arrow.active = true;

        // === Đặt hook ở tip của rod ===
        
        const tipWorld = this.getRodTipWorldPos();
        const tipLocal = this.hook.parent.convertToNodeSpaceAR(tipWorld);
        this.hook.setPosition(tipLocal);
        this.hookInitialPos = tipLocal.clone();
        cc.log(tipLocal);
        this.hook.setPosition(cc.v2(432, 310));

        // Camera offset
        this.cameraOffset = this.cameraNode.getPosition().sub(cc.v2(this.hook.getPosition().x));

        // Input
        this.throwBtn.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.throwBtn.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    start() {
        this.schedule(this.updateAngle, 0.02);
    }

    updateAngle() {
        if (this.isFlying) return;
        const time = (Date.now() % 2000) / 2000;
        const swing = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
        this.currentAngle = swing * 90;
        this.arrow.angle = -this.currentAngle;
    }

    onTouchStart() {
        if (this.isFlying) return;
        this.unschedule(this.updateAngle);
        this.powerBar.active = true;
        this.powerBar.getComponent(cc.ProgressBar).progress = 0;
        this.isCharging = true;
        this.chargePower = 0;
        this.schedule(this.increasePower, 0.02);
    }

    increasePower() {
        if (!this.isCharging) {
            this.unschedule(this.increasePower);
            return;
        }
        this.chargePower += this.maxPower / 10;
        if (this.chargePower > this.maxPower) this.chargePower = this.maxPower;
        this.powerBar.getComponent(cc.ProgressBar).progress = this.chargePower / this.maxPower;
    }

    onTouchEnd() {
        if (!this.isCharging || this.isFlying) return;
        this.isCharging = false;
        this.unschedule(this.increasePower);
        this.launchHook();
    }

    launchHook() {
        this.isFlying = true;
        const rad = cc.misc.degreesToRadians(90 - this.currentAngle);
        cc.log("launch angle (rad):", rad);
        let powerScale = 5;
        const vx = Math.cos(rad) * this.chargePower * powerScale;
        const vy = Math.sin(rad) * this.chargePower * powerScale;
        cc.log("launch velocity:", vx, vy);
        this.hookVelocity = cc.v2(vx, vy);
        cc.log("hook velocity", this.hookVelocity);
    }




    update(dt: number) {
        if (!this.isFlying) {
            // cc.log("🪝 Hook not flying");
            // Khi chưa ném: hook luôn bám tip rod
            // const tipWorld = this.getRodTipWorldPos();
            // const tipLocal = this.hook.parent.convertToNodeSpaceAR(tipWorld);
            // this.hook.setPosition(tipLocal);
            // cc.log(this.hook.getPosition(), this.hookInitialPos);
            return;
        } else {

            // Hook đang bay
            this.hookVelocity.y += this.gravity * (1 + Math.abs(this.hookVelocity.y) / 500) * dt;
            this.hook.setPosition(this.hook.getPosition().add(this.hookVelocity.mul(dt)));

            // Camera follow
            const targetCamPos = this.hook.getPosition().add(cc.v2(this.cameraOffset.x));
            this.cameraNode.setPosition(this.cameraNode.getPosition().lerp(targetCamPos, 0.1));

            // Va chạm nước
            if (this.hook.y <= this.waterArea.y + this.waterArea.height / 2) {
                this.hook.y = this.waterArea.y + this.waterArea.height / 2;
                this.hookHitWater();
            }

        }
    }

    hookHitWater() {
        // this.isFlying = false;
        this.hookVelocity = cc.v2(0, 0);
        // const waterPos = this.waterArea.getPosition();
        // this.cameraNode.runAction(
        //     cc.moveTo(1, cc.v2(waterPos.x, waterPos.y)).easing(cc.easeCubicActionOut())
        // );
        cc.log("🎣 Hook hit water, waiting for fish...");
    }

    private getRodTipWorldPos(): cc.Vec2 {
        if (!this.rod) return cc.v2(0, 0);
        const rodAnchor = this.rod.getAnchorPoint();
        // Tip ở đầu phải (giả sử anchor (0,0.5) => tip nằm ở width)
        const tipLocal = cc.v2(
            this.rod.width * (1 - rodAnchor.x),
            this.rod.height * (1 - rodAnchor.y)
        );
        cc.log("rodtip:", this.rod.convertToWorldSpaceAR(tipLocal));
        return this.rod.convertToWorldSpaceAR(tipLocal);
    }
}
