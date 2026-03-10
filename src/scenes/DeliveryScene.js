import Phaser from "phaser";
import { DELIVERIES, GAME } from "../game/constants.js";
import { runState } from "../game/state.js";
import { addLabel } from "../game/ui.js";
import { ensureBloodyFaceTexture, ensureFaceTexture } from "../game/faceArt.js";
import { ensureDeliveryGuyTexture } from "../game/characterArt.js";

const WALL_THICKNESS = 30;
const INTERACT_DISTANCE = 44;
const UI_PANEL_WIDTH = 300;
const PLAY_MARGIN = 24;

const SHOT = {
  speed: 390,
  cooldownMs: 320,
  radius: 5,
  freezeDurationMs: 10000,
};

export class DeliveryScene extends Phaser.Scene {
  constructor() {
    super("delivery");
  }

  create(data) {
    this.deliveryIndex = data?.deliveryIndex ?? 0;
    this.delivery = DELIVERIES[this.deliveryIndex];
    this.playBounds = this.getPlayBounds();
    this.isLevelTwoPlus = this.delivery.id >= 2;

    this.hasDelivered = false;
    this.hasKey = false;
    this.switchesActive = 0;
    this.isExitUnlocked = false;

    this.attackerActive = false;
    this.didPlayerMove = false;
    this.lastShotAt = 0;
    this.attackerFrozenUntil = 0;

    this.interactKey = this.input.keyboard.addKey("E");
    this.keys = this.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
      downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    this.createRoom();
    this.createActors();
    this.createObjectives();
    this.createUi();
    this.configureCollisions();
    this.startAmbientEvents();
    this.startInGameAudio();

    this.input.mouse.disableContextMenu();

    this.events.once("shutdown", () => this.stopInGameAudio());
    this.events.once("destroy", () => this.stopInGameAudio());

    this.input.on("pointerdown", this.fireSlowShot, this);
  }

  createRoom() {
    const { height } = this.scale;
    const { left, right, top, bottom, centerX, centerY, width: playWidth, height: playHeight } =
      this.playBounds;

    this.walls = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    this.uiPanel = this.add.rectangle(UI_PANEL_WIDTH / 2, height / 2, UI_PANEL_WIDTH, height, 0x201620);
    this.uiPanel.setStrokeStyle(3, 0x5a3d52);

    this.makeStaticRect(centerX, top, playWidth, WALL_THICKNESS, GAME.colors.wall, this.walls);
    this.makeStaticRect(centerX, bottom, playWidth, WALL_THICKNESS, GAME.colors.wall, this.walls);
    this.makeStaticRect(left, centerY, WALL_THICKNESS, playHeight, GAME.colors.wall, this.walls);
    this.makeStaticRect(right, centerY, WALL_THICKNESS, playHeight, GAME.colors.wall, this.walls);

    const floor = this.add.rectangle(centerX, centerY, playWidth - 40, playHeight - 40, GAME.colors.floor);
    floor.setDepth(-2);

    if (this.isLevelTwoPlus) {
      this.addBloodSplatters();
    }

    this.makeStaticRect(left + 135, top + 165, 80, 40, GAME.colors.crate, this.crates);
    this.makeStaticRect(left + 270, top + 300, 110, 40, GAME.colors.crate, this.crates);
    this.makeStaticRect(right - 150, top + 180, 70, 80, GAME.colors.crate, this.crates);
    this.makeStaticRect(right - 85, bottom - 100, 120, 40, GAME.colors.crate, this.crates);

    this.exitDoor = this.makeStaticRect(right - 8, centerY, 18, 120, GAME.colors.exitClosed, null);
  }

  makeStaticRect(x, y, w, h, color, targetGroup) {
    const rect = this.add.rectangle(x, y, w, h, color);
    this.physics.add.existing(rect, true);
    if (targetGroup) targetGroup.add(rect);
    return rect;
  }

  makeDynamicRect(x, y, w, h, color) {
    const rect = this.add.rectangle(x, y, w, h, color);
    this.physics.add.existing(rect, false);
    return rect;
  }

