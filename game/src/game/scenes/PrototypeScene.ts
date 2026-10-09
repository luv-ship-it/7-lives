import Phaser from "phaser";

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("prototype");
  }

  create() {
    this.add
      .text(480, 210, "7-Lives", {
        fontFamily: "Georgia",
        fontSize: "48px",
        color: "#f3eddb",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 285, "Choose a role. Face the challenge. Defeat the boss.", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#d4dedb",
      })
      .setOrigin(0.5);
  }
}

// Chosse a role. Play a short challenge where the role's ability matters. Fight that life's boss. Show victory or failure. On failure, retry the life; on victory, mark it complete.

