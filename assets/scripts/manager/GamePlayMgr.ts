import AimController from "../modules/gamePlay/AimCtrl";
import CameraController from "../modules/gamePlay/CameraCtrl";
import FishController from "../modules/gamePlay/FishCtrl";
import HookController from "../modules/gamePlay/HookCtrl";
import MiniGameController from "../modules/gamePlay/MinigameController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePlayManager extends cc.Component {
    // === CONFIGURATIONS ===
    @property(cc.Node)
    playerNode: cc.Node = null;

    @property(cc.Node)
    hookNode: cc.Node = null;

    @property(cc.Node)
    cameraNode: cc.Node = null;

    @property(cc.Node)
    waterArea: cc.Node = null;

    @property(cc.Node)
    shootButton: cc.Node = null;

    @property(cc.Node)
    powerBarNode: cc.Node = null;

    @property
    hookSpeed: number = 1000;

    @property
    gravity: number = -98;

    @property
    minAngle: number = 0;

    @property
    maxAngle: number = 90;

    @property
    maxPower: number = 1000;

    // === SYSTEM REFERENCES (optional external controllers) ===
    @property(AimController)
    aimController: AimController = null;

    @property(HookController)
    hookController: HookController = null;

    @property(CameraController)
    cameraController: CameraController = null;

    @property(FishController)
    fishController: FishController = null;

    @property(MiniGameController)
    miniGameController: MiniGameController = null;

    // === INTERNAL STATE ===
    private isCharging: boolean = false;
    private chargePower: number = 0;
    private currentAngle: number = 45;
    private isFlying: boolean = false;
    private hookVelocity: cc.Vec3 = cc.v3(0, 0);

    private hookInitialPos: cc.Vec3 = cc.v3();
    private cameraOffset: cc.Vec3 = cc.v3();

    onLoad() {
        this.powerBarNode.active = false;
        this.cameraNode = this.cameraNode || cc.Camera.main.node;
        this.hookInitialPos = this.hookNode.position.clone();
        this.cameraOffset = this.cameraNode.position.sub(cc.v3(this.hookNode.position.x));

        // Input
        this.shootButton.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.shootButton.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    start() {
        this.schedule(this.updateAngle, 0.02);
    }

    updateAngle() {
        if (this.isFlying) return;

        // Oscillation 0° ↔ 90°
        const time = (Date.now() % 2000) / 2000;
        const swing = Math.sin(time * Math.PI * 2) * 0.5 - 0.5;
        this.currentAngle = this.minAngle + swing * (this.maxAngle - this.minAngle);

        // Optional aim controller sync
        if (this.aimController && this.aimController.updateAim)
            this.aimController.updateAim(this.currentAngle);

        // Player rotate for effect
        // this.playerNode.angle = this.currentAngle * -1;
    }

    onTouchStart() {
        if (this.isFlying) return;
        this.unschedule(this.updateAngle);
        this.powerBarNode.active = true;
        this.powerBarNode.getComponent(cc.ProgressBar).progress = 0;
        this.isCharging = true;
        this.chargePower = 0;
        this.schedule(this.increasePower, 0.02);
    }

    increasePower() {
        if (!this.isCharging) {
            this.unschedule(this.increasePower);
            return;
        }
        this.chargePower += this.maxPower / 50;
        if (this.chargePower > this.maxPower) this.chargePower = this.maxPower;
        this.powerBarNode.getComponent(cc.ProgressBar).progress = this.chargePower / this.maxPower;
    }

    onTouchEnd() {
        if (!this.isCharging || this.isFlying) return;
        this.scheduleOnce(() => { this.powerBarNode.active = false }, 1);
        this.isCharging = false;
        this.unschedule(this.increasePower);
        this.launchHook();
    }

    launchHook() {
        this.isFlying = true;

        const rad = cc.misc.degreesToRadians(this.currentAngle);
        const vx = Math.cos(rad) * this.chargePower;
        const vy = -Math.sin(rad) * this.chargePower;

        this.hookVelocity = cc.v3(vx, vy);
        cc.log(this.hookVelocity);

        if (this.hookController && this.hookController["onLaunch"])
            this.hookController["onLaunch"](this.hookVelocity);
    }

    update(dt: number) {
        if (!this.isFlying) return;

        // Apply gravity
        this.hookVelocity.y += this.gravity * dt;

        // Update hook position
        const pos = this.hookNode.position.add(this.hookVelocity.mul(dt));
        this.hookNode.setPosition(pos);

        // Smooth camera follow
        const targetCamPos = this.hookNode.position.add(this.cameraOffset);
        this.cameraNode.setPosition(
            this.cameraNode.position.lerp(cc.v3(targetCamPos.x), 0.1)
        );

        // Check water collision
        if (this.hookNode.y <= this.waterArea.y + this.waterArea.height / 2) {
            this.hookNode.y = this.waterArea.y + this.waterArea.height / 2;
            this.hookHitWater();
        }
    }

    hookHitWater() {
        this.isFlying = false;
        this.hookVelocity = cc.v3(0, 0);

        const waterPos = this.waterArea.position;

        // Camera ease to water level
        this.cameraNode.runAction(
            cc.moveTo(1, cc.v2(waterPos.x, 0)).easing(cc.easeCubicActionOut())
        );

        cc.log("🎣 Hook hit water — waiting for fish...");

        // Call fish system (spawning / detection)
        if (this.fishController && this.fishController["onHookInWater"]) {
            this.fishController["onHookInWater"](this.hookNode);
        }
    }
}
