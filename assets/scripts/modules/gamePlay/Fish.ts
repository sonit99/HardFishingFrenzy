import { FishRarity, Area } from "./FishCtrl";

const { ccclass, property } = cc._decorator;

interface FishConfig {
  speed: number;
  roamArea: cc.Rect;
}

export interface IFishStats {
  id: number;
  length: number;
  value: number;
  rarity: FishRarity;
  call: string;
}

@ccclass
export default class Fish extends cc.Component {
  maxSpeed: number = 200;
  velocity: cc.Vec2 = cc.v2(0, 0);
  direction: number = 1; // 1: right, -1: left
  roamArea: cc.Rect = cc.rect(-1500, 0, 1000, 500);
  angle: number = 0;
  targetPos: cc.Vec2 = cc.v2(0, 0);
  area: Area = Area.Near;

  isHooked: boolean = false;

  stats: IFishStats | null = null;

  protected onLoad(): void {
    this.pickNewTarget();
  }

  update(dt: number) {
    if (this.isHooked) {
      return;
    }
    const dir = this.targetPos.sub(this.node.getPosition());
    const dist = dir.mag();

    // Nếu đến gần mục tiêu thì chọn điểm mới
    if (dist < 10) {
      this.pickNewTarget();
      return;
    }

    // Vector hướng di chuyển
    const moveDir = dir.normalize();

    // Cập nhật vị trí
    this.node.x += moveDir.x * this.maxSpeed * dt;
    this.node.y += moveDir.y * this.maxSpeed * dt;

    // === Lật cá theo hướng ngang ===
    if (moveDir.x >= 0) {
      this.node.scaleX = -1; // sang phải
    } else {
      this.node.scaleX = 1; // sang trái
    }

    // // === Xác định hướng trái/phải ===
    // let targetScaleX = this.node.scaleX;
    // if (moveDir.x >= 0) {
    //   targetScaleX = -1; // sang phải
    // } else {
    //   targetScaleX = 1; // sang trái
    // }

    // // === Lật mượt mà, không bẹp ===
    // const current = this.node.scaleX;
    // const newScale = cc.misc.lerp(current, targetScaleX, 0.15);
    // // tránh giá trị giữa quá nhỏ khiến sprite bị ép mỏng
    // if (Math.abs(newScale) < 0.3) {
    //   this.node.scaleX = 0.3 * Math.sign(newScale || 1);
    // } else {
    //   this.node.scaleX = newScale;
    // }

    // === Tính góc nghiêng theo hướng di chuyển ===
    // Góc gốc của Cocos: 0° là sang trái, tăng CCW
    // Ta cần xoay cá sao cho:
    // - Khi bơi sang trái (scaleX=1): angle = atan2(y, -x)
    // - Khi bơi sang phải (scaleX=-1): angle = atan2(-y, x)
    let targetAngle = 0;
    if (this.node.scaleX === 1) {
      // hướng trái
      targetAngle = (Math.atan2(-moveDir.y, -moveDir.x) * 180) / Math.PI;
    } else {
      // hướng phải
      targetAngle = (Math.atan2(moveDir.y, moveDir.x) * 180) / Math.PI;
    }

    // Quay mượt về góc mới
    this.angle = cc.misc.lerp(this.angle, targetAngle, 0.02);
    this.node.angle = this.angle;
  }

  pickNewTarget() {
    const r = this.roamArea;
    const minDistance = 800; // 📏 khoảng cách tối thiểu giữa 2 target (px)
    let newTarget: cc.Vec2;
    let attempt = 0;

    do {
      const rx = r.x + Math.random() * r.width;
      const ry = r.y + Math.random() * r.height;
      newTarget = cc.v2(rx, ry);
      attempt++;
    } while (this.targetPos.sub(newTarget).mag() < minDistance && attempt < 10);

    this.targetPos = newTarget;

    // 🎯 Random lại tốc độ mỗi khi chọn target mới
    const minSpeed = 100;
    const maxSpeed = 400;
    this.maxSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  }
}
