import Phaser from "phaser";
import { addMusicToggle, playSound, startGameAudio } from "../audio/audioManager";

export class IntroScene extends Phaser.Scene {
	private beginRun() {
		startGameAudio();
		playSound("confirm");
		this.scene.start("role-select");
	}

	constructor() {
		super("intro");
	}

	preload() {
		this.load.image("seven-lives", "/art/seven-lives.svg");
		this.load.image("traveler", "/art/traveler.svg");
	}

	create() {
		this.cameras.main.setBackgroundColor("#e6bd83");
		addMusicToggle(this, 884, 38);

		const landscape = this.add
			.image(480, 270, "seven-lives")
			.setDisplaySize(960, 540)
			.setAlpha(0.98);
		this.tweens.add({
			targets: landscape,
			scaleX: 1.04,
			duration: 18000,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		this.add
			.rectangle(260, 270, 520, 540, 0xfff0cf, 0.96)
			.setStrokeStyle(2, 0xec8155, 0.9);

		const traveler = this.add
			.image(660, 424, "traveler")
			.setOrigin(0.5, 1)
			.setScale(1.08)
			.setAlpha(0.94);
		this.tweens.add({
			targets: traveler,
			y: 418,
			duration: 2100,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		this.add
			.text(62, 42, "7-LIVES   /   SEVEN JOURNEYS", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#286d66",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(60, 91, "Seven lives.\nSeven ways to live.", {
				fontFamily: "Fraunces, serif",
				fontSize: "48px",
				color: "#17464a",
				lineSpacing: -3,
			})
			.setOrigin(0, 0);

		this.add
			.text(
				62,
				217,
				"In every life, you become someone new and enter a different world. Choose a role, discover its challenge, and decide how that life will unfold.",
				{
					fontFamily: "DM Sans, sans-serif",
					fontSize: "14px",
					color: "#355a52",
					lineSpacing: 6,
					wordWrap: { width: 420 },
				},
			)
			.setOrigin(0, 0);

		this.add
			.rectangle(62, 298, 420, 3, 0xec8155, 0.95)
			.setOrigin(0);

		this.add
			.text(62, 318, "HOW YOUR JOURNEY WORKS", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#286d66",
			})
			.setOrigin(0, 0.5);

		const rules = [
			["01", "Choose a role at the start of each life."],
			["02", "Explore its world and complete its challenge."],
			["03", "Clear a life to move on. Fail and try that life again."],
		];

		rules.forEach(([number, text], index) => {
			const y = 347 + index * 30;
			this.add
				.text(64, y, number, {
					fontFamily: "DM Sans, sans-serif",
					fontSize: "10px",
					color: "#bd6148",
				})
				.setOrigin(0, 0.5);
			this.add
				.text(96, y, text, {
					fontFamily: "DM Sans, sans-serif",
					fontSize: "12px",
					color: "#294f4a",
					wordWrap: { width: 390 },
				})
				.setOrigin(0, 0.5);
		});

		this.add
			.rectangle(680, 125, 310, 112, 0xfff0cf, 0.9)
			.setStrokeStyle(2, 0xec8155, 0.95);

		this.add
			.text(680, 118, "ONE JOURNEY.\nSEVEN LIVES.\nSTART ANYWHERE.", {
				fontFamily: "Fraunces, serif",
				fontSize: "26px",
				color: "#17464a",
				align: "center",
				lineSpacing: 4,
			})
			.setOrigin(0.5);

		this.add
			.text(270, 480, "YOUR FIRST WORLD IS READY WHEN YOU ARE.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#557467",
			})
			.setOrigin(0.5);

		const button = this.add
			.rectangle(270, 515, 282, 44, 0xec8155)
			.setStrokeStyle(2, 0xffd77a)
			.setInteractive({ useHandCursor: true });
		this.add
			.text(
				270,
				515,
				"CHOOSE YOUR ROLE",
				{
					fontFamily: "DM Sans, sans-serif",
					fontSize: "12px",
					color: "#171b17",
				},
			)
			.setOrigin(0.5);

		button.on("pointerover", () => button.setFillStyle(0xffa36f));
		button.on("pointerout", () => button.setFillStyle(0xec8155));
		button.on("pointerdown", () => this.beginRun());
		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.code === "Space") this.beginRun();
		});
	}
}