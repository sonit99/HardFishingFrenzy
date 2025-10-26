const { ccclass, property, menu } = cc._decorator;

enum ShakeDirection {
    Horizontal = 0,
    Vertical = 1,
    Both = 2,
}

@ccclass
@menu("Effects/ButtonShakeAuto")
export default class ButtonShakeAuto extends cc.Component {
    @property({ tooltip: "Biên độ rung ban đầu (px)" })
    amplitude: number = 10;

    @property({ tooltip: "Tần số rung (Hz)" })
    frequency: number = 20;

    @property({ tooltip: "Thời gian rung mỗi lần (giây)" })
    duration: number = 0.6;

    @property({ tooltip: "Tốc độ giảm biên độ (càng cao càng nhanh dừng)" })
    decayRate: number = 3;

    @property({ tooltip: "Tự rung lại sau mỗi bao nhiêu giây" })
    interval: number = 3;

    @property({ type: cc.Enum(ShakeDirection), tooltip: "Hướng rung" })
    direction: ShakeDirection = ShakeDirection.Horizontal;

    private basePos: cc.Vec2 = cc.v2();
    private elapsed: number = 0;
    private shaking: boolean = false;

    onLoad() {
        this.basePos = this.node.getPosition();
        this.schedule(this.startShake, this.interval);
        this.startShake(); // rung ngay lúc khởi động
    }

    startShake() {
        this.elapsed = 0;
        this.shaking = true;
    }

    update(dt: number) {
        if (!this.shaking) return;

        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.shaking = false;
            this.node.setPosition(this.basePos);
            return;
        }

        const decay = Math.exp(-this.decayRate * this.elapsed);
        const oscillation = Math.sin(this.elapsed * this.frequency * Math.PI * 2) * this.amplitude * decay;

        let offsetX = 0, offsetY = 0;
        switch (this.direction) {
            case ShakeDirection.Horizontal:
                offsetX = oscillation;
                break;
            case ShakeDirection.Vertical:
                offsetY = oscillation;
                break;
            case ShakeDirection.Both:
                offsetX = oscillation * 0.8;
                offsetY = Math.cos(this.elapsed * this.frequency * Math.PI * 2) * this.amplitude * 0.8 * decay;
                break;
        }

        this.node.setPosition(this.basePos.x + offsetX, this.basePos.y + offsetY);
    }
}
