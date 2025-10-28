const {ccclass, property} = cc._decorator;

@ccclass
export default class Common {
    static randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
