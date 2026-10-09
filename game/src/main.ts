import Phaser from "phaser";
import "./style.css";
import { PrototypeScene } from "./game/scenes/PrototypeScene";

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
  scene: [PrototypeScene],
});