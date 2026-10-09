import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";

const storyBeats = [
	{
		speaker: "A CITY WITHOUT WARMTH",
		title: "The city forgot\nthe taste of home.",
		copy: "The blackout has lasted for days. At The Last Table, the stove is still warm, but the shelves are almost bare.",
	},
	{
		speaker: "THE CHEF",
		title: "One last meal\ncould bring them in.",
		copy: "A neighbor leaves three things on the counter: a tomato, a mushroom, and wild herbs. You are the chef tonight.",
	},
	{
		speaker: "YOUR FIRST SERVICE",
		title: "Make something\nworth sharing.",
		copy: "Gather the ingredients, cook at the stove, and bring the soup to the serving hatch. This is your first life.",
	},
];

export class ChefStoryScene extends Phaser.Scene {
	private beatIndex = 0;
	private speakerLabel!: Phaser.GameObjects.Text;
	private titleLabel!: Phaser.GameObjects.Text;
	private storyLabel!: Phaser.GameObjects.Text;
	private progressLabel!: Phaser.GameObjects.Text;
	private nextLabel!: Phaser.GameObjects.Text;

	constructor() {
		super("chef-story");
	}

	preload() {
		this.load.image("chef-kitchen", "/art/chef-kitchen.svg");
		this.load.image("chef", "/art/chef.svg");
	}

	create() {
		this.beatIndex = 0;
		this.add.image(480, 270, "chef-kitchen").setDisplaySize(960, 540);
		this.add.rectangle(260, 270, 520, 540, 0xfff0cf, 0.97).setStrokeStyle(2, 0xec8155);
		this.add.rectangle(742, 122, 360, 86, 0xfff0cf, 0.91).setStrokeStyle(2, 0xec8155);
		addMusicToggle(this, 884, 38);

		this.add
			.text(742, 108, "THE LAST TABLE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#286d66",
			})
			.setOrigin(0.5);
		this.add
			.text(742, 145, "A kitchen can still\ngather a whole city.", {
				fontFamily: "Fraunces, serif",
				fontSize: "21px",
				color: "#17464a",
				align: "center",
				lineSpacing: -2,
			})
			.setOrigin(0.5);

		const chef = this.add
			.image(666, 454, "chef")
			.setOrigin(0.5, 1)
			.setScale(1.45);
		this.tweens.add({
			targets: chef,
			y: 448,
			duration: 1900,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		this.add
			.text(62, 43, "7-LIVES  /  LIFE ONE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#286d66",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(62, 78, "Before the first shift", {
				fontFamily: "Fraunces, serif",
				fontSize: "26px",
				color: "#17464a",
			})
			.setOrigin(0, 0.5);

		this.speakerLabel = this.add
			.text(64, 133, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#bd6148",
			})
			.setOrigin(0, 0.5);
		this.titleLabel = this.add
			.text(62, 157, "", {
				fontFamily: "Fraunces, serif",
				fontSize: "39px",
				color: "#17464a",
				lineSpacing: -4,
			})
			.setOrigin(0, 0);
		this.storyLabel = this.add
			.text(64, 274, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "16px",
				color: "#355a52",
				lineSpacing: 7,
				wordWrap: { width: 410 },
			})
			.setOrigin(0, 0);
		this.add.rectangle(64, 390, 414, 3, 0xec8155);

		this.progressLabel = this.add
			.text(64, 414, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#647d6c",
			})
			.setOrigin(0, 0.5);

		const nextButton = this.add
			.rectangle(268, 464, 290, 48, 0xec8155)
			.setStrokeStyle(2, 0xe4ad56)
			.setInteractive({ useHandCursor: true });
		this.nextLabel = this.add
			.text(268, 464, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#173f43",
			})
			.setOrigin(0.5);
		nextButton.on("pointerover", () => nextButton.setFillStyle(0xffa36f));
		nextButton.on("pointerout", () => nextButton.setFillStyle(0xec8155));
		nextButton.on("pointerdown", () => this.advance(nextButton));

		this.add
			.text(268, 520, "PRESS ENTER TO CONTINUE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#647d6c",
			})
			.setOrigin(0.5);

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.code === "Space") this.advance(nextButton);
		});
		this.renderBeat();
	}

	private renderBeat() {
		const beat = storyBeats[this.beatIndex];
		this.speakerLabel.setText(beat.speaker);
		this.titleLabel.setText(beat.title);
		this.storyLabel.setText(beat.copy);
		this.progressLabel.setText(`STORY BEAT  0${this.beatIndex + 1} / 0${storyBeats.length}`);
		this.nextLabel.setText(
			this.beatIndex === storyBeats.length - 1 ? "START THE CHEF'S SHIFT" : "CONTINUE THE STORY",
		);
		this.titleLabel.setAlpha(0);
		this.storyLabel.setAlpha(0);
		this.tweens.add({
			targets: [this.titleLabel, this.storyLabel],
			alpha: 1,
			duration: 240,
			ease: "Sine.easeOut",
		});
	}

	private advance(button: Phaser.GameObjects.Rectangle) {
		playSound("confirm");
		if (this.beatIndex === storyBeats.length - 1) {
			this.scene.start("chef-world");
			return;
		}

		this.beatIndex += 1;
		button.setScale(0.98).setScale(1);
		this.renderBeat();
	}
}