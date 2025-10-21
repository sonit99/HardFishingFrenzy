export const COUNTRY = {
  VIETNAM: "vn",
  THAILAND: "tl",
  ENGLAND: "en",
  INDO: "id",
  MALAYSIA: "my",
  MYANMAR: "mm",
  GOFA: "gofa",
  INTERNATIONAL: "international",
};

export const LANGUAGE = {
  VIETNAMESE: "vn",
  ENGLISH: "en",
  MYANMAR: "mm",
  THAILAN: "tl",
  CAMBODIA: "cam",
};

export enum LABEL_FONT_SIZE_CONFIG {
  TITLE_POPUP,
  CONTENT_POPUP,
  BUTTON_POPUP,
  TITLE_MENU,
  CONTENT_MENU,
  NORMAL,
}

const Polyglot = require("polyglot");

const data_en = require("en");
const data_vn = require("vn");
const data_mm = require("mm");
const data_tl = require("tl");
const data_cam = require("cam");

let polyglot = new Polyglot({ phrases: data_en });


export class LanguageManager {

  public static defaultLang: string = LANGUAGE.ENGLISH;

  ///////////////////////////////////////////////////////////////////////////////

  public static init() {
    let data = LanguageManager.getCurrentLanguage();
    polyglot.replace(data);
  }

  public static getCurrentLanguage() {
    let l = null;
    switch (this.defaultLang) {
      case LANGUAGE.ENGLISH:
      default:
        l = data_en;
        break;

      case LANGUAGE.VIETNAMESE:
        l = data_vn;
        break;

      case LANGUAGE.CAMBODIA:
        l = data_cam;
        break;

      case LANGUAGE.THAILAN:
        l = data_tl;
        break;

      case LANGUAGE.MYANMAR:
        l = data_mm;
        break;

    }
    return l;
  }

  public static getString(key, opt: object = {}) {
    return polyglot.t(key, opt);
  }

  public static updateLocalization(language: string) {
    let data = require(language);
    polyglot.replace(data);
  }

  public static updateLang(fromIp: string = COUNTRY.ENGLAND) {
    switch (fromIp) {
      case COUNTRY.VIETNAM:
        LanguageManager.defaultLang = LANGUAGE.VIETNAMESE;
        break;
      case COUNTRY.ENGLAND:
        LanguageManager.defaultLang = LANGUAGE.ENGLISH;
        break;
      case COUNTRY.MYANMAR:
        LanguageManager.defaultLang = LANGUAGE.MYANMAR;
        break;
      default:
        LanguageManager.defaultLang = LANGUAGE.ENGLISH;
    }
    cc.error(LanguageManager.defaultLang);
    this.updateLocalization(LanguageManager.defaultLang);
  }
}
