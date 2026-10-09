import Phaser from "phaser";
import "./style.css";
import { LifeScene } from "./game/scenes/LifeScene";
import { BossScene } from "./game/scenes/BossScene";
import { RoleSelectScene } from "./game/scenes/RoleSelectScene";
import { ResultsScene } from "./game/scenes/ResultsScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#182126",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
    scene: [RoleSelectScene, LifeScene, BossScene, ResultsScene],
});