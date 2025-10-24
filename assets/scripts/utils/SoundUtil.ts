const { ccclass, property } = cc._decorator;

@ccclass
export default class SoundUtil {
  static instance: SoundUtil = null;

  onLoad() {
    SoundUtil.instance = this;
  }

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
      cc.audioEngine.setCurrentTime(audioId, forward);
    }
  }

  playEffectLoop(id: number): void {
    let clip = this.listSound[id];
    if (clip) {
      cc.audioEngine.playEffect(clip, true);
    }
  }
}
