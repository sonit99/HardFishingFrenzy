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
    id: 1,
    length: 30,
    value: 25,
    rarity: FishRarity.Common,
    call: FishName.Atlantic_Mackerel,
  },
  [FishName.Neon_Tetra]: {
    id: 2,
    length: 6.5,
    value: 15,
    rarity: FishRarity.Common,
    call: FishName.Neon_Tetra,
  },
  [FishName.Swordfish]: {
    id: 3,
    length: 90,
    value: 50,
    rarity: FishRarity.Uncommon,
    call: FishName.Swordfish,
  },
  [FishName.Leafy_Sea_Dragon]: {
    id: 4,
    length: 35,
    value: 30,
    rarity: FishRarity.Uncommon,
    call: FishName.Leafy_Sea_Dragon,
  },
  [FishName.Ocean_Sunfish]: {
    id: 5,
    length: 300,
    value: 200,
    rarity: FishRarity.Rare,
    call: FishName.Ocean_Sunfish,
  },
  [FishName.Great_Barracuda]: {
    id: 6,
    length: 150,
    value: 100,
    rarity: FishRarity.Rare,
    call: FishName.Great_Barracuda,
  },
  [FishName.Bermuda_Moonfish]: {
    id: 7,
    length: 330,
    value: 400,
    rarity: FishRarity.Epic,
    call: FishName.Bermuda_Moonfish,
  },
  // [FishName.Shadowfin_Marlin]: { id: 8, length: 340, value: 500, rarity: FishRarity.Epic, call: FishName.Shadowfin_Marlin },
  [FishName.Crystal_Seadragon]: {
    id: 9,
    length: 45,
    value: 120,
    rarity: FishRarity.Epic,
    call: FishName.Crystal_Seadragon,
  },
  [FishName.Lionfish]: {
    id: 10,
    length: 50,
    value: 200,
    rarity: FishRarity.Epic,
    call: FishName.Lionfish,
  },
  [FishName.Abyssal_Leviathan]: {
    id: 11,
    length: 3350,
    value: 800,
    rarity: FishRarity.Legend,
    call: FishName.Abyssal_Leviathan,
  },
  [FishName.Ocean_Seraph]: {
    id: 12,
    length: 38,
    value: 400,
    rarity: FishRarity.Legend,
    call: FishName.Ocean_Seraph,
  },
  [FishName.Voidfin_Levi]: {
    id: 13,
    length: 1400,
    value: 1000,
    rarity: FishRarity.Legend,
    call: FishName.Voidfin_Levi,
  },
};

export enum Area {
  Near = 0,
  MEDIUM = 1,
  FAR = 2,
  FARTHEST = 3,
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

  stats: IFishStats | null = null;

  protected onLoad(): void {
    this.pickNewTarget();
  }

  init(randomName: string, stats: IFishStats, area: Area) {
    let ske = this.node.children[0].getComponent(sp.Skeleton);
    ske.defaultSkin = randomName;
    ske.setSkin(randomName);
    ske.defaultAnimation = "swim";
    ske.setAnimation(0, "swim", true);

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

    this.node.children[1].active = false;
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
}