  createActors() {
    const { left, right, centerY, top } = this.playBounds;

    const playerTexture = ensureDeliveryGuyTexture(this);
    this.player = this.physics.add.image(left + 48, centerY, playerTexture);
    this.player.setDisplaySize(28, 28);
    this.player.body.setSize(18, 20, true);
    this.player.body.setCollideWorldBounds(true);

    const attackerTexture = this.isLevelTwoPlus
      ? ensureBloodyFaceTexture(this)
      : ensureFaceTexture(this);
    this.attacker = this.physics.add.image(right - 52, top + 52, attackerTexture);
    this.attacker.setDisplaySize(36, 36);
    this.attacker.body.setSize(28, 28, true);
    this.attacker.setCollideWorldBounds(true);

    this.baseAttackerSpeed = GAME.speed.hunter + this.delivery.hunterSpeedBoost;
    this.applyAttackerEscalationStyle();
    this.createAttackerBloodAura();

    this.addWorldLabel(this.attacker.x, this.attacker.y - 32, "Old Man");
  }

  createObjectives() {
    const { left, right, top, bottom, centerY } = this.playBounds;

    this.deliverySpot = this.makeStaticRect(left + 116, top + 72, 22, 22, 0xb4e4b4, null);
    this.addWorldLabel(this.deliverySpot.x, this.deliverySpot.y - 24, "Counter");

    this.keyItem = this.makeStaticRect(right - 56, top + 42, 14, 14, GAME.colors.key, null);
    this.addWorldLabel(this.keyItem.x, this.keyItem.y - 20, "Key");

    this.switches = [
      this.createSwitch(left + 130, bottom - 34, "Switch A"),
      this.createSwitch(left + 380, top + 44, "Switch B"),
      this.createSwitch(right - 62, centerY + 8, "Switch C"),
    ];

    this.addWorldLabel(this.exitDoor.x - 8, this.exitDoor.y - 76, "Exit Door");
  }

  createSwitch(x, y, label) {
    const zone = this.makeStaticRect(x, y, 24, 24, GAME.colors.switchOff, null);
    zone.setStrokeStyle(2, 0x111111);
    zone.setInteractive({ useHandCursor: true });

    const entry = { zone, active: false };

    zone.on("pointerdown", () => {
      this.lastSwitchClickAt = this.time.now;
      this.activateSwitch(entry);
    });

    this.addWorldLabel(x, y - 20, label);
    return entry;
  }

