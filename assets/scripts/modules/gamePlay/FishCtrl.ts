import { DataManager } from "../../manager/DataMgr";
import SoundUtil, { SFX } from "../../utils/SoundUtil";
import Fish, { IFishStats } from "./Fish";
import GamePlayMgr from "./GamePlayMgr";
import RopeRenderer from "./RopeRenderer";

const { ccclass } = cc._decorator;

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

export const MapRate = {
  [Area.Near]: {
    [FishRarity.Common]: 0,
    [FishRarity.Uncommon]: 0,
    [FishRarity.Rare]: 30,
    [FishRarity.Epic]: 65,
    [FishRarity.Legend]: 5,
  },
  [Area.MEDIUM]: {
    [FishRarity.Common]: 0,
    [FishRarity.Uncommon]: 0,
    [FishRarity.Rare]: 30,
    [FishRarity.Epic]: 65,
    [FishRarity.Legend]: 5,
  },
  [Area.FAR]: {
    [FishRarity.Common]: 0,
    [FishRarity.Uncommon]: 0,
    [FishRarity.Rare]: 30,
    [FishRarity.Epic]: 65,
    [FishRarity.Legend]: 5,
  },
  [Area.FARTHEST]: {
    [FishRarity.Common]: 0,
    [FishRarity.Uncommon]: 0,
    [FishRarity.Rare]: 30,
    [FishRarity.Epic]: 65,
    [FishRarity.Legend]: 5,
  },
};

export interface FishInfo {
  node: cc.Node;
  stats: IFishStats;
  area: Area;
}

@ccclass
export default class FishController extends cc.Component {
  private fishPrefab: cc.Prefab = null;
  private fishes: FishInfo[] = [];
  private spawnRangeX: number = 3240;
  private spawnRangeY: number = 1056;

  private fishSwimData: Map<cc.Node, { dir: number; baseY: number }> =
    new Map();

  start() {
    this.scheduleOnce(async () => {
      try {
        DataManager.instance.getPrefabs("Fish").then((prefab: cc.Prefab) => {
          this.fishPrefab = prefab;
          this.spawnInitialFish();
        });
      } catch (err) {
        cc.error("Failed to load fish prefab:", err);
      }
    }, 0.2);
  }

  spawnInitialFish() {
    // Mỗi khu vực spawn số cá khác nhau (tuỳ bạn chỉnh)
    // Sẽ tạo thêm function tính %
    const areaFishCount = {
      [Area.Near]: 10,
      [Area.MEDIUM]: 10,
      [Area.FAR]: 10,
      [Area.FARTHEST]: 10,
    };

    for (const area of Object.values(Area).filter(
      (v) => typeof v === "number"
    )) {
      this.spawnFishByArea(area as Area, areaFishCount[area]);
    }

    cc.log(`🎣 Total spawned fishes: ${this.fishes.length}`);
  }

  onHookInWater(hook: cc.Node) {
    let nearest: FishInfo = null;
    let minDist = Infinity;

    // === 1️⃣ Lấy vị trí tip hook trong world space
    const tipWorld = hook.parent.convertToWorldSpaceAR(hook.getPosition());

    // === 2️⃣ Chuyển sang local của WaterArea (node chứa FishCtrl)
    const tipInWater = this.node.convertToNodeSpaceAR(tipWorld);

    for (const f of this.fishes) {
      const d = f.node.getPosition().sub(tipInWater).mag();
      if (d < minDist) {
        minDist = d;
        nearest = f;
      }
    }
    cc.log(`🎯 Nearest fish: ${nearest.stats.call}, tipInWater: ${tipInWater}`);
    if (!nearest) return;

    // stop swimming animation and other actions
    this.fishes = this.fishes.filter((f) => f.node !== nearest.node);
    nearest.node.stopAllActions();
    let fishWorldPos = nearest.node.parent.convertToWorldSpaceAR(
      nearest.node.position
    );
    let fishLocalToHook = hook.convertToNodeSpaceAR(fishWorldPos);
    nearest.node.parent = hook;
    nearest.node.setPosition(fishLocalToHook);
    nearest.node.angle = hook.angle;
    nearest.node.scaleX = -nearest.node.scaleX;

    let tipPos = cc.v2(0, -hook.height + 5);
    cc.log(nearest.node.x < tipPos.x);
    if (
      (nearest.node.x < tipPos.x && nearest.node.scaleX > 0) ||
      (nearest.node.x > tipPos.x && nearest.node.scaleX < 0)
    ) {
      nearest.node.scaleX = -nearest.node.scaleX;
    }
    nearest.node.getComponent(Fish).isHooked = true;
    const swim = cc.moveTo(1, cc.v2(0, -30)).easing(cc.easeCubicActionInOut());
    nearest.node.runAction(swim);

    this.scheduleOnce(() => {
      this.onFishBite(nearest);
      hook.stopAllActions();
    }, 1);
  }

