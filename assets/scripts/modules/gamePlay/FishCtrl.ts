import { DataManager } from "../../manager/DataMgr";
import SoundUtil, { SFX } from "../../utils/SoundUtil";
import Fish, { Area, FishAnim, FishRarity, FishStats, IFishStats } from "./Fish";
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
          this.node.on("FishBitten", this.onFishBite);
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
    for (const f of this.fishes) {
      f.node.getComponent(Fish).findHook(hook);
    }
  }

  onFishBite(fishInfo: FishInfo) {
    cc.log("onFishBite");
    SoundUtil.instance.playSFX(SFX.FishBite);
    SoundUtil.instance.playSFX(SFX.FishFlounder);

    fishInfo.node.children[0]
      .getComponent(sp.Skeleton)
      .setAnimation(0, FishAnim.CATCH, true);
    fishInfo.node.children[1].active = true;

    // 🔥 Bắt đầu minigame sau khi cắn câu
    const gameplay = this.node.parent.getComponent(GamePlayMgr);
    if (gameplay) {
      gameplay.startMiniGame(fishInfo);
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

  private onOtherFishReact(bittenFish: FishInfo) {
    for (const f of this.fishes) {
      if (f.node === bittenFish.node) {
        this.fishes = this.fishes.filter((f) => f.node !== bittenFish.node);
        continue;
      }; // skip the bitten fish
      const fishComp = f.node.getComponent(Fish);
      if (!fishComp) continue;

      fishComp.goingForHook = false;

      // 🛑 Stop any current actions or movement if needed
      f.node.stopAllActions();

      // 🎯 Force fish to change direction/target (panic)
      fishComp.pickNewTarget();
    }

    cc.log("🐟 Other fish reacted to bite event!");
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

      fish.getComponent(Fish).init(stats, area);

      // Thêm vào danh sách
      this.fishes.push({ node: fish, stats, area });
      // 🔥 Listen for bite event from this fish
      fish.on("FishBitten", (bittenInfo: FishInfo) => {
        this.onFishBite(bittenInfo);

        // Tell all other fish to react
        this.onOtherFishReact(bittenInfo);
      });
    }
    cc.log(`🐠 Spawned ${count} fishes in area ${Area[area]}`);
  }
}
