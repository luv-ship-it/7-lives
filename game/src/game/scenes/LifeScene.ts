import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";
import type { Role } from "../data/roles";

interface LifeSceneData {
	lifeNumber: number;
	role: Role;
}

export class LifeScene extends Phaser.Scene {
	constructor() {
		super("life");
	}

	create({ lifeNumber, role }: LifeSceneData) {
		this.cameras.main.setBackgroundColor("#17424b");
		addMusicToggle(this, 884, 38);
		this.add
			.image(480, 270, "last-light")
			.setDisplaySize(960, 540)
			.setAlpha(0.96)
			.setDepth(-2);
		this.add
			.rectangle(480, 270, 960, 540, 0x123943)
			.setAlpha(0.32)
			.setDepth(-1);

		this.add
			.text(480, 72, `LIFE ${String(lifeNumber).padStart(2, "0")} / 07  -  THE WARDEN'S GATE`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				color: "#ffd77a",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 150, "The city forgot the sun.", {
				fontFamily: "Fraunces, serif",
				fontSize: "42px",
				color: "#fff0cf",
			})
			.setOrigin(0.5);

		this.add
			.text(
				480,
				224,
				"Beyond the broken bridge, the Warden guards the last light.\nYour chosen role is the only edge you have.",
				{
				fontFamily: "DM Sans, sans-serif",
				fontSize: "17px",
				color: "#e7f0df",
				align: "center",
				lineSpacing: 9,
				},
			)
			.setOrigin(0.5);

		this.add
			.rectangle(480, 340, 500, 76, 0x20505a)
			.setStrokeStyle(2, 0xf2c66d);

		this.add
			.text(480, 323, `YOUR LIFE ${lifeNumber} ROLE`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#ffd77a",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 353, `${role.name.toUpperCase()}  /  ${role.ability.toUpperCase()}`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "16px",
				color: "#fff0cf",
			})
			.setOrigin(0.5);

		const startButton = this.add
			.text(480, 438, "FACE THE WARDEN", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "14px",
				color: "#182b2b",
				backgroundColor: "#ec8155",
				padding: { x: 22, y: 14 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		startButton.on("pointerdown", () => {
			playSound("confirm");
			this.scene.start("boss", { lifeNumber, role });
		});

		const backButton = this.add
			.text(480, 510, "CHANGE ROLE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "14px",
				color: "#fff0cf",
				backgroundColor: "#245e61",
				padding: { x: 22, y: 14 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		backButton.on("pointerdown", () => {
			playSound("select");
			this.scene.start("role-select");
		});
	}
}
