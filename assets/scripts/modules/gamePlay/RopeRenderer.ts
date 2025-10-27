const { ccclass, property } = cc._decorator;

@ccclass
export default class RopeRenderer extends cc.Component {
  @property(cc.Node)
  rod: cc.Node = null; // node đầu cần câu

  @property(cc.Node)
  hook: cc.Node = null;

  @property
  segmentCount: number = 20;

  @property
  sagFactor: number = 0.15;

  @property
  lerpSpeed: number = 8;

  @property
  swayAmplitude: number = 10;

  @property
  swayDecay: number = 2;

  private isFlying: boolean = false; // 🚀 true = đang ném, false = rơi hoặc dừng

  setFlyingState(flying: boolean) {
    this.isFlying = flying;
  }

  private isTight: boolean = false;

  setTightState(bool: boolean){
    this.isTight = bool;
  }

  private gfx: cc.Graphics = null;
  private prevHookPos: cc.Vec2 = cc.v2();
  private currentPoints: cc.Vec2[] = [];
  private swayTime: number = 0;
  private isHookMoving: boolean = true;

  onLoad() {
    this.gfx = this.getComponent(cc.Graphics);
    this.prevHookPos = this.hook.getPosition().clone();

    for (let i = 0; i <= this.segmentCount; i++) {
      this.currentPoints.push(this.prevHookPos.clone());
    }
  }

  update(dt: number) {
    if (!this.gfx || !this.rod || !this.hook) return;

    // === Tính vị trí tip của rod ===
    const rodAnchor = this.rod.getAnchorPoint();
    const tipLocal = cc.v2(
      this.rod.width * (1 - rodAnchor.x),
      this.rod.height * (1 - rodAnchor.y)
    );
    const tipWorld = this.rod.convertToWorldSpaceAR(tipLocal);
    const start = this.node.convertToNodeSpaceAR(tipWorld);

    // === Hook position ===
    const hookWorld = this.hook.convertToWorldSpaceAR(cc.v2(0, 0));
    const end = this.node.convertToNodeSpaceAR(hookWorld);

    const hookVel = end.sub(this.prevHookPos);
    this.prevHookPos = end.clone();

    const goingUp = hookVel.y > 0;
    this.isHookMoving = hookVel.mag() > 0.1;
    if (!this.isHookMoving) this.swayTime += dt;
    else this.swayTime = 0;

    // === Tính rũ dây ===
    const ropeVec = end.sub(start);
    const sagDir = goingUp ? 0.25 : 1;
    const sag = ropeVec.mag() * this.sagFactor * sagDir;

    const targetPoints: cc.Vec2[] = [];
    for (let i = 0; i <= this.segmentCount; i++) {
      const t = i / this.segmentCount;
      const base = start.add(ropeVec.mul(t));

      // 🎣 Tạo độ cong dây tùy trạng thái bay/rơi
      const curve = Math.sin(Math.PI * t);

      let offsetY = 0;

      // 🚀 Khi đang ném — dây cong phồng lên (Y dương)
      if (this.isFlying) {
        offsetY = sag * 0.9 * curve; // cong hướng lên
      }
      // 💧 Khi hook rơi hoặc chạm nước — dây rũ xuống (Y âm)
      else {
        offsetY = -sag * 1.3 * curve; // cong hướng xuống
        // cc.log("💧 Rũ dây:", offsetY);
      }

      if (this.isTight) {
        offsetY = 0 ;
      }

      // Khi kéo hook lên, giảm độ cong cho thẳng dần
      if (goingUp) offsetY *= 0.4;

      // Giảm nhẹ độ rũ nếu hook quá thấp để tránh dây bẹt
      if (end.y < start.y) {
        const diffY = Math.abs(end.y - start.y);
        const flatten = cc.misc.clamp01(diffY / 800);
        offsetY *= 1 - flatten * 0.4;
      }

      let p = base.add(cc.v2(0, offsetY));

      targetPoints.push(p);
    }

    // === Lerp từng điểm ===
    this.currentPoints[0] = start.clone();
    for (let i = 1; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      const lerpFactor =
        dt * this.lerpSpeed * (0.5 + 0.5 * t) * (1 + hookVel.mag() * 2);
      this.currentPoints[i] = this.currentPoints[i].lerp(
        targetPoints[i],
        Math.min(lerpFactor, 1)
      );
    }
    this.currentPoints[this.segmentCount] = end.clone();

    // === Vẽ dây ===
    this.gfx.clear();
    this.gfx.lineWidth = 4;
    this.gfx.strokeColor = cc.Color.BLACK;
    this.gfx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
    for (let i = 1; i <= this.segmentCount; i++) {
      this.gfx.lineTo(this.currentPoints[i].x, this.currentPoints[i].y);
    }
    this.gfx.stroke();
  }
}
