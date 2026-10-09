import Phaser from "phaser";
import "./style.css";
import { IntroScene } from "./game/scenes/IntroScene";
import { ChefStoryScene } from "./game/scenes/ChefStoryScene";
import { ChefWorldScene } from "./game/scenes/ChefWorldScene";
import { RoleSelectScene } from "./game/scenes/RoleSelectScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#d7e5d6",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [IntroScene, RoleSelectScene, ChefStoryScene, ChefWorldScene],
};

void document.fonts.ready.then(() => new Phaser.Game(config));