import Phaser from "phaser";
import { drawDistortedFace } from "../game/faceArt.js";

const SCARE_DURATION_MS = 1550;

export class JumpscareScene extends Phaser.Scene {
  constructor() {
    super("jumpscare");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#000000");

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a, 1);
    drawDistortedFace(this, width / 2, height / 2, { scale: 1, jitter: true, withWarps: true });
    this.playScreech();

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.18,
      duration: 120,
      yoyo: true,
      repeat: 7,
      ease: "Sine.easeInOut",
    });

    this.time.delayedCall(SCARE_DURATION_MS, () => {
      this.scene.start("end", { outcome: "caught" });
    });
  }

  playScreech() {
    const ctx = this.sound.context;
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const duration = 1.05;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.95, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(ctx.destination);

    const throatBus = ctx.createGain();
    throatBus.gain.setValueAtTime(0.72, now);

    const formantA = ctx.createBiquadFilter();
    formantA.type = "bandpass";
    formantA.Q.setValueAtTime(7, now);
    formantA.frequency.setValueAtTime(820, now);
    formantA.frequency.linearRampToValueAtTime(620, now + 0.26);
    formantA.frequency.linearRampToValueAtTime(460, now + 0.7);

    const formantB = ctx.createBiquadFilter();
    formantB.type = "bandpass";
    formantB.Q.setValueAtTime(9, now);
    formantB.frequency.setValueAtTime(1450, now);
    formantB.frequency.linearRampToValueAtTime(980, now + 0.33);
    formantB.frequency.linearRampToValueAtTime(780, now + 0.78);

    const growlDistort = ctx.createWaveShaper();
    growlDistort.curve = this.createDistortionCurve(360);
    growlDistort.oversample = "4x";

    throatBus.connect(formantA);
    throatBus.connect(formantB);
    formantA.connect(growlDistort);
    formantB.connect(growlDistort);
    growlDistort.connect(master);

    const growl1 = ctx.createOscillator();
    growl1.type = "sawtooth";
    growl1.frequency.setValueAtTime(260, now);
    growl1.frequency.exponentialRampToValueAtTime(112, now + duration);

    const growl2 = ctx.createOscillator();
    growl2.type = "square";
    growl2.frequency.setValueAtTime(390, now);
    growl2.frequency.exponentialRampToValueAtTime(148, now + duration * 0.95);

    const growl3 = ctx.createOscillator();
    growl3.type = "triangle";
    growl3.frequency.setValueAtTime(520, now);
    growl3.frequency.exponentialRampToValueAtTime(205, now + duration * 0.7);

    const throatEnv = ctx.createGain();
    throatEnv.gain.setValueAtTime(0.0001, now);
    throatEnv.gain.exponentialRampToValueAtTime(0.92, now + 0.018);
    throatEnv.gain.exponentialRampToValueAtTime(0.44, now + 0.32);
    throatEnv.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    growl1.connect(throatEnv);
    growl2.connect(throatEnv);
    growl3.connect(throatEnv);
    throatEnv.connect(throatBus);

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      const t = i / noiseData.length;
      const rasp = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      noiseData[i] = (Math.random() * 2 - 1) * rasp;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseBand = ctx.createBiquadFilter();
    noiseBand.type = "bandpass";
    noiseBand.frequency.setValueAtTime(2400, now);
    noiseBand.frequency.exponentialRampToValueAtTime(1200, now + duration);
    noiseBand.Q.setValueAtTime(0.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.84, now + 0.014);
    noiseGain.gain.exponentialRampToValueAtTime(0.24, now + 0.4);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(noiseBand);
    noiseBand.connect(noiseGain);
    noiseGain.connect(master);

    const plosive = ctx.createOscillator();
    plosive.type = "sine";
    plosive.frequency.setValueAtTime(96, now);
    plosive.frequency.exponentialRampToValueAtTime(42, now + 0.22);

    const plosiveGain = ctx.createGain();
    plosiveGain.gain.setValueAtTime(0.0001, now);
    plosiveGain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
    plosiveGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    plosive.connect(plosiveGain);
    plosiveGain.connect(master);

    growl1.start(now);
    growl2.start(now);
    growl3.start(now);
    noise.start(now);
    plosive.start(now);

    growl1.stop(now + duration);
    growl2.stop(now + duration);
    growl3.stop(now + duration);
    noise.stop(now + duration);
    plosive.stop(now + 0.24);
  }

  createDistortionCurve(amount = 200) {
    const samples = 44100;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }
}
