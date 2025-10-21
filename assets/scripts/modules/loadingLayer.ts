
const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadingLayer extends cc.Component {

    @property(cc.Label)
    lab_tips: cc.Label = null;

    @property(cc.Label)
    lab_percent: cc.Label = null;

    @property(cc.ProgressBar)
    loading_progress: cc.ProgressBar = null;

    _oldProgress = 0;

    changeProgress(progressParam: number) {
        if (progressParam <= this._oldProgress) {
            return;
        }
        this.loading_progress.progress = progressParam;
        this.lab_percent.string = Math.floor(progressParam * 100) + "%";
        this._oldProgress = progressParam;
    }

}
