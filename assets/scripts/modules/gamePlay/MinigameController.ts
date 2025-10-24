const { ccclass, property } = cc._decorator;

@ccclass
export default class MiniGameController extends cc.Component {
  @property(cc.Node)
  bar: cc.Node = null;

  @property(cc.Node)
  greenZone: cc.Node = null;

  @property(cc.Node)
  arrow: cc.Node = null;

  @property(cc.Node)
  bg: cc.Node = null;

  private arrowSpeed: number = 100; // pixel/giây
  private direction: number = 1;
  private maxLives: number = 1;
  private lives: number = 1;
  private progress: number = 0;
  private hitsToWin: number = 1;
  private isRunning: boolean = false;

  private greenStartX: number = 0;
  private greenEndX: number = 0;

  /** difficulty: càng cao => vùng xanh nhỏ, mũi tên nhanh */
  startMiniGame(difficulty: number = 1, worldPos?: cc.Vec2) {
    // this.node.active = true;
    this.bg.on(cc.Node.EventType.TOUCH_START, this.onTouch, this);
    this.isRunning = true;
    this.lives = this.maxLives;
    this.progress = 0;

    // 🧭 Đặt vị trí dưới con cá
    if (worldPos) {
      const uiPos = this.node.parent.convertToNodeSpaceAR(worldPos);
      this.node.setPosition(uiPos.x, uiPos.y - 80); // offset xuống 80px
    }

    // vùng xanh giữa
    const totalWidth = this.bar.width;
    const greenWidth = totalWidth / (3 * difficulty); // càng hiếm càng nhỏ
    const centerX = 0;
    this.greenZone.width = greenWidth;
    this.greenZone.x = centerX;

    this.greenStartX = this.greenZone.x - greenWidth / 2;
    this.greenEndX = this.greenZone.x + greenWidth / 2;

    this.arrow.x = -totalWidth / 2;
    this.direction = 1;
    this.arrowSpeed = 300 * difficulty;

    cc.log("🎯 MiniGame started with difficulty:", difficulty);
  }

  update(dt: number) {
    if (!this.isRunning) return;

    const totalWidth = this.bar.width;
    this.arrow.x += this.direction * this.arrowSpeed * dt;

    // Đảo chiều khi chạm biên
    if (this.arrow.x > totalWidth / 2) {
      this.arrow.x = totalWidth / 2;
      this.direction = -1;
    } else if (this.arrow.x < -totalWidth / 2) {
      this.arrow.x = -totalWidth / 2;
      this.direction = 1;
    }
  }

  /** Người chơi ấn khi mũi tên đang ở đâu */
  onTouch() {
    if (!this.isRunning) return;

    const x = this.arrow.x;
    if (x >= this.greenStartX && x <= this.greenEndX) {
      // ✅ Right
      this.progress++;
      cc.log(`✅ Hit! Progress: ${this.progress}/${this.hitsToWin}`);

      // 🔥 Emit event để GamePlayMgr biết
      this.node.emit("MiniGameProgress", this.progress / this.hitsToWin, this.lives / this.maxLives);
      
      if (this.progress >= this.hitsToWin) {
        this.win();
      }
    } else {
      // ❌ Wrong
      this.lives--;
      cc.log(`❌ Miss! Lives: ${this.lives}/${this.maxLives}`);
      // 🔥 Emit event để GamePlayMgr biết
      this.node.emit("MiniGameMiss", (this.maxLives - this.lives) / this.maxLives);
      if (this.lives <= 0) {
        this.fail();
      }
    }
  }

  win() {
    // cc.log("🏆 Fish caught successfully!");
    this.node.emit("MiniGameWin");
    this.stop();
  }

  fail() {
    // cc.log("💥 Line snapped! Fish escaped!");
    this.node.emit("MiniGameFail");
    this.stop();
  }

  stop() {
    this.isRunning = false;
    this.bg.off(cc.Node.EventType.TOUCH_START, this.onTouch, this);
    this.node.active = false;
  }
}
