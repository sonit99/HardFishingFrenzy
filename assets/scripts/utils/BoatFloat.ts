const { ccclass, property } = cc._decorator;

@ccclass
export default class BoatFloat extends cc.Component {
    @property
    floatAmplitude: number = 10; // biên độ lên xuống

    @property
    floatSpeed: number = 1; // tốc độ dao động

    @property
    swayAmplitude: number = 3; // độ nghiêng trái phải (độ)

    @property
    swaySpeed: number = 0.8; // tốc độ nghiêng

    private baseY: number = 0;
    private time: number = 0;

    onLoad() {
        this.baseY = this.node.y;
    }

    update(dt: number) {
        this.time += dt;

        // Đung đưa nhẹ lên xuống
        const offsetY = Math.sin(this.time * this.floatSpeed * 2 * Math.PI) * this.floatAmplitude;
        this.node.y = this.baseY + offsetY;

        // Nghiêng nhẹ sang trái phải
        const angle = Math.sin(this.time * this.swaySpeed * 2 * Math.PI) * this.swayAmplitude;
        this.node.angle = angle;

        this.node.x += Math.sin(this.time * 0.2) * 0.1;
    }
}
