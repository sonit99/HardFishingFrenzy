const { ccclass, property } = cc._decorator;

@ccclass
export default class RopeRenderer extends cc.Component {
    @property(cc.Node)
    rod: cc.Node = null;

    @property(cc.Node)
    hook: cc.Node = null;

    private gfx: cc.Graphics = null;

    onLoad() {
        this.gfx = this.getComponent(cc.Graphics);
    }

    update() {
        if (!this.gfx || !this.rod || !this.hook) return;
        this.gfx.clear();
        this.gfx.moveTo(this.rod.x + this.rod.width, this.rod.y);
        this.gfx.lineTo(this.hook.x, this.hook.y);
        this.gfx.stroke();
    }
}
