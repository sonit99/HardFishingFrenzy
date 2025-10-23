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

  onLoad() {
    this.cameraNode = this.cameraNode || cc.find("Canvas/Main Camera");
    this.powerBar.active = false;
    this.arrow.active = true;

    // === Đặt hook ở tip của rod ===

    // const tipWorld = this.getRodTipWorldPos();
    // const tipLocal = this.hook.parent.convertToNodeSpaceAR(tipWorld);
    // this.hook.setPosition(tipLocal);
    // this.hookInitialPos = tipLocal.clone();
    // cc.log(tipLocal);
    this.hookInitialPos = cc.v2(432, 310);
    this.hook.setPosition(cc.v2(432, 310));

    // Camera offset
    const camWorld = this.cameraNode.convertToWorldSpaceAR(cc.v2(0, 0));
    const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
    this.cameraOffset = cc.v2(camWorld.x - hookWorld.x - 100, 0);

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
    this.powerBar.getComponent(cc.ProgressBar).progress =
      this.chargePower / this.maxPower;
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
    let powerScale = 4.5;
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

      // Va chạm nước
      if (this.hook.y <= this.waterArea.y + this.waterArea.height / 2) {
        this.hook.y = this.waterArea.y + this.waterArea.height / 2;
        this.hookHitWater();
      }
    }

    if (!this.minigameUI.active || !this.hookedFish?.isValid) return;

    // Lấy vị trí world của cá
    const fishWorld = this.hookedFish.convertToWorldSpaceAR(cc.v2(0, 0));

    // Chuyển sang tọa độ Canvas (gốc tuyệt đối)
    const canvas = cc.find("Canvas");
    const uiPos = canvas.convertToNodeSpaceAR(fishWorld);

    // Đặt MiniGame ngay dưới cá
    const offset = -100;
    this.minigameUI.setPosition(uiPos.x, uiPos.y + offset);
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
      cc
        .moveTo(sinkTime, cc.v2(this.hook.x, targetY))
        .easing(cc.easeCubicActionOut()),
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
  startMiniGame(rarity: string, worldPos?: cc.Vec2, fishNode?: cc.Node) {
    const miniGameCtrl = this.minigameUI.getComponent("MinigameController");
    let difficulty = 1;
    switch (rarity) {
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
        difficulty = 2.2;
        break;
    }
    this.minigameUI.active = true;
    miniGameCtrl.startMiniGame(difficulty, worldPos);

    // 🎧 Lắng nghe sự kiện minigame
    this.minigameUI.off("MiniGameProgress"); // tránh trùng sự kiện cũ
    this.minigameUI.on("MiniGameProgress", this.onMiniGameProgress, this);
    this.minigameUI.off("MiniGameWin");
    this.minigameUI.off("MiniGameFail");
    this.minigameUI.on("MiniGameWin", this.onMiniGameWin, this);
    this.minigameUI.on("MiniGameFail", this.onMiniGameFail, this);

    // Lưu vị trí ban đầu của hook
    this.hookInitialPos = this.hook.getPosition().clone();

    // Gắn con cá đang bị câu
    this.hookedFish = fishNode;
    this.hookInitialPos = this.hook.getPosition().clone();
  }

  private updateCameraFollow(targetHookPos: cc.Vec2) {
    if (!this.cameraNode) return;

    // 🎯 Chỉ follow ngang theo hook
    const currentCamPos = this.cameraNode.getPosition();

    // Vị trí camera mục tiêu chỉ thay đổi X, giữ nguyên Y và Z hiện tại
    const targetCamX = cc.misc.lerp(currentCamPos.x, targetHookPos.x, 1);

    this.cameraNode.setPosition(targetCamX, currentCamPos.y);
  }

  private onMiniGameProgress(ratio: number) {
    cc.log(`🎯 MiniGame progress: ${ratio}`);

    // 🎣 Mục tiêu: hook di chuyển dần về vị trí cần câu (đầu rod)
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);

    // Vị trí hiện tại của hook
    const currentPos = this.hook.getPosition();

    // Tính vị trí mục tiêu dựa theo tỉ lệ kéo
    let targetPos = currentPos.lerp(rodTipLocal, ratio);

    // Di chuyển mượt hook về gần cần
    const moveAction = cc
      .moveTo(0.4, targetPos)
      .easing(cc.easeCubicActionOut());
    this.hook.stopAllActions();
    this.hook.runAction(moveAction);

    // === Di chuyển cá theo hook ===
    if (this.hookedFish && this.hookedFish.isValid) {
      // 🎯 Lấy world position của đầu móc câu (phần tip)
      const hookTipWorld = this.getHookTipWorldPos();

      // Tính hướng hook theo góc hiện tại
      const angleRad = cc.misc.degreesToRadians(this.hook.angle - 90);
      // (-90) vì trong logic bạn để 0° = hướng xuống
      const offset = cc.v2(Math.cos(angleRad), Math.sin(angleRad)).mul(-35);
      // -35 để cá nằm “phía dưới” tip móc theo hướng dây

      // Tính vị trí mục tiêu của cá trong cùng hệ tọa độ
      const fishTargetWorld = hookTipWorld.add(offset);
      const fishTargetLocal =
        this.hookedFish.parent.convertToNodeSpaceAR(fishTargetWorld);

      if (this.hookedFish.x < this.hook.x) {
        this.hookedFish.scaleX = -Math.abs(this.hookedFish.scaleX); // quay sang phải
      } else {
        this.hookedFish.scaleX = Math.abs(this.hookedFish.scaleX); // quay sang trái
      }

      // Di chuyển mượt cá
      this.hookedFish.stopAllActions();
      const moveFish = cc
        .moveTo(0.4, fishTargetLocal)
        .easing(cc.easeCubicActionOut());
      this.hookedFish.runAction(moveFish);
    }

    const fishWorld = this.hookedFish.convertToWorldSpaceAR(cc.v2(0, 0));
    const canvas = cc.find("Canvas"); // luôn tồn tại
    const uiPos = canvas.convertToNodeSpaceAR(fishWorld);

    // Đặt vị trí dưới cá
    const targetUIPos = cc.v2(uiPos.x, uiPos.y - 100);

    // Di chuyển mượt UI
    const current = this.minigameUI.getPosition();
    const smooth = current.lerp(targetUIPos, 0.3);
    this.minigameUI.setPosition(smooth);

    if (ratio === 1) {
        targetPos = cc.v2(0,0);
    }
    this.updateCameraFollow(targetPos);
  }

  private onMiniGameWin() {
    cc.log("🏆 Fish successfully caught!");
    // Kéo hook hoàn toàn về rod
    const rodTipWorld = this.getRodTipWorldPos();
    const rodTipLocal = this.hook.parent.convertToNodeSpaceAR(rodTipWorld);
    const moveBack = cc.moveTo(0.6, rodTipLocal).easing(cc.easeBackIn());
    this.hook.runAction(moveBack);

    if (this.hookedFish) {
      const moveFish = cc
        .moveTo(0.6, rodTipLocal.add(cc.v2(0, -20)))
        .easing(cc.easeBackIn());
      this.hookedFish.runAction(moveFish);
    }
  }

  private onMiniGameFail() {
    cc.log("💥 Line snapped, fish escaped!");
    // Hook rơi xuống hoặc reset vị trí
    this.hook.runAction(
      cc.sequence(
        cc.moveBy(0.5, cc.v2(0, -100)).easing(cc.easeIn(2.0)),
        cc.callFunc(() => {
          this.resetHook();
        })
      )
    );
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
}
