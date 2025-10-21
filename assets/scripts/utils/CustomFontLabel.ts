
const {ccclass, property} = cc._decorator;

@ccclass
export default class CustomFontLabel extends cc.Label {

    static readonly mapFonts : Map<string, cc.TTFFont> = new Map();
    static lang: string = 'en';
    private defaultCacheMode : cc.Label.CacheMode = cc.Label.CacheMode.NONE;

    onLoad () {
        this.defaultCacheMode = this.cacheMode;
    }

    start () {
        if (CustomFontLabel.lang === 'km') this.cacheMode = cc.Label.CacheMode.NONE;
        else this.cacheMode = this.defaultCacheMode;
        this.font = CustomFontLabel.mapFonts.get(CustomFontLabel.lang) || this.font;
        this.useSystemFont = false;
    }

}
