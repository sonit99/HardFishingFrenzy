
const {ccclass, property} = cc._decorator;

@ccclass
export default class NodeZoom extends cc.Component {

    @property({ tooltip: "Tăng số scale lên" })
    scaleNum: number = 1.1;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        let scaleUp = cc.scaleTo(0.5, this.scaleNum);
        let scaleDown = cc.scaleTo(0.5, 1.0);
        let seq = cc.sequence(scaleUp, scaleDown);
        this.node.runAction(cc.repeatForever(seq));
    }
}
