import { DataManager } from "../../manager/DataMgr";

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
    private fishPrefab: cc.Prefab = null;
    private fishes: FishInfo[] = [];
    private spawnRangeX: number = 800;
    private spawnRangeY: number = 300;

    start() {
        try {
            DataManager.instance.getPrefabs("Fish").then((prefab: cc.Prefab) => {
                this.fishPrefab = prefab;
                this.spawnInitialFish();
            });
        }
        catch (err) {
            cc.error("Failed to load fish prefab:", err);
        }
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
            cc.log(`🐠 ${nearest.rarity} moving toward hook...`);
            nearest.node.stopAllActions();

            // Bơi tới hook từ từ (có easing)
            // === Lấy world vị trí tip của hook ===
            const tipWorld = this.node.parent.getComponent("GamePlayMgr").getHookTipWorldPos();
            // hoặc nếu hook có reference tới GamePlayMgr, gọi trực tiếp

            // === Chuyển sang hệ toạ độ của cá ===
            const tipInFishParent = nearest.node.parent.convertToNodeSpaceAR(tipWorld);

            // ✅ Xác định hướng bơi
            if (tipInFishParent.x > nearest.node.x) {
                // Hook nằm bên trái cá
                nearest.node.scaleX = -Math.abs(nearest.node.scaleX); // bơi sang trái
            } else {
                nearest.node.scaleX = Math.abs(nearest.node.scaleX);  // bơi sang phải
            }

            // === Di chuyển tới đầu móc câu (phần tip)
            const swim = cc.moveTo(2.0, cc.v2(tipInFishParent.x - 5, tipInFishParent.y + 5))
                .easing(cc.easeCubicActionInOut());
            nearest.node.runAction(swim);

            // Sau khi tới gần hook → "cắn câu"
            this.scheduleOnce(() => this.onFishBite(nearest), 2.5);
        }

    }

    onFishBite(fish: FishInfo) {
        cc.log(`🎯 ${fish.rarity} fish bit the hook!`);
        this.node.emit("FishBitten", fish);

        fish.node.children[0].getComponent(sp.Skeleton).setAnimation(0, "catch", true);
    }
}
