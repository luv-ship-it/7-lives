import Phaser from "phaser";
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
		this.cameras.main.setBackgroundColor("#14211f");

		this.add
			.text(480, 70, `LIFE ${lifeNumber} OF 7`, {
				fontFamily: "Arial, sans-serif",
				fontSize: "14px",
				color: "#e2ad58",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 145, role.name, {
				fontFamily: "Georgia, serif",
				fontSize: "56px",
				color: "#f1eadb",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 205, `YOUR ABILITY: ${role.ability.toUpperCase()}`, {
				fontFamily: "Arial, sans-serif",
				fontSize: "14px",
				color: "#e2ad58",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 270, role.description, {
				fontFamily: "Arial, sans-serif",
				fontSize: "20px",
				color: "#c4d0c8",
				wordWrap: { width: 600 },
				align: "center",
			})
			.setOrigin(0.5);

		this.add
			.rectangle(480, 365, 560, 100, 0x20312e)
			.setStrokeStyle(1, 0x43574e);

		this.add
			.text(
				480,
				365,
				"THE FIRST TRIAL\nFace the Warden and prove your chosen role.",
				{
				fontFamily: "Arial, sans-serif",
				fontSize: "15px",
				color: "#d5dfd8",
				align: "center",
				lineSpacing: 8,
				},
			)
			.setOrigin(0.5);

		const startButton = this.add
			.text(480, 455, "ENTER THE TRIAL", {
				fontFamily: "Arial, sans-serif",
				fontSize: "14px",
				color: "#171b17",
				backgroundColor: "#c98236",
				padding: { x: 22, y: 14 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		startButton.on("pointerdown", () =>
			this.scene.start("boss", { lifeNumber, role }),
		);

		const backButton = this.add
			.text(480, 515, "CHANGE ROLE", {
				fontFamily: "Arial, sans-serif",
				fontSize: "14px",
				color: "#e2ad58",
				backgroundColor: "#263a34",
				padding: { x: 22, y: 14 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		backButton.on("pointerdown", () => this.scene.start("role-select"));
	}
}
