

  export interface ImpData {
    betAmount?: number;
    rateRed?: number;
    rateBlack?: number;
    rateHigher?: number;
    rateLower?: number;
    currentCardId?: number;
    currentCardRemain?: number;
    nextCardDrawId?: number;
    isEndGame?: boolean;
    currentUserMoney?: number;
    skipRound?: number;
    cashoutWin?: number;
    multiRed?: number;
    multiBlack?: number;
    multiHigher?: number;
    multiLower?: number;
  }

  export interface ImpHistory {
    cardID: number;
    typeSelected: number;
    multiple: number;
    type: number;
  }

  export interface ImpWallet {
    key: string;
    value: number;
  }

	// export interface S2CGetAnnounce {
	// 	content: string;
	// 	static id = 60;
	// }


  /////////////////////////////////
  export class Cmd {
    static SENDLOGIN = 51;
    static LOGIN = 51;
    static LOGOUT = 2;
    static DISCONNECTED = 37;
    static SENDGETANNOUNCE = 59;
    static GETANNOUNCE = 60;
    // static CMD_CHECK_GAME = 5001;
    // static CMD_GAME_INFO = 5002;
    // static CMD_5003 = 5003;
    // static CMD_ROUND_RESULT = 5004;
    // static CMD_TIME = 5005;
    // static CMD_SKIP_BET = 5006;
    // static CMD_CASH_OUT = 5007;
    // static CMD_HISTORY = 5008;
    // static CMD_CONFIRM_JOIN_ROOM = 5009;
    // static CMD_PLAYER_INFO = 5011;
    // static CMD_WIN_NOTI = 5015;
  }

  export class DEFINE_CHARACTER {
    static CLUBS_TWO = 0;
    static CLUBS_THREE = 1;
    static CLUBS_FOUR = 2;
    static CLUBS_FIVE = 3;
    static CLUBS_SIX = 4;
    static CLUBS_SEVEN = 5;
    static CLUBS_EIGHT = 6;
    static CLUBS_NINE = 7;
    static CLUBS_TEN = 8;
    static CLUBS_JACK = 9;
    static CLUBS_QUEEN = 10;
    static CLUBS_KING = 11;
    static CLUBS_ACE = 12;
    static DIAMONDS_TWO = 13;
    static DIAMONDS_THREE = 14;
    static DIAMONDS_FOUR = 15;
    static DIAMONDS_FIVE = 16;
    static DIAMONDS_SIX = 17;
    static DIAMONDS_SEVEN = 18;
    static DIAMONDS_EIGHT = 19;
    static DIAMONDS_NINE = 20;
    static DIAMONDS_TEN = 21;
    static DIAMONDS_JACK = 22;
    static DIAMONDS_QUEEN = 23;
    static DIAMONDS_KING = 24;
    static DIAMONDS_ACE = 25;
    static HEARTS_TWO = 26;
    static HEARTS_THREE = 27;
    static HEARTS_FOUR = 28;
    static HEARTS_FIVE = 29;
    static HEARTS_SIX = 30;
    static HEARTS_SEVEN = 31;
    static HEARTS_EIGHT = 32;
    static HEARTS_NINE = 33;
    static HEARTS_TEN = 34;
    static HEARTS_JACK = 35;
    static HEARTS_QUEEN = 36;
    static HEARTS_KING = 37;
    static HEARTS_ACE = 38;
    static SPADES_TWO = 39;
    static SPADES_THREE = 40;
    static SPADES_FOUR = 41;
    static SPADES_FIVE = 42;
    static SPADES_SIX = 43;
    static SPADES_SEVEN = 44;
    static SPADES_EIGHT = 45;
    static SPADES_NINE = 46;
    static SPADES_TEN = 47;
    static SPADES_JACK = 48;
    static SPADES_QUEEN = 49;
    static SPADES_KING = 50;
    static SPADES_ACE = 51;
  }