  onFishBite(fish: FishInfo) {
    this.node.emit("FishBitten", fish);
    SoundUtil.instance.playSFX(SFX.FishBite);
    SoundUtil.instance.playSFX(SFX.FishFlounder);

    fish.node.children[0]
      .getComponent(sp.Skeleton)
      .setAnimation(0, "catch", true);
      fish.node.children[1].active = true;

    // 🔥 Bắt đầu minigame sau khi cắn câu
    const gameplay = this.node.parent.getComponent(GamePlayMgr);
    if (gameplay) {
      gameplay.startMiniGame(fish);
    }
  }

  getRandomRarityForArea(area: Area): FishRarity {
    const rates = MapRate[area];
    const total = Object.values(rates).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;

    for (const rarity in rates) {
      rand -= rates[rarity as FishRarity];
      if (rand <= 0) {
        return rarity as FishRarity;
      }
    }

    return FishRarity.Common; // fallback
  }

  getFishNamesByRarity(rarity: FishRarity): string[] {
    return Object.keys(FishStats).filter(
      (name) => FishStats[name].rarity === rarity
    );
  }

  spawnFishByArea(area: Area, count: number) {
    if (!this.fishPrefab) return;

    const areaHeight = this.spawnRangeY / 2;
    const areaWidth = this.spawnRangeX / 4; // chia 4 khoảng đều nhau

    // Xác định phạm vi X của area
    const halfX = this.spawnRangeX / 2;
    const minX = -halfX + areaWidth * area;
    const maxX = minX + areaWidth;

    const halfY = this.spawnRangeY / 2;
    const padding = 100;

    for (let i = 0; i < count; i++) {
      const rarity = this.getRandomRarityForArea(area);
      const fishList = this.getFishNamesByRarity(rarity);
      if (fishList.length === 0) continue;

      const randomName = fishList[Math.floor(Math.random() * fishList.length)];
      const stats = FishStats[randomName];

      const fish = cc.instantiate(this.fishPrefab);
      fish.parent = this.node;

      let ske = fish.children[0].getComponent(sp.Skeleton);
      cc.log("Spawning fish:", randomName, "Rarity:", rarity);
      ske.defaultSkin = randomName;
      ske.setSkin(randomName);
      ske.defaultAnimation = "swim";
      ske.setAnimation(0, "swim", true);

      fish.children[1].active = false;

      // Random vị trí trong vùng area
      const x = minX + Math.random() * (maxX - minX);
      const y =
        Math.random() * (this.spawnRangeY - padding * 2) - (halfY - padding);

      fish.setPosition(x, y);
      fish.scaleX = Math.random() < 0.5 ? 1 : -1;

      // tạo script behaviour cho nó
      const behaviour = fish.addComponent(Fish);
      behaviour.stats = stats;
      behaviour.area = area;
    switch (area) {
      case Area.Near:
        behaviour.roamArea = cc.rect(-1500, -500, 1000, 1000);
        break;
        case Area.MEDIUM:
        behaviour.roamArea = cc.rect(-500, -500, 1000, 1000);
        break;
        case Area.FAR:
        behaviour.roamArea = cc.rect(500, -500, 1000, 1000);
        break;
        case Area.FARTHEST:
        behaviour.roamArea = cc.rect(1500, -500, 1000, 1000);
        break;
      default:
        behaviour.roamArea = cc.rect(-1500, -500, 1000, 1000);
        break;
    }

      // Thêm vào danh sách
      this.fishes.push({ node: fish, stats, area });

      // Ghi nhớ hướng bơi
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.fishSwimData.set(fish, { dir, baseY: y });
    }

    cc.log(`🐠 Spawned ${count} fishes in area ${Area[area]}`);
  }
}
