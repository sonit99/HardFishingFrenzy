
/**
 * Standalone Object Pool - Does not extend Component
 * Can be used anywhere in your code
 */
export default class ObjectPool {
    private prefab: cc.Prefab = null;
    private pool: cc.Node[] = [];
    private poolName: string = '';

    /**
     * Create a new ObjectPool
     * @param prefab - The prefab to pool
     * @param poolName - Optional name for debugging
     */
    constructor(prefab: cc.Prefab, poolName: string = '') {
        this.prefab = prefab;
        this.poolName = poolName || prefab.name;
    }

    /**
     * Get node from pool or instantiate new one
     */
    get(): cc.Node {
        let node: cc.Node;
        if (this.pool.length > 0) {
            node = this.pool.pop();
        } else {
            node = cc.instantiate(this.prefab);
        }
        node.active = true;
        return node;
    }

    /**
     * Return node to pool
     */
    put(node: cc.Node) {
        if (!node || !node.isValid) return;
        
        node.stopAllActions();
        node.active = false;
        node.removeFromParent();
        this.pool.push(node);
    }

    /**
     * Return all nodes to pool
     */
    putAll(nodes: cc.Node[]) {
        nodes.forEach(n => this.put(n));
    }

    /**
     * Clear pool and destroy all nodes
     */
    clear() {
        this.pool.forEach(n => {
            if (n && n.isValid) {
                n.destroy();
            }
        });
        this.pool = [];
    }

    /**
     * Get number of nodes in pool
     */
    size(): number {
        return this.pool.length;
    }

    /**
     * Preload nodes into pool
     */
    preload(count: number) {
        for (let i = 0; i < count; i++) {
            const node = cc.instantiate(this.prefab);
            node.active = false;
            this.pool.push(node);
        }
    }

    /**
     * Get pool name
     */
    getName(): string {
        return this.poolName;
    }

    /**
     * Check if pool is empty
     */
    isEmpty(): boolean {
        return this.pool.length === 0;
    }
}