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

    private _objects: any = null;
    private _characters: any = null;
    private _skills: any = null;
    private _paths: any = null;

    /** Load tất cả JSON */
    public async loadAll(): Promise<void> {
        const [objects, characters, skills, paths] = await Promise.all([
            this.loadJSON("db/itemHooks"),
            this.loadJSON("db/characters"),
            this.loadJSON("db/skills"),
            this.loadJSON("db/paths"),
        ]);

        this._objects = objects;
        this._characters = characters;
        this._skills = skills;
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
    // ====== Objects ====== 
    public getObjectById(id: number): any {
        if (!this._objects) return null;
        return Object.values(this._objects).find((o: any) => o.id === id) || null;
    }

    public getAllObjects(): any {
        return this._objects;
    }

    // ====== Characters ====== 
    public getCharacterById(id: number): any {
        if (!this._characters) return null;
        return this._characters[id] || null;
    }

    public getAllCharacters(): any {
        return this._characters;
    }

    // ====== Skills ====== 
    public getSkillById(id: number): any {
        if (!this._skills) return null;
        return this._skills[id] || null;
    }

    public getAllSkills(): any {
        return this._skills;
    }

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

    public getSoundPath(name: string) {
        return this._paths.sounds[name];
    }

    public getTexturePath(name: string) {
        return this._paths.textures[name];
    }

    public getMusicPath(name: string) {
        return this._paths.music[name];
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
}
