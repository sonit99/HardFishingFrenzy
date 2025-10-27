
const { ccclass, property } = cc._decorator;

export enum Result {
    Success = 0,
    Fail = 1
}
@ccclass
export default class FlyingLabel extends cc.Component {
    init(r: Result) {
        switch (r) {
            case Result.Success:
                this.node.getComponent(cc.Label).string = "SUCCESS";
                this.node.color = cc.Color.GREEN;
                break;

            case Result.Fail:
                this.node.getComponent(cc.Label).string = "FAIL";
                this.node.color = cc.Color.RED;
                break;

            default:
                break;
        }

        cc.tween(this.node).by(1, { opacity: 0 }).call(() => { this.node.destroy(); }).start();
    }
}
