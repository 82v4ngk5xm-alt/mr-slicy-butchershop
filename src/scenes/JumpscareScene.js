import Phaser from "phaser";
import { GAME } from "../game/constants.js";
import { drawBloodyDistortedFace } from "../game/faceArt.js";

const SCARE_DURATION_MS = 1550;
const EXTERNAL_JUMPSCARE_KEY = "external-jumpscare";
const CUSTOM_JUMPSCARE_KEY = "custom-jumpscare";

export class JumpscareScene extends Phaser.Scene {
  constructor() {
    super("jumpscare");
  }

  preload() {
    const customUrl = GAME.audio?.customJumpscareUrl?.trim();
    if (customUrl) {
      this.load.audio(CUSTOM_JUMPSCARE_KEY, [customUrl]);
    }

    this.load.audio(EXTERNAL_JUMPSCARE_KEY, ["/audio/fnaf-jumpscare.mp3"]);
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#000000");

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a, 1);
    drawBloodyDistortedFace(this, width / 2, height / 2, {
      scale: 1,
      jitter: true,
      withWarps: true,
      baseAlpha: 1,
    });
    this.playJumpscareAudio();

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

  playJumpscareAudio() {
    const hasCustom = this.cache.audio.exists(CUSTOM_JUMPSCARE_KEY);
    const hasExternal = this.cache.audio.exists(EXTERNAL_JUMPSCARE_KEY);

    this.sound.stopAll();

    if (hasCustom) {
      this.sound.play(CUSTOM_JUMPSCARE_KEY, { volume: 1 });
      return;
    }

    if (hasExternal) {
      this.sound.play(EXTERNAL_JUMPSCARE_KEY, { volume: 1 });
      return;
    }

    this.playScreech();
  }

  playScreech() {
    const ctx = this.sound.context;
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const duration = 1.35;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(1, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(ctx.destination);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-22, now);
    comp.knee.setValueAtTime(14, now);
    comp.ratio.setValueAtTime(16, now);
    comp.attack.setValueAtTime(0.002, now);
    comp.release.setValueAtTime(0.22, now);
    comp.connect(master);

    const drive = ctx.createWaveShaper();
    drive.curve = this.createDistortionCurve(240);
    drive.oversample = "4x";
    drive.connect(comp);

    const voiceBus = ctx.createGain();
    voiceBus.gain.setValueAtTime(0.95, now);
    voiceBus.connect(drive);

    const throatA = ctx.createOscillator();
    throatA.type = "sawtooth";
    throatA.frequency.setValueAtTime(520, now);
    throatA.frequency.exponentialRampToValueAtTime(340, now + 0.24);
    throatA.frequency.exponentialRampToValueAtTime(230, now + duration);

    const throatB = ctx.createOscillator();
    throatB.type = "triangle";
    throatB.frequency.setValueAtTime(760, now);
    throatB.frequency.exponentialRampToValueAtTime(410, now + 0.35);
    throatB.frequency.exponentialRampToValueAtTime(260, now + duration);

    const detuneLfo = ctx.createOscillator();
    detuneLfo.type = "sine";
    detuneLfo.frequency.setValueAtTime(7.6, now);

    const detuneDepth = ctx.createGain();
    detuneDepth.gain.setValueAtTime(15, now);
    detuneDepth.gain.exponentialRampToValueAtTime(6, now + duration);
    detuneLfo.connect(detuneDepth);
    detuneDepth.connect(throatA.detune);

    const voiceEnv = ctx.createGain();
    voiceEnv.gain.setValueAtTime(0.0001, now);
    voiceEnv.gain.exponentialRampToValueAtTime(0.92, now + 0.012);
    voiceEnv.gain.exponentialRampToValueAtTime(0.58, now + 0.28);
    voiceEnv.gain.exponentialRampToValueAtTime(0.18, now + 0.9);
    voiceEnv.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const formantA = ctx.createBiquadFilter();
    formantA.type = "bandpass";
    formantA.Q.setValueAtTime(8, now);
    formantA.frequency.setValueAtTime(820, now);
    formantA.frequency.linearRampToValueAtTime(660, now + 0.5);

    const formantB = ctx.createBiquadFilter();
    formantB.type = "bandpass";
    formantB.Q.setValueAtTime(10, now);
    formantB.frequency.setValueAtTime(1320, now);
    formantB.frequency.linearRampToValueAtTime(1080, now + 0.55);

    throatA.connect(voiceEnv);
    throatB.connect(voiceEnv);
    voiceEnv.connect(formantA);
    voiceEnv.connect(formantB);
    formantA.connect(voiceBus);
    formantB.connect(voiceBus);

    const hitNoiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
    const hitData = hitNoiseBuffer.getChannelData(0);
    for (let i = 0; i < hitData.length; i += 1) {
      const t = i / hitData.length;
      hitData[i] = (Math.random() * 2 - 1) * (1 - t);
    }

    const hitNoise = ctx.createBufferSource();
    hitNoise.buffer = hitNoiseBuffer;

    const hitBand = ctx.createBiquadFilter();
    hitBand.type = "highpass";
    hitBand.frequency.setValueAtTime(1800, now);

    const hitGain = ctx.createGain();
    hitGain.gain.setValueAtTime(0.0001, now);
    hitGain.gain.exponentialRampToValueAtTime(0.85, now + 0.004);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    hitNoise.connect(hitBand);
    hitBand.connect(hitGain);
    hitGain.connect(comp);

    const breathBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const breathData = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathData.length; i += 1) {
      const t = i / breathData.length;
      const env = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85);
      breathData[i] = (Math.random() * 2 - 1) * env;
    }

    const breath = ctx.createBufferSource();
    breath.buffer = breathBuffer;

    const breathBand = ctx.createBiquadFilter();
    breathBand.type = "bandpass";
    breathBand.frequency.setValueAtTime(2600, now);
    breathBand.frequency.exponentialRampToValueAtTime(1400, now + duration);
    breathBand.Q.setValueAtTime(0.7, now);

    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.0001, now);
    breathGain.gain.exponentialRampToValueAtTime(0.48, now + 0.02);
    breathGain.gain.exponentialRampToValueAtTime(0.18, now + 0.55);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    breath.connect(breathBand);
    breathBand.connect(breathGain);
    breathGain.connect(drive);

    const ring = ctx.createOscillator();
    ring.type = "sine";
    ring.frequency.setValueAtTime(2680, now + 0.24);
    ring.frequency.exponentialRampToValueAtTime(1880, now + duration);

    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.0001, now);
    ringGain.gain.exponentialRampToValueAtTime(0.22, now + 0.27);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    ring.connect(ringGain);
    ringGain.connect(comp);

    throatA.start(now);
    throatB.start(now);
    detuneLfo.start(now);
    hitNoise.start(now);
    breath.start(now);
    ring.start(now + 0.24);

    throatA.stop(now + duration);
    throatB.stop(now + duration);
    detuneLfo.stop(now + duration);
    hitNoise.stop(now + 0.18);
    breath.stop(now + duration);
    ring.stop(now + duration);
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
