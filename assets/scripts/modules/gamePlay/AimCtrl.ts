const { ccclass, property } = cc._decorator;

@ccclass
export default class AimController extends cc.Component {
    @property(cc.Node)
    aimArrow: cc.Node = null;

    private currentAngle: number = 0;

    updateAim(angle: number) {
        this.currentAngle = angle;
        if (this.aimArrow) this.aimArrow.angle = -angle;
    }

    getAngle(): number {
        return this.currentAngle;
    }
}
