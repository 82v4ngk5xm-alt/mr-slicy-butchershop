import Phaser from "phaser";
import { addCenteredLabel } from "../game/ui.js";
import { runState } from "../game/state.js";

export class EndScene extends Phaser.Scene {
  constructor() {
    super("end");
  }

  create(data) {
    const outcome = data?.outcome ?? "escaped";

    if (outcome === "caught") {
      addCenteredLabel(this, 110, "YOU WERE CHOPPED", 46, "#ff8f8f");
      addCenteredLabel(
        this,
        196,
        "Mr. Slicey dragged you behind the freezer.\nYou wake up outside... somehow.",
        21,
        "#f3dada"
      );
    } else {
      addCenteredLabel(this, 110, "SHIFT COMPLETE?", 46, "#9af7d8");
      addCenteredLabel(
        this,
        196,
        `You survived ${runState.completedDeliveries} deliveries.\nThe old man left a note: 'See you tomorrow.'`,
        21,
        "#f3dada"
      );
    }

    const cta = addCenteredLabel(this, 365, "Press R to replay", 28, "#ffd59f");
    this.tweens.add({
      targets: cta,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once("keydown-R", () => this.scene.start("title"));
  }
}
