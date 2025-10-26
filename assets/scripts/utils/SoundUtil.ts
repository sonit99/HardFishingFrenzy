import { DataManager } from "../manager/DataMgr";

const { ccclass, property } = cc._decorator;

export const SFX = {
  LaunchHook: "LaunchHook",
  HookTouchWater: "HookTouchWater",
  FishBite: "FishBite",
  PullLine: "PullLine",
  LineSnap: "LineSnap",
  Click: "Click",
  FishFlounder: "FishFlounder",
  SmallWave: "SmallWave",
  BigWave: "BigWave",
  RoaringWind: "RoaringWind",
  Whale: "Whale",
  Rain: "Rain",
  Thunder: "Thunder",
  Warning: "Warning",
  Success1: "Success1",
  Success2: "Success2",
  Sell: "Sell",
} as const;

export const BGM = {
  SunshineBeach: "SunshineBeach",
  AtlantisOcean: "AtlantisOcean",
  Lobby: "Lobby",
} as const;

@ccclass
export default class SoundUtil extends cc.Component {
  static instance: SoundUtil = null;

  private listSFX: { [key: string]: cc.AudioClip } = {};
  private listBGM: { [key: string]: cc.AudioClip } = {};
  private _currentBGM: string = null;

  async onLoad() {
    SoundUtil.instance = this;
  }

  /** 🎵 Phát nhạc nền theo tên trong paths.json */
  async playBGM(name: string): Promise<void> {
    let clip = this.listBGM[name];
    if (!clip) {
      await DataManager.instance.getClip(name).then((audioClip) => {
        if (audioClip) {
          clip = this.listBGM[name] = audioClip;
        } else {
          cc.warn(`[SoundUtil] BGM not found: ${name}`);
          return;
        }
      });
    }
    if (this._currentBGM) {
      cc.audioEngine.stopMusic();
    }
    this._currentBGM = name;
    cc.audioEngine.playMusic(clip, true);
  }

  /** 💥 Phát hiệu ứng */
  async playSFX(
    name: string,
    isLoop: boolean = false,
    volume: number = 1,
    forward: number = 0
  ): Promise<void> {
    let clip = this.listSFX[name];
    if (!clip) {
      await DataManager.instance.getClip(name).then((audioClip) => {
        if (audioClip) {
          clip = this.listSFX[name] = audioClip;
        } else {
          cc.warn(`[SoundUtil] BGM not found: ${name}`);
          return;
        }
      });
    }
    const id = cc.audioEngine.playEffect(clip, isLoop);
    cc.audioEngine.setVolume(id, volume);
    cc.audioEngine.setCurrentTime(id, forward);
  }
}
