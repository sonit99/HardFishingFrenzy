import Common from "../../utils/Common";
import { FishInfo } from "./FishCtrl";

const { ccclass, property } = cc._decorator;

export enum FishRarity {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  Epic = "epic",
  Legend = "legend",
}
export enum FishName {
  Abyssal_Leviathan = "Abyssal Leviathan",
  Atlantic_Mackerel = "Atlantic Mackerel",
  Bermuda_Moonfish = "Bermuda Moonfish",
  Crystal_Seadragon = "Crystal Seadragon",
  Great_Barracuda = "Great Barracuda",
  Leafy_Sea_Dragon = "Leafy Seadragon",
  Neon_Tetra = "Neon Tetra",
  Ocean_Seraph = "Ocean Seraph",
  Ocean_Sunfish = "Ocean Sunfish",
  Shadowfin_Marlin = "Shadowfin Marlin",
  Swordfish = "Swordfish",
  Voidfin_Levi = "Voidfin Levi",
  Lionfish = "lionfish",
  Fish_Shadow = "fish_shadow",
}

export const FishStats = {
  [FishName.Atlantic_Mackerel]: {
    id: 0,
    length: 30,
    value: 25,
    rarity: FishRarity.Common,
    call: FishName.Atlantic_Mackerel,
    posSpine: { x: 45, y: 1 },
  },
  [FishName.Neon_Tetra]: {
    id: 1,
    length: 6.5,
    value: 15,
    rarity: FishRarity.Common,
    call: FishName.Neon_Tetra,
    posSpine: { x: 34, y: 0 },
  },
  [FishName.Swordfish]: {
    id: 2,
    length: 90,
    value: 50,
    rarity: FishRarity.Uncommon,
    call: FishName.Swordfish,
    posSpine: { x: 45, y: 8.5 },
  },
  [FishName.Leafy_Sea_Dragon]: {
    id: 3,
    length: 35,
    value: 30,
    rarity: FishRarity.Uncommon,
    call: FishName.Leafy_Sea_Dragon,
    posSpine: { x: 32, y: -22 },
  },
  [FishName.Ocean_Sunfish]: {
    id: 4,
    length: 300,
    value: 200,
    rarity: FishRarity.Rare,
    call: FishName.Ocean_Sunfish,
    posSpine: { x: 55, y: -5 },
  },
  [FishName.Great_Barracuda]: {
    id: 5,
    length: 150,
    value: 100,
    rarity: FishRarity.Rare,
    call: FishName.Great_Barracuda,
    posSpine: { x: 57, y: 0 },
  },
  [FishName.Bermuda_Moonfish]: {
    id: 6,
    length: 330,
    value: 400,
    rarity: FishRarity.Epic,
    call: FishName.Bermuda_Moonfish,
    posSpine: { x: 57, y: -7 },
  },
  // [FishName.Shadowfin_Marlin]: { id: 8, length: 340, value: 500, rarity: FishRarity.Epic, call: FishName.Shadowfin_Marlin },
  [FishName.Crystal_Seadragon]: {
    id: 7,
    length: 45,
    value: 120,
    rarity: FishRarity.Epic,
    call: FishName.Crystal_Seadragon,
    posSpine: { x: 25, y: -17 },
  },
  [FishName.Lionfish]: {
    id: 8,
    length: 50,
    value: 200,
    rarity: FishRarity.Epic,
    call: FishName.Lionfish,
    posSpine: { x: 84, y: 1 },
  },
  [FishName.Abyssal_Leviathan]: {
    id: 9,
    length: 3350,
    value: 800,
    rarity: FishRarity.Legend,
    call: FishName.Abyssal_Leviathan,
    posSpine: { x: 170, y: -20 },
  },
  [FishName.Ocean_Seraph]: {
    id: 10,
    length: 38,
    value: 400,
    rarity: FishRarity.Legend,
    call: FishName.Ocean_Seraph,
    posSpine: { x: 38, y: 3 },
  },
  [FishName.Voidfin_Levi]: {
    id: 11,
    length: 1400,
    value: 1000,
    rarity: FishRarity.Legend,
    call: FishName.Voidfin_Levi,
    posSpine: { x: 104, y: 22 },
  },
};

export enum FishAnim {
  SWIM = "swimming",
  CATCH = "catched"
}

export enum Area {
  Near = 0,
  MEDIUM = 1,
  FAR = 2,
  FARTHEST = 3,
}

