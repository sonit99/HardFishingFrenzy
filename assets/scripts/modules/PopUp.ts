const { ccclass, property } = cc._decorator;

export enum PopUpState {
    LEVEL_SELECT = 0,
    BOOST = 1,
    CONTINUE1 = 2,
    CONTINUE2 = 3,
    FAIL = 4,
}

const listActive = [[false, true, true, false, false, false, true, false],
                    [false, false, false, true, true, true, true, true],
                    [false, false, false, true, false, false, true, true],
                    [false, false, false, true, false, false, true, true],
                    [true, false, true, false, true, true, true, true]]
@ccclass
export default class PopUp extends cc.Component {

    @property(cc.Node)
    nFail: cc.Node = null;

    @property(cc.Node)
    nScore: cc.Node = null;

    @property(cc.Node)
    nItemBuy: cc.Node = null;

    @property(cc.Node)
    nItemGet: cc.Node = null;

    @property(cc.Node)
    nDescrib: cc.Node = null;

    @property(cc.Node)
    nExtra: cc.Node = null;

    @property(cc.Button)
    btnFree: cc.Button = null;

    @property(cc.Button)
    btnNotFree: cc.Button = null;

    // ===============================================

    openPopUp(state: PopUpState.LEVEL_SELECT) {
        let list = listActive[state];
        this.nFail.active = list[0];
        this.nScore.active = list[1];
        this.nItemBuy.active = list[2];
        this.nItemGet.active = list[3];
        this.nDescrib.active = list[4];
        this.nExtra.active = list[5];
        this.btnFree.node.active = list[6];
        this.btnNotFree.node.active = list[7];
        switch (state) {
            case PopUpState.LEVEL_SELECT:

                break;

            default:
                break;
        }
    }
}
