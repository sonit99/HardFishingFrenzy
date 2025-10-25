const { ccclass } = cc._decorator;

@ccclass
export class DataManager {
    private static _instance: DataManager;

    public static get instance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
        }
        return this._instance;
    }

    private constructor() { } // private để đảm bảo singleton

    private _fishes: any = null;
    private _characters: any = null;
    private _paths: any = null;

    /** Load tất cả JSON */
    public async loadAll(): Promise<void> {
        const [fishes, characters, paths] = await Promise.all([
            this.loadJSON("db/fish"),
            this.loadJSON("db/characters"),
            this.loadJSON("db/paths"),
        ]);

        this._fishes = fishes;
        this._characters = characters;
        this._paths = paths;
    }

    /** Load 1 JSON file */
    private loadJSON(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            cc.resources.load(path, (err, asset: cc.JsonAsset) => {
                if (err) {
                    cc.error(`[DataManager] Load failed: ${path}`, err);
                    reject(err);
                    return;
                }
                resolve(asset.json);
            });
        });
    }

    // ====== API truy xuất dữ liệu ======
    // ====== Fishes ====== 


    // ========== Paths ========== 
    public getPrefabPath(name: string) {
        const groups = this._paths.prefabs;
        for (const type in groups) {
            if (groups[type][name]) {
                return groups[type][name];
            }
        }
        return null;
    }

    public getPrefabs(name: string): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            const prefabPath = this.getPrefabPath(name);
            if (!prefabPath) {
                reject(new Error(`Prefab "${name}" not found in path config`));
                return;
            }

            cc.resources.load(prefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(prefab);
            });
        });
    }
    // ====== Sounds ======
    public getSoundPath(name: string) {
        const groups = this._paths.sounds;
        for (const type in groups) {
            if (groups[type][name]) {
                return groups[type][name];
            }
        }
        return null;
    }

        public getClip(name: string): Promise<cc.AudioClip> {
        return new Promise((resolve, reject) => {
            const path = this.getSoundPath(name);
            if (!path) {
                reject(new Error(`Clip "${name}" not found in path config`));
                return;
            }

            cc.resources.load(path, cc.AudioClip, (err, clip: cc.AudioClip) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(clip);
            });
        });
    }

    // ====== Textures ======
    public getTexturePath(name: string) {
        return this._paths.textures[name];
    }
}
