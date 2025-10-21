export class SoundUtil{

    static UI_SFX_Path:string = "resources/sounds/ui/%s";
    static Skill_SFX_Path:string = "resources/sounds/skill/%s";
    static BG_Music_Path:string = "resources/sounds/%s";
    static CV_SFX_Path:string = "resources/sounds/cv/%s";

    static playMusic(url:string):void{
        cc.resources.load(url, cc.AudioClip, function (err, clip:cc.AudioClip) {
            cc.audioEngine.playMusic(clip, true);
        });
    }
    
    static playEffect(url:string):void{
        cc.resources.load(url, cc.AudioClip, function (err, clip:cc.AudioClip) {
            cc.audioEngine.playEffect(clip, false);
        });
    }
    
    static playClick():void{
        SoundUtil.playEffect("sound/dianji");
    }
    
    static playBtnCloseEffect():void{
        SoundUtil.playEffect("sound/UI_qh");
    }
    
    static playGainGoods():void{
        SoundUtil.playEffect("sound/getitem");
    }
    
    static playGainGoodsEffectNew():void{
        SoundUtil.playEffect("sound/sound_getitem");
    }

    static playSkillSFX(t:string, finishCbFunc?:Function, loadedFunc?:Function) {
        if (null == t || "" == t) return false;
        let fullPath = cc.js.formatStr(SoundUtil.Skill_SFX_Path,t);
        return SoundUtil.play(fullPath, false, finishCbFunc,loadedFunc);
    }

    static play(fullPath:string,isLoop:boolean,finishCbFunc?:Function,loadedFunc?:Function){
        cc.resources.load(fullPath, cc.AudioClip, function (err, clip:cc.AudioClip) {
            let audioId = cc.audioEngine.playEffect(clip, isLoop);
            loadedFunc(audioId);
            if(finishCbFunc != null){
                cc.audioEngine.setFinishCallback(audioId,function(){
                    finishCbFunc();
                });
            }
        });
    }

}
