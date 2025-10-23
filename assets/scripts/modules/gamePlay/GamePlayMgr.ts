import { DataManager } from "../../manager/DataMgr";
import SoundUtil from "../../utils/SoundUtil";
import FishCtrl, { FishInfo } from "./FishCtrl";
import PopUp from "./PopUp";

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
  waterArea: cc.Node = null;

  @property(cc.Node)
  minigameUI: cc.Node = null;

  @property(cc.Node)
  popup: cc.Node = null;

  @property(sp.Skeleton)
  characterSpine: sp.Skeleton = null;

  private cameraNode: cc.Node = null;
  private maxPower: number = 300;
  private gravity: number = -600;
  private isCharging: boolean = false;
  private chargePower: number = 0;
  private currentAngle: number = 45;
  private isFlying: boolean = false;
  private hookVelocity: cc.Vec2 = cc.v2(0, 0);

  private hookInitialPos: cc.Vec2 = cc.v2();
  private cameraOffset: cc.Vec2 = cc.v2();

  private hookedFish: cc.Node = null;
  private hookedFishInfo: FishInfo = null;

  async onLoad() {
    await DataManager.instance.loadAll();
    this.cameraNode = this.cameraNode || cc.find("Canvas/Main Camera");
    cc.log(this.cameraNode);
    this.powerBar.active = false;
    this.arrow.active = true;

    // === Đặt hook ở tip của rod ===
    // const tipWorld = this.getRodTipWorldPos();
    // const tipLocal = this.hook.parent.convertToNodeSpaceAR(tipWorld);
    // this.hook.setPosition(tipLocal);
    // this.hookInitialPos = tipLocal.clone();
    // cc.log(tipLocal);

    this.hookInitialPos = cc.v2(382, 322);
    this.hook.setPosition(cc.v2(382, 322));

    // Camera offset
    const camWorld = this.cameraNode.convertToWorldSpaceAR(cc.v2(0, 0));
    const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
    this.cameraOffset = cc.v2(camWorld.x - hookWorld.x - 100, 0);
  }

  start() {
    SoundUtil.instance.playMusic(1);
    this.characterSpine.setAnimation(0, "stand", true);
    this.schedule(this.updateAngle, 0.02);
  }

  updateAngle() {
    // Input
    this.throwBtn.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.throwBtn.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.throwBtn.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    
    if (this.isFlying) return;
    const time = (Date.now() % 2000) / 2000;
    const swing = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
    this.currentAngle = swing * 90;
    this.arrow.angle = -this.currentAngle;
  }

  onTouchStart() {
    if (this.isFlying) return;
    SoundUtil.instance.playEffect(0);
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
    this.powerBar.getComponent(cc.ProgressBar).progress =
      this.chargePower / this.maxPower;
  }

  onTouchEnd() {
    if (!this.isCharging || this.isFlying) return;
    this.isCharging = false;
    this.unschedule(this.increasePower);
    this.launchHook();
        // Stop Input
    this.throwBtn.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.throwBtn.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.throwBtn.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    
  }

  launchHook() {
    this.isFlying = true;
    const rad = cc.misc.degreesToRadians(90 - this.currentAngle);
    cc.log("launch angle (rad):", rad);
    let powerScale = 4.5;
    const vx = Math.cos(rad) * this.chargePower * powerScale;
    const vy = Math.sin(rad) * this.chargePower * powerScale;
    cc.log("launch velocity:", vx, vy);
    this.hookVelocity = cc.v2(vx, vy);
    cc.log("hook velocity", this.hookVelocity);
    const angleRad = Math.atan2(this.hookVelocity.y, this.hookVelocity.x);
    const hookAngle = cc.misc.radiansToDegrees(angleRad) + 90; // offset 90° để 0° = hướng xuống
    this.hook.angle = hookAngle;

    this.scheduleOnce(() => {
      this.powerBar.active = false;
      this.arrow.active = false;
    }, 1.0);
  }

  update(dt: number) {
    if (!this.isFlying) {
      return;
    } else {
      // Hook đang bay
      this.hookVelocity.y +=
        this.gravity * (1 + Math.abs(this.hookVelocity.y) / 500) * dt;
      this.hook.setPosition(
        this.hook.getPosition().add(this.hookVelocity.mul(dt))
      );

      // ✅ Hook xoay theo vận tốc hiện tại
      const dir = this.hookVelocity.normalize();
      const rad = Math.atan2(dir.y, dir.x);
      const angle = cc.misc.radiansToDegrees(rad) + 90; // 0° = xuống
      this.hook.angle = cc.misc.lerp(this.hook.angle, angle, 0.2); // quay mượt

      // Camera follow ngang theo hook, không follow Y
      const currentCamPos = this.cameraNode.getPosition();
      const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
      const targetCamX = cc.misc.lerp(
        currentCamPos.x,
        hookWorld.x + this.cameraOffset.x,
        0.1
      );
      this.cameraNode.setPosition(targetCamX, currentCamPos.y);
      cc.log("camera x:", targetCamX, this.cameraNode.x);

      // Va chạm nước
      if (this.hook.y <= this.waterArea.y + this.waterArea.height / 2) {
        this.hook.y = this.waterArea.y + this.waterArea.height / 2;
        this.hookHitWater();
      }
    }
  }

  hookHitWater() {
    SoundUtil.instance.playEffect(1, 1.0);
    this.isFlying = false;
    this.hookVelocity = cc.v2(0, 0);

    cc.log("🎣 Hook hit water, waiting for fish...");

    // 1️⃣ Hook chìm xuống
    const sinkDepth = 200; // chiều sâu tính từ mặt nước
    const sinkTime = 1.5; // thời gian chìm
    const targetY = this.hook.y - sinkDepth;

    const sinkAction = cc.sequence(
      cc
        .moveTo(sinkTime, cc.v2(this.hook.x, targetY))
        .easing(cc.easeCubicActionOut()),
      cc.callFunc(() => {
        cc.log("💧 Hook reached depth, waiting for fish...");
        // 2️⃣ Khi hook dừng, gọi FishController
        const fishCtrl = this.waterArea.getComponent(FishCtrl);
        if (this.waterArea && fishCtrl) {
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
      (0.5 - anchor.x) * w, // lệch ngang (anchor.x = 0.5 → 0)
      -h * anchor.y // đi xuống theo anchor y
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

  /** 🔥 Bắt đầu minigame dựa theo độ hiếm cá */
  startMiniGame(fishInfo: FishInfo) {
    this.hookedFishInfo = fishInfo;
    this.hookedFish = fishInfo.node;

    let difficulty = 1;
    switch (fishInfo.rarity) {
      case "common":
        difficulty = 1;
        break;
      case "uncommon":
        difficulty = 1.2;
        break;
      case "rare":
        difficulty = 1.4;
        break;
      case "epic":
        difficulty = 1.7;
        break;
      case "legend":
        difficulty = 2.0;
        break;
    }
    // 🧩 Clone minigame UI và gắn vào cá
    const miniClone = cc.instantiate(this.minigameUI);
    miniClone.active = true;
    miniClone.parent = fishInfo.node; // gắn trực tiếp vào cá
    miniClone.setPosition(0, -100); // nằm dưới bụng cá

    const miniCtrl = miniClone.getComponent("MinigameController");
    miniCtrl.startMiniGame(difficulty); // không cần worldPos nữa

    // 🎧 Lắng nghe sự kiện riêng cho clone này
    miniClone.on("MiniGameProgress", this.onMiniGameProgress, this);
    miniClone.on("MiniGameMiss", this.onMiniGameMiss, this);
    miniClone.on("MiniGameWin", () => {
      this.onMiniGameWin();
      miniClone.destroy();
    }, this);
    miniClone.on("MiniGameFail", () => {
      this.onMiniGameFail();
      miniClone.destroy();
    }, this);
    
    // Hiển thị ProgressBar
    this.powerBar.active = true;
    this.powerBar.getComponent(cc.ProgressBar).progress = 0;
  }

  private updateCameraFollow(targetHookPos: cc.Vec2) {
    if (!this.cameraNode) return;

    // 🎯 Chỉ follow ngang theo hook
    const currentCamPos = this.cameraNode.getPosition();

    // Vị trí camera mục tiêu chỉ thay đổi X, giữ nguyên Y và Z hiện tại
    const targetCamX = cc.misc.lerp(currentCamPos.x, targetHookPos.x, 1);

    this.cameraNode.setPosition(targetCamX, currentCamPos.y);
  }

  private onMiniGameMiss(failRatio: number) {
    cc.log(`🎯 MiniGame miss: ${failRatio}`);
    SoundUtil.instance.playEffect(5);
    if (failRatio === 0.8) {
      SoundUtil.instance.playEffect(7);
    }
    this.powerBar.getComponent(cc.ProgressBar).progress = failRatio;
  }

  private onMiniGameProgress(ratio: number) {
    cc.log(`🎯 MiniGame progress: ${ratio}`);
    SoundUtil.instance.playEffect(3);
    this.characterSpine.setAnimation(0, "fishing", false);
    this.characterSpine.setEndListener(() => {
      this.characterSpine.setAnimation(0, "stand", true);
    });

    // 🎣 Mục tiêu: hook di chuyển dần về vị trí cần câu (đầu rod)
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);

    // Vị trí hiện tại của hook
    const currentPos = this.hook.getPosition();

    // 🧩 Làm mượt và tăng tốc theo tiến trình
    const easedRatio = Math.pow(ratio, 2.2); // tốc độ kéo tăng dần
    const pullStrength = 0.1 + easedRatio * 0.9;

    // 🎣 Di chuyển hook về cần
    let targetPos = currentPos.lerp(rodTipLocal, pullStrength);
    this.hook.stopAllActions();
    this.hook.runAction(
      cc.moveTo(0.3, targetPos).easing(cc.easeCubicActionOut())
    );

    this.updateCameraFollow(targetPos);
  }

  private onMiniGameWin() {
    cc.log("🏆 Fish successfully caught!");
    SoundUtil.instance.playEffect(8);
    SoundUtil.instance.playEffect(9);

    if (this.hookedFish) {
      this.hookedFish.destroy();
      this.hookedFish = null;
      this.popup.active = true;
      this.popup.getComponent(PopUp).setFishInfo(
        this.hookedFishInfo.stats.call,
        this.hookedFishInfo.stats.length,
        this.hookedFishInfo.stats.value,
        this.hookedFishInfo.stats.rarity,
        this.hookedFishInfo.stats.id
      );
    }

    this.resetCycle();
  }

  private onMiniGameFail() {
    cc.log("💥 Line snapped, fish escaped!");


    // Hook rơi xuống hoặc reset vị trí
    this.hook.runAction(
      cc.sequence(
        cc.moveBy(0.5, cc.v2(0, -100)).easing(cc.easeIn(2.0)),
        cc.callFunc(() => {
          // Kéo hook hoàn toàn về rod
          const rodTipWorld = this.getRodTipWorldPos();
          const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
          const moveBack = cc.moveTo(0.6, rodTipLocal).easing(cc.easeBackIn());
          this.hook.runAction(moveBack);

          this.scheduleOnce(() => {
            this.resetCycle();
          }, 0.6);
        })
      )
    );

    if (this.hookedFish) {
      this.hookedFish.parent = this.waterArea;
      this.hookedFish = null;
    }
  }

  private resetHook() {
    cc.log("🔄 Reset hook position");
    this.hook.stopAllActions();
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
    this.hook.setPosition(rodTipLocal);
    // this.hook.setPosition(cc.v2(432, 310));
    this.hook.angle = 0;
  }

  private resetCycle() {
    this.resetHook();
    this.isFlying = false;
    this.hookVelocity = cc.v2(0, 0);
    this.hookedFish = null;
    this.cameraNode.setPosition(0, 0);

    this.powerBar.active = false;
    this.arrow.active = true;
    this.schedule(this.updateAngle, 0.02);
  }
}
