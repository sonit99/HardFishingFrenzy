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
        const angleRad = Math.atan2(this.hookVelocity.y, this.hookVelocity.x);
        const hookAngle = cc.misc.radiansToDegrees(angleRad) + 90; // offset 90° để 0° = hướng xuống
        this.hook.angle = hookAngle;
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
            // ✅ Hook xoay theo vận tốc hiện tại
            const dir = this.hookVelocity.normalize();
            const rad = Math.atan2(dir.y, dir.x);
            const angle = cc.misc.radiansToDegrees(rad) + 90; // 0° = xuống
            this.hook.angle = cc.misc.lerp(this.hook.angle, angle, 0.2); // quay mượt

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
        this.isFlying = false;
        this.hookVelocity = cc.v2(0, 0);

        cc.log("🎣 Hook hit water, waiting for fish...");

        // 1️⃣ Hook chìm xuống
        const sinkDepth = 200; // chiều sâu tính từ mặt nước
        const sinkTime = 1.5; // thời gian chìm
        const targetY = this.hook.y - sinkDepth;

        const sinkAction = cc.sequence(
            cc.moveTo(sinkTime, cc.v2(this.hook.x, targetY)).easing(cc.easeCubicActionOut()),
            cc.callFunc(() => {
                cc.log("💧 Hook reached depth, waiting for fish...");
                // 2️⃣ Khi hook dừng, gọi FishController
                if (this.waterArea && this.waterArea.getComponent("FishCtrl")) {
                    const fishCtrl = this.waterArea.getComponent("FishCtrl") as any;
                    fishCtrl.onHookInWater(this.hook);
                } else {
                    cc.warn("⚠️ fishCtrl chưa được gán trong GamePlayMgr");
                }
            })
        );
        this.hook.runAction(sinkAction);
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

    /** 🎯 Tính world position của đầu móc câu (phần dưới cùng) */
    getHookTipWorldPos(): cc.Vec2 {
        if (!this.hook) return cc.v2(0, 0);

        // 1️⃣ Lấy anchor & kích thước
        const anchor = this.hook.getAnchorPoint();
        const w = this.hook.width;
        const h = this.hook.height;

        // 2️⃣ Vị trí local của tip (phần dưới cùng)
        // anchor.y = 1 => phần dưới nằm cách anchor h đơn vị
        const tipLocal = cc.v2(
            (0.5 - anchor.x) * w,  // lệch ngang (anchor.x = 0.5 → 0)
            -h * anchor.y           // đi xuống theo anchor y
        );

        // 3️⃣ Xoay điểm này theo góc hook.angle
        const rad = cc.misc.degreesToRadians(this.hook.angle);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotatedTip = cc.v2(
            tipLocal.x * cos - tipLocal.y * sin,
            tipLocal.x * sin + tipLocal.y * cos
        );

        // 4️⃣ Chuyển về world space
        const tipWorld = this.hook.convertToWorldSpaceAR(rotatedTip);
        return tipWorld;
    }
}