export const RareBaitRate = {
  [FishRarity.Common]: 100,
  [FishRarity.Uncommon]: 75,
  [FishRarity.Rare]: 50,
  [FishRarity.Epic]: 25,
  [FishRarity.Legend]: 10,
}

export interface IFishStats {
  id: number;
  length: number;
  value: number;
  rarity: FishRarity;
  call: string;
  posSpine: { x: number, y: number },
  posBubble: { x: number, y: number },
}

@ccclass
export default class Fish extends cc.Component {
  @property(sp.SkeletonData)
  listSkeData: sp.SkeletonData[] = [];

  minSpeed = 100;
  maxSpeed = 250;
  speed = 200;
  velocity: cc.Vec2 = cc.v2(0, 0);
  direction: number = 1; // 1: right, -1: left
  roamArea: cc.Rect = cc.rect(-1500, -500, 1000, 1000);
  angle: number = 0;
  targetPos: cc.Vec2 = cc.v2(0, 0);
  area: Area = Area.Near;
  private spawnRangeX: number = 3240;
  private spawnRangeY: number = 1075;

  isHooked: boolean = false;
  goingForHook: boolean = false;

  stats: IFishStats | null = null;

  protected onLoad(): void {
    this.pickNewTarget();
  }

  init(randomName: string, stats: IFishStats, area: Area) {
    let ske = this.node.children[0].getComponent(sp.Skeleton);
    ske.skeletonData = this.listSkeData[stats.id];
    // ske.defaultSkin = randomName;
    // ske.setSkin(randomName);
    ske.defaultAnimation = FishAnim.SWIM;
    ske.setAnimation(0, FishAnim.SWIM, true);

    this.node.children[0].setPosition(stats.posSpine.x, stats.posSpine.y);
    this.node.children[1].setPosition(stats.posSpine.x * 2, 0);

    this.node.children[1].active = true;

    this.stats = stats;
    this.area = area;

    const areaHeight = this.spawnRangeY / 2;
    const areaWidth = this.spawnRangeX / 4; // chia 4 khoảng đều nhau

    // Xác định phạm vi X của area
    const halfX = this.spawnRangeX / 2;
    const minX = -halfX + areaWidth * area;
    const maxX = minX + areaWidth;

    const halfY = this.spawnRangeY / 2;
    const padding = 100;

    // Random vị trí trong vùng area
    const x = minX + Math.random() * (maxX - minX);
    const y =
      Math.random() * (this.spawnRangeY - padding * 2) - (halfY - padding);

    this.node.setPosition(x, y);
    this.node.scaleX = Math.random() < 0.5 ? 1 : -1;

    // this.roamArea = cc.Rect()

    switch (area) {
      case Area.Near:
        this.roamArea = cc.rect(-1500, -500, 1000, 1000);
        break;

      case Area.MEDIUM:
        this.roamArea = cc.rect(-500, -500, 1000, 1000);
        break;

      case Area.FAR:
        this.roamArea = cc.rect(500, -500, 1000, 1000);
        break;

      case Area.FARTHEST:
        this.roamArea = cc.rect(1500, -500, 1000, 1000);
        break;

      default:
        this.roamArea = cc.rect(-1500, -500, 1000, 1000);
        break;
    }

  }

  update(dt: number) {

    if (this.isHooked) {
      return;
    }
    const dir = this.targetPos.sub(this.node.getPosition());
    const dist = dir.mag();

    // Nếu đến gần mục tiêu thì chọn điểm mới
    if (dist < 10 && !this.goingForHook) {
      this.pickNewTarget();
      return;
    }

    if (dist === 0 && this.goingForHook) {
      this.isHooked = true;
      let node = this.node;
      let stats = this.stats;
      let area = this.area;
      let fishInfo: FishInfo = {node, stats, area}
      this.node.emit("FishBitten", fishInfo);
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
    this.speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
  }

  setNewTarget(pos: cc.Vec2) {
    this.targetPos = pos;
  }

  findHook(hookPos: cc.Vec2) {
    let minDist = 500;
    const d = this.node.getPosition().sub(hookPos).mag();
    if (d < minDist) {
      this.tryHook(hookPos);
    }
  }

  tryHook(hookPos: cc.Vec2) {
    let rand = Common.randomInt(1, 100);
    if (rand <= RareBaitRate[this.stats.rarity]) {
      this.setNewTarget(hookPos);
      this.goingForHook = true;
    } else {
      this.pickNewTarget();
    }
  }
}
