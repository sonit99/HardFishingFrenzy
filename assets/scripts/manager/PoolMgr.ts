import ObjectPool from "./ObjectPool";

const { ccclass, property } = cc._decorator;

@ccclass
/**
 * Global Pool Manager - Manages multiple pools
 */
export class PoolManager {
    private static pools: Map<string, ObjectPool> = new Map();

    /**
     * Create or get a pool by name
     */
    static createPool(name: string, prefab: cc.Prefab): ObjectPool {
        if (!this.pools.has(name)) {
            const pool = new ObjectPool(prefab, name);
            this.pools.set(name, pool);
        }
        return this.pools.get(name);
    }

    /**
     * Get pool by name
     */
    static getPool(name: string): ObjectPool | null {
        return this.pools.get(name) || null;
    }

    /**
     * Check if pool exists
     */
    static hasPool(name: string): boolean {
        return this.pools.has(name);
    }

    /**
     * Remove and clear a pool
     */
    static removePool(name: string) {
        const pool = this.pools.get(name);
        if (pool) {
            pool.clear();
            this.pools.delete(name);
        }
    }

    /**
     * Clear all pools
     */
    static clearAll() {
        this.pools.forEach(pool => pool.clear());
        this.pools.clear();
    }

    /**
     * Get number of pools
     */
    static getPoolCount(): number {
        return this.pools.size;
    }

    /**
     * Get all pool names
     */
    static getPoolNames(): string[] {
        return Array.from(this.pools.keys());
    }
}