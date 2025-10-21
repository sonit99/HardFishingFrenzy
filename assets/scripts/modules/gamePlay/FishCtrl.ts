const { ccclass, property } = cc._decorator;

enum FishRarity {
    Common = "common",
    Uncommon = "uncommon",
    Rare = "rare",
    Epic = "epic",
    Legend = "legend",
}

interface FishInfo {
    node: cc.Node;
    rarity: FishRarity;
}

@ccclass
export default class FishController extends cc.Component {
    @property(cc.Prefab)
    fishPrefab: cc.Prefab = null;

    private fishes: FishInfo[] = [];
    private spawnRangeX: number = 800;
    private spawnRangeY: number = 300;

    start() {
        // this.spawnInitialFish();
    }

    spawnInitialFish() {
        const rarities = [
            FishRarity.Common,
            FishRarity.Uncommon,
            FishRarity.Rare,
            FishRarity.Epic,
            FishRarity.Legend,
        ];

        rarities.forEach((r) => {
            const fish = cc.instantiate(this.fishPrefab);
            fish.parent = this.node;
            fish.position = cc.v3(
                Math.random() * this.spawnRangeX,
                Math.random() * this.spawnRangeY,
                0
            );
            this.fishes.push({ node: fish, rarity: r });
        });
    }

    onHookInWater(hook: cc.Node) {
        // Pick nearest fish
        let nearest: FishInfo = null;
        let minDist = Infinity;
        for (const f of this.fishes) {
            const d = f.node.position.sub(hook.position).mag();
            if (d < minDist) {
                minDist = d;
                nearest = f;
            }
        }
        if (nearest) {
            cc.log(`🐠 Nearest fish (${nearest.rarity}) moving to hook`);
            nearest.node.runAction(cc.moveTo(2, cc.v2(hook.position.x, hook.position.y)));
            this.scheduleOnce(() => this.onFishBite(nearest), 2);
        }
    }

    onFishBite(fish: FishInfo) {
        cc.log(`🎯 ${fish.rarity} fish bit the hook!`);
        this.node.emit("FishBitten", fish);
    }
}