  addWorldLabel(x, y, text) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Courier New",
      fontSize: "12px",
      color: "#f3dada",
      backgroundColor: "#2f1f2f",
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    });
    label.setOrigin(0.5);
    this.styleDistortedText(label, { strong: false });
    return label;
  }

  createUi() {
    const panelWrap = UI_PANEL_WIDTH - 36;

    const titleLabel = addLabel(this, 18, 14, this.delivery.title, 20, "#ffcdcd");
    titleLabel.setWordWrapWidth(panelWrap, true);

    const storyLabel = addLabel(this, 18, 44, `"${this.delivery.intro}"`, 14, "#edd2d2");
    storyLabel.setWordWrapWidth(panelWrap, true);

    this.objectiveLabel = addLabel(this, 18, 104, "", 16, "#9af7d8");
    this.objectiveLabel.setWordWrapWidth(panelWrap, true);

    this.hintLabel = addLabel(this, 18, 148, "", 14, "#ffd59f");
    this.hintLabel.setWordWrapWidth(panelWrap, true);

    addLabel(this, 18, 220, "Map Labels:", 16, "#ffd59f");
    addLabel(this, 18, 246, "Counter = drop delivery", 14, "#f3dada");
    addLabel(this, 18, 268, "Key = freezer key item", 14, "#f3dada");
    addLabel(this, 18, 290, "Switch A/B/C = power", 14, "#f3dada");
    addLabel(this, 18, 312, "Exit Door = your way out", 14, "#f3dada");

    addLabel(this, 18, 356, "Player = delivery guy", 14, "#bdeaff");
    addLabel(this, 18, 378, "Old Man = attacker", 14, "#fff0bf");
    addLabel(this, 18, 400, "Left click = freeze shot", 14, "#b7f0ff");
    addLabel(this, 18, 422, "Click switch = activate", 14, "#b7f0ff");

    this.freezeTimerLabel = addLabel(this, UI_PANEL_WIDTH + 20, 8, "", 18, "#b7f0ff");

    this.applyDistortedTextToPanel();

    this.updateObjectiveText();
    this.updateHint();
    this.updateFreezeTimerUi();
  }

  configureCollisions() {
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.attacker, this.walls);
    this.physics.add.collider(this.attacker, this.crates);

    this.physics.add.overlap(this.player, this.attacker, () => {
      this.stopInGameAudio();
      this.scene.start("jumpscare");
    });

    this.projectiles = this.physics.add.group();

    this.physics.add.overlap(this.projectiles, this.attacker, (projectileOrAttacker, maybeAttacker) => {
      const projectile = this.projectiles.contains(projectileOrAttacker)
        ? projectileOrAttacker
        : maybeAttacker;

      if (!projectile || !projectile.active) {
        return;
      }

      this.applyAttackerFreeze();
      projectile.destroy();
    });

    this.physics.add.collider(this.projectiles, this.walls, (projectile) => projectile.destroy());
    this.physics.add.collider(this.projectiles, this.crates, (projectile) => projectile.destroy());
  }

  applyAttackerEscalationStyle() {
    if (!this.isLevelTwoPlus) {
      return;
    }

    this.attacker.setDisplaySize(44, 44);
    this.attacker.setTint(0xe7d2cd);

    const pulseAlphaLow = this.delivery.id >= 3 ? 0.68 : 0.78;

    this.tweens.add({
      targets: this.attacker,
      alpha: { from: 1, to: pulseAlphaLow },
      duration: 220,
      yoyo: true,
      repeat: -1,
    });

    if (this.delivery.id >= 3) {
      this.tweens.add({
        targets: this.attacker,
        angle: { from: -4, to: 4 },
        duration: 95,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createAttackerBloodAura() {
    if (!this.isLevelTwoPlus) {
      this.attackerBloodAura = null;
      return;
    }

    this.attackerBloodAura = this.add.circle(this.attacker.x, this.attacker.y + 10, 14, 0x8b1118, 0.35);
    this.attackerBloodAura.setDepth(this.attacker.depth - 1);

    this.tweens.add({
      targets: this.attackerBloodAura,
      alpha: { from: 0.2, to: 0.44 },
      scale: { from: 0.88, to: 1.12 },
      duration: 180,
      yoyo: true,
      repeat: -1,
    });
  }

  updateAttackerBloodAura() {
    if (!this.attackerBloodAura) {
      return;
    }

    this.attackerBloodAura.setPosition(this.attacker.x, this.attacker.y + 10);
  }

  addBloodSplatters() {
    const { left, right, top, bottom, centerX, centerY } = this.playBounds;
    const splatters = [
      { x: left + 84, y: top + 88, r: 16, a: 0.52 },
      { x: left + 156, y: bottom - 66, r: 12, a: 0.45 },
      { x: right - 110, y: top + 70, r: 18, a: 0.56 },
      { x: right - 170, y: centerY + 22, r: 14, a: 0.5 },
      { x: centerX + 25, y: bottom - 80, r: 20, a: 0.38 },
      { x: centerX - 120, y: centerY - 44, r: 10, a: 0.34 },
    ];

    splatters.forEach((entry) => {
      const blot = this.add.circle(entry.x, entry.y, entry.r, 0x6e1317, entry.a);
      blot.setDepth(-1);

      const drip = this.add.ellipse(entry.x + 7, entry.y + entry.r + 6, 5, 12, 0x7d171d, entry.a * 0.9);
      drip.setDepth(-1);
    });
  }

  startAmbientEvents() {
    if (!this.delivery.hasFakeNoise) return;

    this.time.addEvent({
      delay: 3900,
      loop: true,
      callback: () => {
        const lines = [
          "You hear metal scraping behind you.",
          "A freezer door slams in another room.",
          "Someone whispers: 'Fresh delivery...'",
        ];
        this.hintLabel.setText(Phaser.Utils.Array.GetRandom(lines));
        this.time.delayedCall(1300, () => this.updateHint());
      },
    });
  }

  update() {
    this.handleMovement();
    this.clampToPlayBounds(this.player);

    this.updateAttackerAi();
    this.clampToPlayBounds(this.attacker);
    this.updateAttackerBloodAura();

    this.handleInteractions();
    this.handleExitReach();
    this.cleanupOffscreenProjectiles();
    this.updateFreezeTimerUi();
  }

  handleMovement() {
    const moveSpeed = this.keys.sprint.isDown ? GAME.speed.sprint : GAME.speed.player;
    let dx = 0;
    let dy = 0;

    if (this.keys.left.isDown || this.keys.leftAlt.isDown) dx -= 1;
    if (this.keys.right.isDown || this.keys.rightAlt.isDown) dx += 1;
    if (this.keys.up.isDown || this.keys.upAlt.isDown) dy -= 1;
    if (this.keys.down.isDown || this.keys.downAlt.isDown) dy += 1;

    const vector = new Phaser.Math.Vector2(dx, dy).normalize().scale(moveSpeed);
    this.player.body.setVelocity(vector.x, vector.y);

    if (!this.didPlayerMove && (dx !== 0 || dy !== 0)) {
      this.didPlayerMove = true;
      this.attackerActive = true;
      this.hintLabel.setText("The old man twitches... then charges.");
      this.time.delayedCall(1250, () => this.updateHint());
    }
  }

  updateAttackerAi() {
    if (!this.attackerActive) {
      this.attacker.body.setVelocity(0, 0);
      return;
    }

    if (this.time.now < this.attackerFrozenUntil) {
      this.attacker.body.setVelocity(0, 0);
      return;
    }

    const speed = this.baseAttackerSpeed;

    const toPlayer = new Phaser.Math.Vector2(
      this.player.x - this.attacker.x,
      this.player.y - this.attacker.y
    )
      .normalize()
      .scale(speed);

    this.attacker.body.setVelocity(toPlayer.x, toPlayer.y);
  }

  fireSlowShot(pointer) {
    if (pointer.rightButtonDown() || pointer.button === 2) {
      return;
    }

    const now = this.time.now;
    if (this.lastSwitchClickAt && now - this.lastSwitchClickAt < 120) {
      return;
    }
    if (now - this.lastShotAt < SHOT.cooldownMs) return;

    if (pointer.x < this.playBounds.left || pointer.x > this.playBounds.right) return;
    if (pointer.y < this.playBounds.top || pointer.y > this.playBounds.bottom) return;

    this.lastShotAt = now;

    const shot = this.add.circle(this.player.x, this.player.y, SHOT.radius, 0xb0f3ff);
    this.physics.add.existing(shot, false);
    this.projectiles.add(shot);

    const dir = new Phaser.Math.Vector2(pointer.worldX - this.player.x, pointer.worldY - this.player.y)
      .normalize()
      .scale(SHOT.speed);

    shot.body.setVelocity(dir.x, dir.y);
    shot.body.setAllowGravity(false);

    this.time.delayedCall(1400, () => {
      if (shot.active) shot.destroy();
    });
  }

  applyAttackerFreeze() {
    this.attackerFrozenUntil = this.time.now + SHOT.freezeDurationMs;
    this.attacker.setTint(0x9ecdb0);
    this.hintLabel.setText("Direct hit! Old man frozen for 10s.");
    this.updateFreezeTimerUi();

    this.time.delayedCall(SHOT.freezeDurationMs, () => {
      if (this.time.now >= this.attackerFrozenUntil) {
        this.attacker.clearTint();
        this.updateHint();
        this.updateFreezeTimerUi();
      }
    });
  }

  updateFreezeTimerUi() {
    if (!this.freezeTimerLabel) {
      return;
    }

    const remainingMs = Math.max(0, this.attackerFrozenUntil - this.time.now);
    if (remainingMs <= 0) {
      this.freezeTimerLabel.setText("Old Man Freeze: READY");
      this.freezeTimerLabel.setColor("#b7f0ff");
      return;
    }

    const seconds = (remainingMs / 1000).toFixed(1);
    this.freezeTimerLabel.setText(`Old Man Freeze: ${seconds}s`);
    this.freezeTimerLabel.setColor("#9af7d8");
  }

  cleanupOffscreenProjectiles() {
    if (!this.projectiles) return;

    this.projectiles.children.iterate((shot) => {
      if (!shot || !shot.active) return;
      const outX = shot.x < this.playBounds.left || shot.x > this.playBounds.right;
      const outY = shot.y < this.playBounds.top || shot.y > this.playBounds.bottom;
      if (outX || outY) shot.destroy();
    });
  }

  clampToPlayBounds(entity) {
    const halfW = (entity.displayWidth || entity.width) / 2;
    const halfH = (entity.displayHeight || entity.height) / 2;
    const minX = this.playBounds.left + WALL_THICKNESS / 2 + halfW;
    const maxX = this.playBounds.right - WALL_THICKNESS / 2 - halfW;
    const minY = this.playBounds.top + WALL_THICKNESS / 2 + halfH;
    const maxY = this.playBounds.bottom - WALL_THICKNESS / 2 - halfH;

    entity.x = Phaser.Math.Clamp(entity.x, minX, maxX);
    entity.y = Phaser.Math.Clamp(entity.y, minY, maxY);
  }

  handleInteractions() {
    if (!Phaser.Input.Keyboard.JustDown(this.interactKey)) return;

    if (!this.hasDelivered && this.isNear(this.player, this.deliverySpot)) {
      this.hasDelivered = true;
      this.deliverySpot.setFillStyle(0x6c9d6c);
      this.hintLabel.setText("Package dropped. Great. Why did the lights flicker?");
      this.updateObjectiveText();
      return;
    }

    if (!this.hasKey && this.isNear(this.player, this.keyItem)) {
      this.hasKey = true;
      this.keyItem.setVisible(false);
      this.keyItem.body.enable = false;
      this.hintLabel.setText("Got key. Your hand smells like rust now.");
      this.updateObjectiveText();
      return;
    }

    const nextSwitch = this.switches.find((entry) => !entry.active && this.isNear(this.player, entry.zone));
    if (nextSwitch) {
      this.activateSwitch(nextSwitch);
      return;
    }

    this.hintLabel.setText("Nothing useful to interact with here.");
  }

  activateSwitch(entry) {
    if (entry.active) {
      return;
    }

    if (!this.hasDelivered) {
      this.hintLabel.setText("Drop the delivery first, then switch power.");
      return;
    }

    entry.active = true;
    entry.zone.setFillStyle(GAME.colors.switchOn);
    this.switchesActive += 1;
    this.updateObjectiveText();
  }

  handleExitReach() {
    if (!this.hasDelivered || !this.hasKey) return;
    if (this.switchesActive < this.delivery.requiredSwitches) return;

    if (!this.isExitUnlocked) {
      this.isExitUnlocked = true;
      this.exitDoor.setFillStyle(GAME.colors.exitOpen);
      this.hintLabel.setText("Exit unlocked! Reach the door before he reaches you.");
      this.updateObjectiveText();
    }

    if (!this.isNear(this.player, this.exitDoor, 30)) return;

    runState.completedDeliveries += 1;

    const isLastDelivery = this.deliveryIndex >= DELIVERIES.length - 1;
    if (isLastDelivery) {
      this.stopInGameAudio();
      this.scene.start("end", { outcome: "escaped" });
      return;
    }

    runState.startNextDelivery();
    this.stopInGameAudio();
    this.scene.start("delivery", { deliveryIndex: this.deliveryIndex + 1 });
  }

  updateObjectiveText() {
    const switchNeed = this.delivery.requiredSwitches;
    const switchText = `${this.switchesActive}/${switchNeed}`;

    if (!this.hasDelivered) {
      this.objectiveLabel.setText("Objective: Deliver meat at the front counter (E)");
      return;
    }

    if (!this.hasKey) {
      this.objectiveLabel.setText("Objective: Find the freezer key (E)");
      return;
    }

    if (!this.isExitUnlocked) {
      this.objectiveLabel.setText(`Objective: Activate power switches (${switchText})`);
      return;
    }

    this.objectiveLabel.setText("Objective: Escape through the right-side exit NOW");
  }

  updateHint() {
    if (!this.didPlayerMove) {
      this.hintLabel.setText("Make your first move. The old man is... still.");
      return;
    }

    if (!this.hasDelivered) {
      this.hintLabel.setText("Drop the package and keep your distance.");
      return;
    }

    if (!this.hasKey) {
      this.hintLabel.setText("Try the top-right corner. Something glints there.");
      return;
    }

    if (!this.isExitUnlocked) {
      this.hintLabel.setText("Flip unlit switches. Mouse click freezes old man.");
      return;
    }

    this.hintLabel.setText("Door is open. Sprint and don’t miss.");
  }

  startInGameAudio() {
    this.startGameplayAmbientLoop();
    this.startRobotWarningLoop();
  }

  applyDistortedTextToPanel() {
    this.children.list.forEach((child) => {
      if (!(child instanceof Phaser.GameObjects.Text)) {
        return;
      }

      this.styleDistortedText(child, { strong: true });
    });
  }

  styleDistortedText(label, options = {}) {
    const { strong = false } = options;

    label.setShadow(3, 3, "#090909", 8, true, true);
    label.setStroke("#1a0505", strong ? 3 : 2);

    if (strong) {
      label.setTint(0xd9c5c5);
    }

    this.startTextDistortion(label, strong);
  }

  startTextDistortion(label, strong) {
    const baseX = label.x;
    const baseY = label.y;
    const maxJitter = strong ? 1.6 : 0.9;

    this.time.addEvent({
      delay: strong ? 110 : 180,
      loop: true,
      callback: () => {
        if (!label.active) {
          return;
        }

        const flicker = Phaser.Math.Between(0, 100) < (strong ? 24 : 14);
        label.alpha = flicker ? (strong ? 0.76 : 0.84) : 1;
        label.x = baseX + Phaser.Math.FloatBetween(-maxJitter, maxJitter);
        label.y = baseY + Phaser.Math.FloatBetween(-maxJitter, maxJitter);
      },
    });
  }

  startGameplayAmbientLoop() {
    const ctx = this.sound.context;
    if (!ctx) {
      return;
    }

    this.gameMusicCtx = ctx;
    this.gameMusicNextAt = ctx.currentTime + 0.06;

    this.gameMusicTimer = this.time.addEvent({
      delay: 460,
      loop: true,
      callback: () => this.scheduleGameplayTone(),
    });
  }

  scheduleGameplayTone() {
    if (!this.gameMusicCtx) {
      return;
    }

    const notes = [87.31, 98.0, 116.54, 130.81, 146.83, 174.61, 196.0];
    const choose = () => Phaser.Utils.Array.GetRandom(notes);

    const now = this.gameMusicCtx.currentTime;
    const t0 = Math.max(now + 0.02, this.gameMusicNextAt);

    this.playDreadTone(choose(), t0, 0.6, 1.2);

    if (Phaser.Math.Between(0, 100) < 45) {
      this.playDreadTone(choose() * 0.5, t0 + 0.24, 0.35, 1.1);
    }

    this.gameMusicNextAt = t0 + 0.45;
  }

  playDreadTone(freq, startAt, volume = 0.4, length = 1) {
    const ctx = this.gameMusicCtx;
    if (!ctx) {
      return;
    }

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startAt);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(5.5, startAt);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(4.2, startAt);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(620, startAt);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume * 0.12, startAt + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + length);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + length);
    lfo.start(startAt);
    lfo.stop(startAt + length);
  }

  startRobotWarningLoop() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    this.robotPhrase =
      "help mr slicy trapped me. hes going to chop me up scoop me up and put me in a hamburger.";

    const initialDelay = Phaser.Math.Between(9000, 14000);
    this.robotVoiceTimer = this.time.addEvent({
      delay: initialDelay,
      loop: true,
      callback: () => {
        this.speakRobotWarning();
        this.robotVoiceTimer.delay = Phaser.Math.Between(15000, 24000);
      },
    });
  }

  speakRobotWarning() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const robotish =
      voices.find((voice) => /zira|david|mark|google us english/i.test(voice.name)) || voices[0];

    const utter = new SpeechSynthesisUtterance(this.robotPhrase);
    utter.voice = robotish || null;
    utter.rate = 0.45;
    utter.pitch = 0.01;
    utter.volume = 0.6;

    window.speechSynthesis.speak(utter);
  }

  stopInGameAudio() {
    if (this.gameMusicTimer) {
      this.gameMusicTimer.remove(false);
      this.gameMusicTimer = null;
    }

    if (this.robotVoiceTimer) {
      this.robotVoiceTimer.remove(false);
      this.robotVoiceTimer = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    this.gameMusicCtx = null;
    this.gameMusicNextAt = 0;
  }

  isNear(a, b, threshold = INTERACT_DISTANCE) {
    return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) <= threshold;
  }

  getPlayBounds() {
    const { width, height } = this.scale;
    const left = UI_PANEL_WIDTH + PLAY_MARGIN;
    const right = width - PLAY_MARGIN;
    const top = PLAY_MARGIN;
    const bottom = height - PLAY_MARGIN;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    };
  }
}
