import { DataManager } from "../../manager/DataMgr";
import GameCoreManager from "../../manager/GameCoreMgr";
import SoundUtil, { BGM, SFX } from "../../utils/SoundUtil";
import UICtrl from "../UICtrl";
import Fish from "./Fish";
import FishCtrl, { FishInfo } from "./FishCtrl";
import MinigameController from "./MinigameController";
import PopUp from "./PopUp";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GamePlayMgr extends cc.Component {
  @property(cc.Node)
  rod: cc.Node = null;

  @property(cc.Node)
  ropeNode: cc.Node = null;

  @property(cc.Node)
  hook: cc.Node = null;

  @property(cc.Node)
  arrow: cc.Node = null;

  @property(cc.Node)
  angleNode: cc.Node = null;

  @property(cc.Node)
  waterArea: cc.Node = null;

  @property(cc.Node)
  minigameUI: cc.Node = null;

  @property(cc.Node)
  popup: cc.Node = null;

  @property(sp.Skeleton)
  characterSpine: sp.Skeleton = null;

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

  private isInWater: boolean = false;
  private waterSinkSpeed: number = 50; // px/s
  private waterTargetDepth: number = 250;
  private circularRadius: number = 0; // khoảng cách từ tip cần câu
  private circularAngle: number = 0; // góc hiện tại

  async onLoad() {
    await DataManager.instance.loadAll();

    UICtrl.instance.activeatePowerBar(false);
    this.angleNode.active = true;

    // === Đặt hook ở tip của rod ===
    // const tipWorld = this.getRodTipWorldPos();
    // const tipLocal = this.hook.parent.convertToNodeSpaceAR(tipWorld);
    // this.hook.setPosition(tipLocal);
    // this.hookInitialPos = tipLocal.clone();
    // cc.log(tipLocal);

    this.hookInitialPos = cc.v2(382, 322);
    this.hook.setPosition(cc.v2(382, 322));
  }

  start() {
    this.node.getChildByName("Player").active = true;
    SoundUtil.instance.playBGM(BGM.AtlantisOcean);
    SoundUtil.instance.playSFX(SFX.BigWave, true, 0.3);
    this.characterSpine.setAnimation(0, "stand", true);
    this.schedule(this.updateAngle, 0.02);

    // Camera offset
    const camWorld = GameCoreManager.instance.getCameraWorldPos();
    const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
    this.cameraOffset = cc.v2(camWorld.x - hookWorld.x - 500, 0);
  }

  updateAngle() {
    // Input
    this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

    if (this.isFlying) return;
    const time = (Date.now() % 2000) / 2000;
    const swing = Math.sin(time * Math.PI * 2) * 0.5 + 0.5;
    this.currentAngle = swing * 90;
    this.arrow.angle = -this.currentAngle;
  }

  onTouchStart() {
    if (this.isFlying) return;
    this.unschedule(this.updateAngle);
    UICtrl.instance.activeatePowerBar(true);
    UICtrl.instance.updatePowerBarProgress();
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
    UICtrl.instance.updatePowerBarProgress(this.chargePower / this.maxPower);
  }

  onTouchEnd() {
    if (!this.isCharging || this.isFlying) return;
    this.isCharging = false;
    this.unschedule(this.increasePower);
    this.launchHook();
    // Stop Input
    this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  launchHook() {
    SoundUtil.instance.playSFX(SFX.LaunchHook);

    this.characterSpine.setAnimation(0, "thrown", false);
    this.scheduleOnce(() => {
      this.characterSpine.setAnimation(0, "stand", true);
      this.isFlying = true;
      if (this.ropeNode) {
        this.ropeNode.getComponent("RopeRenderer").setFlyingState(true);
      }

      const rad = cc.misc.degreesToRadians(90 - this.currentAngle);
      let powerScale = 4.5;
      const vx = Math.cos(rad) * this.chargePower * powerScale;
      const vy = Math.sin(rad) * this.chargePower * powerScale;
      this.hookVelocity = cc.v2(vx, vy);
      const angleRad = Math.atan2(this.hookVelocity.y, this.hookVelocity.x);
      const hookAngle = cc.misc.radiansToDegrees(angleRad) + 90; // offset 90° để 0° = hướng xuống
      this.hook.angle = hookAngle;

      this.scheduleOnce(() => {
        UICtrl.instance.activeatePowerBar(false);
        this.angleNode.active = false;
      }, 0.5);
    }, 0.5);
  }

  update(dt: number) {
    if (!this.isFlying) {
      // if (this.isInWater) {
      //   const rodTipWorld = this.getRodTipWorldPos();
      //   const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
      //   // 🔽 Giảm dần độ sâu
      //   const targetRadius = Math.max(
      //     this.circularRadius * dt,
      //     this.waterTargetDepth
      //   );
      //   this.circularRadius = cc.misc.lerp(
      //     this.circularRadius,
      //     targetRadius,
      //     0.05
      //   );
      //   // 🔁 Di chuyển theo cung tròn quanh tip
      //   this.circularAngle += 0.1 * dt; // tốc độ quay nhẹ quanh tip
      //   const newX =
      //     rodTipLocal.x + Math.cos(this.circularAngle) * this.circularRadius;
      //   const newY =
      //     rodTipLocal.y - Math.sin(this.circularAngle) * this.circularRadius;
      //   const current = this.hook.getPosition();
      //   const target = cc.v2(newX, newY);
      //   this.hook.setPosition(current.lerp(target, 0.05));
      //   // 🧭 Cập nhật góc xoay hook
      //   // const dir = target.sub(current).normalize();
      //   // const angle = cc.misc.radiansToDegrees(Math.atan2(dir.y, dir.x)) - 90;
      //   // this.hook.angle = cc.misc.lerp(this.hook.angle, angle, 0.05);
      //   const currentAngle = this.hook.angle;
      //   const targetAngle = 90; // hướng thẳng xuống
      //   cc.tween(this.hook)
      //     .to(0.5, { angle: targetAngle }, { easing: "quadOut" })
      //     .start();
      //   // 🎣 Khi rơi đủ sâu → gọi FishCtrl
      //   if (
      //     this.hook.x <= rodTipLocal.x ||
      //     this.hook.y <= rodTipLocal.y - this.waterTargetDepth
      //   ) {
      //     this.isInWater = false;
      //     cc.log("🐟 Hook reached stable underwater position");
      //     const fishCtrl = this.waterArea.getComponent(FishCtrl);
      //     if (fishCtrl) fishCtrl.onHookInWater(this.hook);
      //   }
      //   // return; // tránh chạy phần flying phía dưới
      // }
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
      const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
      GameCoreManager.instance.updateCameraFollow(
        hookWorld.add(this.cameraOffset)
      );

      // Va chạm nước
      const waterSurfaceY = this.waterArea.y + this.waterArea.height / 2;
      if (this.hook.y <= waterSurfaceY) {
        // Giữ nguyên vị trí hiện tại (không gán lại Y)
        this.hook.stopAllActions();
        this.hookHitWater();
        return;
      }
    }
  }

  hookHitWater() {
    SoundUtil.instance.playSFX(SFX.HookTouchWater, false, 1.0);
    this.isFlying = false;
    if (this.ropeNode) {
      this.ropeNode.getComponent("RopeRenderer").setFlyingState(false);
    }

    this.hookVelocity = cc.v2(0, 0);

    // ✅ Tính tâm là tip cần câu (local space)
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);

    // 1️⃣ Hook chìm xuống
    const sinkDepth = 1000; // chiều sâu tính từ mặt nước
    const sinkTime = 5; // thời gian chìm
    const targetY = this.hook.y - sinkDepth;
    cc.log(this.hook.x - rodTipLocal.x, sinkDepth);
    const targetX =
      this.hook.x - Math.min(this.hook.x - rodTipLocal.x, sinkDepth); // chìm kèm trôi nhẹ về bên trái

    const fishCtrl = this.waterArea.getComponent(FishCtrl);

    const sinkAction = cc.sequence(
      cc.moveTo(sinkTime, cc.v2(targetX * 1.5, Math.min(targetX, targetY))),
      // .easing(cc.easeCubicActionOut()),
      cc.callFunc(() => {
        cc.log("💧 Hook reached depth, waiting for fish...");
        // 2️⃣ Khi hook dừng, gọi FishController
        if (this.waterArea && fishCtrl) {
          // this.isInWater = true;
          // // ✅ Tính vị trí bắt đầu (hook hiện tại)
          // const hookPos = this.hook.getPosition();

          // this.circularRadius = hookPos.sub(rodTipLocal).mag();
          // this.circularAngle = Math.atan2(
          //   hookPos.y - rodTipLocal.y,
          //   hookPos.x - rodTipLocal.x
          // );

          cc.log("💧 Hook entered water, starting slow sink and curve move...");
        } else {
          cc.warn("⚠️ fishCtrl chưa được gán trong GamePlayMgr");
        }
      })
    );
    this.hook.runAction(sinkAction);

    this.scheduleOnce(() => {
      fishCtrl.onHookInWater(this.hook);
    }, sinkTime / 2);

    this.schedule(
      () => {
        const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
        GameCoreManager.instance.updateCameraFollow(
          hookWorld.add(this.cameraOffset)
        );
      },
      0.01,
      sinkTime / 0.01,
      0
    );
  }

  private getRodTipWorldPos(): cc.Vec2 {
    if (!this.rod) return cc.v2(0, 0);
    const rodAnchor = this.rod.getAnchorPoint();
    // Tip ở đầu phải (giả sử anchor (0,0.5) => tip nằm ở width)
    const tipLocal = cc.v2(
      this.rod.width * (1 - rodAnchor.x),
      this.rod.height * (1 - rodAnchor.y)
    );
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
    switch (fishInfo.stats.rarity) {
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

    const miniCtrl = miniClone.getComponent(MinigameController);
    miniCtrl.startMiniGame(difficulty); // không cần worldPos nữa

    // 🎧 Lắng nghe sự kiện riêng cho clone này
    miniClone.on("MiniGameProgress", this.onMiniGameProgress, this);
    miniClone.on("MiniGameMiss", this.onMiniGameMiss, this);
    miniClone.on(
      "MiniGameWin",
      () => {
        // this.onMiniGameWin();
        miniClone.destroy();
      },
      this
    );
    miniClone.on(
      "MiniGameFail",
      () => {
        this.onMiniGameFail();
        miniClone.destroy();
      },
      this
    );

    // Hiển thị ProgressBar
    // this.powerBar.active = true;
    // this.powerBar.getComponent(cc.ProgressBar).progress = 0;
  }

  private onMiniGameMiss(failRatio: number) {
    cc.log(`🎯 MiniGame miss: ${failRatio}`);
    SoundUtil.instance.playSFX(SFX.LineSnap);
    if (failRatio === 0.8) {
      SoundUtil.instance.playSFX(SFX.Warning);
    }
    UICtrl.instance.updatePowerBarProgress(failRatio);
  }

  private onMiniGameProgress(ratio: number) {
    cc.log(`🎯 MiniGame progress: ${ratio}`);
    SoundUtil.instance.playSFX(SFX.PullLine);
    this.characterSpine.setAnimation(0, "fishing", true);

    // 🎣 Mục tiêu: hook di chuyển dần về vị trí cần câu (đầu rod)
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);

    // Vị trí hiện tại của hook
    // const currentPos = this.hook.getPosition();

    // // 🧩 Làm mượt và tăng tốc theo tiến trình
    // const easedRatio = Math.pow(ratio, 2.2); // tốc độ kéo tăng dần
    // const pullStrength = 0.1 + easedRatio * 0.9;

    // 🎣 Di chuyển hook về cần
    // let targetPos = currentPos.lerp(rodTipLocal, pullStrength);
    this.hook.stopAllActions();
    // this.hook.runAction(
    //   cc.moveTo(0.3, targetPos).easing(cc.easeCubicActionOut())
    // );

    let time = 2;
    this.hook.runAction(
      cc.callFunc(() => {
        // Kéo hook hoàn toàn về rod
        // const rodTipWorld = this.getRodTipWorldPos();
        // const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
        const moveBack = cc.moveTo(time, rodTipLocal).easing(cc.easeBackIn());
        this.hook.runAction(moveBack);
        this.schedule(
          () => {
            GameCoreManager.instance.updateCameraFollow(
              this.hook
                .convertToWorldSpaceAR(cc.v2(0, 0))
                .add(this.cameraOffset)
            );
          },
          0.01,
          time / 0.01
        );

        this.scheduleOnce(() => {
          this.characterSpine.setAnimation(0, "stand", true);
          this.onMiniGameWin();
          // this.resetCycle();
        }, time);
      })
    );

    // GameCoreManager.instance.updateCameraFollow(targetPos);
  }

  private onMiniGameWin() {
    cc.log("🏆 Fish successfully caught!");
    SoundUtil.instance.playSFX(SFX.Success1);
    SoundUtil.instance.playSFX(SFX.Success2);

    if (this.hookedFish) {
      this.hookedFish.scaleX = -1;
      this.hookedFish.setPosition(
        this.hook.x - this.hookedFish.children[0].width / 1.5,
        250
      );
      this.hookedFish.children[1].active = false; // tắt hiệu bong bóng
      // this.characterSpine.setAnimation(0, "celebrate", false);
      this.scheduleOnce(() => {
        this.hookedFish.destroy();
        this.hookedFish = null;
        this.characterSpine.setAnimation(0, "stand", true);
        let open = cc.callFunc(() => {
          this.popup.getComponent(PopUp).openPopup();
        });
        let setInfo = cc.callFunc(() => {
          this.popup
            .getComponent(PopUp)
            .setFishInfo(
              this.hookedFishInfo.stats.call,
              this.hookedFishInfo.stats.length,
              this.hookedFishInfo.stats.value,
              this.hookedFishInfo.stats.rarity,
              this.hookedFishInfo.stats.id
            );
        });
        let seq = cc.sequence(open, setInfo);
        this.node.runAction(seq);
        this.resetCycle();
      }, 3);
    }
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
          const rodTipLocal =
            this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
          const moveBack = cc.moveTo(0.6, rodTipLocal).easing(cc.easeBackIn());
          this.hook.runAction(moveBack);

          this.scheduleOnce(() => {
            this.resetCycle();
          }, 0.6);
        })
      )
    );

    if (this.hookedFish) {
      let worldPos = this.hookedFish.convertToWorldSpaceAR(cc.v2(0, 0));
      let localPos = this.waterArea.convertToNodeSpaceAR(worldPos);
      this.hookedFish.setPosition(localPos);
      this.hookedFish.parent = this.waterArea;
      this.hookedFish.children[0]
        .getComponent(sp.Skeleton)
        .setAnimation(0, "swim", true);
      this.hookedFish.getComponent(Fish).pickNewTarget();
      cc.log("🐟 Released fish back to water", this.hookedFish);
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
    GameCoreManager.instance.setCameraPosition(cc.v2(0, 0));

    UICtrl.instance.activeatePowerBar(false);
    this.angleNode.active = true;
    this.schedule(this.updateAngle, 0.02);
  }
}
