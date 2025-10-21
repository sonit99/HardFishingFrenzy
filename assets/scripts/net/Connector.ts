
const { ccclass, property } = cc._decorator;

const ServerListMap = {
  0: "27.72.105.113",
  1: "127.0.0.1",
};

const LOGIN_PORT = {
  0: 8700,
  1: 0,
}

enum HOST_NAME_LIST {
  "IP Công Ty",
  "localhost"
}

@ccclass
export class Connector extends cc.Component {
  public static instance: Connector = null;

  @property
  is_ssl: boolean = false;

  @property({
    type: cc.Enum(HOST_NAME_LIST)
  })
  login_host = 0;

  onLoad(): void {
    Connector.instance = this;
    // let is_ssl = true;
    // let wsProtocol = is_ssl ? "wss" : "ws";
    // let socketUr = wsProtocol + "://" + "27.72.105.113" + is_ssl ? "" : "8700" + "/ws";
    // Connector.instance.SSL = this.is_ssl;
    // Connector.instance.HOST = ServerListMap[this.login_host];
    // Connector.instance.PORT = LOGIN_PORT[this.login_host];
  }

  // onDisconnected(code) {
  //   super.onDisconnected(code);
  // }

  // onFinishConnect(success: boolean) {
  //   super.onFinishConnect(success);
  //   if (success) {
  //     //   this.sendLogin();
  //     this.schedule(this.rewindDisconnectDetector);
  //   } else {
  //     this.unschedule(this.rewindDisconnectDetector);
  //   }
  // }
}
