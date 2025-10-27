import { DataManager } from "../../manager/DataMgr";
import SoundUtil, { SFX } from "../../utils/SoundUtil";
import Fish, { Area, FishRarity, FishStats, IFishStats } from "./Fish";
import GamePlayMgr from "./GamePlayMgr";

const { ccclass } = cc._decorator;

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

    for (let i = 0; i < count; i++) {
      const rarity = this.getRandomRarityForArea(area);
      const fishList = this.getFishNamesByRarity(rarity);
      if (fishList.length === 0) continue;

      const randomName = fishList[Math.floor(Math.random() * fishList.length)];
      const stats = FishStats[randomName];

      const fish = cc.instantiate(this.fishPrefab);
      fish.parent = this.node;

      fish.getComponent(Fish).init(randomName, stats, area);

      // Thêm vào danh sách
      this.fishes.push({ node: fish, stats, area });
    }

    cc.log(`🐠 Spawned ${count} fishes in area ${Area[area]}`);
  }
}
