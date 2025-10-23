const { ccclass, property } = cc._decorator;

@ccclass
export default class SoundUtil extends cc.Component {
  static instance: SoundUtil = null;

  onLoad() {
    SoundUtil.instance = this;
  }

  @property(cc.AudioClip)
  listBGM: cc.AudioClip[] = [];

  @property(cc.AudioClip)
  listSound: cc.AudioClip[] = [];

  playMusic(id: number): void {
    if (this.listBGM[id]) {
      cc.audioEngine.playMusic(this.listBGM[id], true);
    }
  }

  playEffect(id: number, forward: number = 0): void {
    let clip = this.listSound[id];
    if (clip) {
      let audioId = cc.audioEngine.playEffect(clip, false);
      // Sau khi audio bắt đầu, nhảy đến 1 giây
      this.scheduleOnce(() => {
        cc.audioEngine.setCurrentTime(audioId, forward);
      }, 0);
    }
  }

  playEffectLoop(id: number): void {
    let clip = this.listSound[id];
    if (clip) {
      cc.audioEngine.playEffect(clip, true);
    }

  // static play(fullPath:string,isLoop:boolean,finishCbFunc?:Function,loadedFunc?:Function){
  //     cc.resources.load(fullPath, cc.AudioClip, function (err, clip:cc.AudioClip) {
  //         let audioId = cc.audioEngine.playEffect(clip, isLoop);
  //         loadedFunc(audioId);
  //         if(finishCbFunc != null){
  //             cc.audioEngine.setFinishCallback(audioId,function(){
  //                 finishCbFunc();
  //             });
  //         }
  //     });
  // }
}
