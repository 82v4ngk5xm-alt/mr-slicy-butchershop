import Phaser from "phaser";
import { addLabel } from "../game/ui.js";
import { runState } from "../game/state.js";
import { drawDistortedFace } from "../game/faceArt.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create() {
    runState.reset();

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#050405");
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a090a, 1);

    this.faceNodes = drawDistortedFace(this, width * 0.36, height * 0.54, {
      scale: 1.35,
      jitter: true,
      withWarps: true,
      baseAlpha: 0.86,
    });

    this.addScanlines(width, height);
    this.addTitleUi(width, height);
    this.startStaticFlicker();
    this.startScaryChimeLoop();

    this.events.once("shutdown", () => this.stopScaryChimeLoop());
    this.events.once("destroy", () => this.stopScaryChimeLoop());

    this.input.keyboard.once("keydown-SPACE", () => {
      this.stopScaryChimeLoop();
      this.scene.start("delivery", { deliveryIndex: 0 });
    });
  }

  addScanlines(width, height) {
    const lines = this.add.graphics();
    lines.fillStyle(0x000000, 0.18);

    for (let y = 0; y < height; y += 4) {
      lines.fillRect(0, y, width, 2);
    }

    lines.setDepth(8);
    this.scanLines = lines;
  }

  addTitleUi(width, height) {
    const panelX = width * 0.63;

    const title = addLabel(this, panelX, 70, "MR. SLICEY\nBUTCHER SHOP", 52, "#f3d7d7");
    title.setDepth(10);
    title.setShadow(2, 2, "#350000", 3);

    const sub = addLabel(this, panelX, 196, "Night Delivery Shift", 21, "#d7c8c8");
    sub.setDepth(10);

    const controls = addLabel(
      this,
      panelX,
      248,
      "WASD / Arrows = move\nShift = sprint\nE = interact\nMouse click = freeze shot",
      18,
      "#d7d0d0"
    );
    controls.setDepth(10);

    const start = addLabel(this, panelX, height - 96, "Press SPACE to Start", 30, "#9af7d8");
    start.setDepth(10);

    this.tweens.add({
      targets: start,
      alpha: 0.28,
      yoyo: true,
      duration: 420,
      repeat: -1,
    });

    const warning = addLabel(this, panelX, height - 44, "He only moves when you move.", 14, "#ffb3b3");
    warning.setDepth(10);
  }

  startStaticFlicker() {
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const flash = Phaser.Math.Between(0, 100) < 14;

        this.cameras.main.setAlpha(flash ? 0.86 : 1);

        if (this.scanLines) {
          this.scanLines.alpha = flash ? 0.3 : 0.18;
        }

        if (this.faceNodes) {
          const faceAlpha = flash ? 0.65 : 0.86;
          this.faceNodes.forEach((node) => node.setAlpha(faceAlpha));
        }
      },
    });
  }

  startScaryChimeLoop() {
    const ctx = this.sound.context;
    if (!ctx) {
      return;
    }

    this.titleMusicCtx = ctx;
    this.titleMusicNextAt = ctx.currentTime + 0.08;

    this.titleMusicTimer = this.time.addEvent({
      delay: 340,
      loop: true,
      callback: () => this.scheduleChimeStep(),
    });
  }

  scheduleChimeStep() {
    if (!this.titleMusicCtx) {
      return;
    }

    const minorNotes = [
      523.25, // C5
      587.33, // D5
      622.25, // Eb5
      698.46, // F5
      783.99, // G5
      830.61, // Ab5
      987.77, // B5
    ];

    const choose = () => Phaser.Utils.Array.GetRandom(minorNotes);

    const now = this.titleMusicCtx.currentTime;
    const t0 = Math.max(now + 0.02, this.titleMusicNextAt);

    this.playGlockChime(choose(), t0, 0.95, 0.18);

    if (Phaser.Math.Between(0, 100) < 65) {
      const interval = Phaser.Math.Between(2, 5) / 12;
      this.playGlockChime(choose() * Math.pow(2, interval), t0 + 0.11, 0.5, 0.13);
    }

    this.titleMusicNextAt = t0 + 0.34;
  }

  playGlockChime(freq, startAt, volume = 0.8, duration = 0.2) {
    const ctx = this.titleMusicCtx;
    if (!ctx) {
      return;
    }

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, startAt);
    master.gain.exponentialRampToValueAtTime(volume * 0.17, startAt + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + 0.45);
    master.connect(ctx.destination);

    const partials = [1, 2.72, 4.18];
    const gains = [1, 0.42, 0.22];

    partials.forEach((ratio, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq * ratio, startAt);

      const tone = ctx.createGain();
      tone.gain.setValueAtTime(0.0001, startAt);
      tone.gain.exponentialRampToValueAtTime(volume * gains[index], startAt + 0.008);
      tone.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + 0.16 + index * 0.1);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(3800 - index * 800, startAt);

      osc.connect(lp);
      lp.connect(tone);
      tone.connect(master);

      osc.start(startAt);
      osc.stop(startAt + duration + 0.26 + index * 0.08);
    });
  }

  stopScaryChimeLoop() {
    if (this.titleMusicTimer) {
      this.titleMusicTimer.remove(false);
      this.titleMusicTimer = null;
    }

    this.titleMusicCtx = null;
    this.titleMusicNextAt = 0;
  }
}
