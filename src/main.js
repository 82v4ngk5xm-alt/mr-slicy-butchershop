import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { DeliveryScene } from "./scenes/DeliveryScene.js";
import { EndScene } from "./scenes/EndScene.js";
import { JumpscareScene } from "./scenes/JumpscareScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: 960,
  height: 540,
  backgroundColor: "#140f14",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, DeliveryScene, JumpscareScene, EndScene],
};

new Phaser.Game(config);
