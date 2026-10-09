import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";

const storyBeats = [
	{
		speaker: "LIFE TWO  /  THE ENGINEER",
		title: "The storm took\nthe neighborhood dark.",
		copy: "One last flash knocked out the old power grid. The workshop still has a generator, but its relay lines are broken.",
	},
	{
		speaker: "A NOTE FROM THE WORKSHOP",
		title: "Three systems\nneed a steady hand.",
		copy: "The generator, water pump, and street lamps are all offline. The parts are here. The circuit paths are not.",
	},
	{
		speaker: "YOUR REPAIR SHIFT",
		title: "Reconnect the grid.\nBring the lights back.",
		copy: "Walk to each relay and rotate its wire pieces. Connect the power source to the output, then restore all three systems.",
	},
];

export class EngineerStoryScene extends Phaser.Scene {
	private beatIndex = 0;
	private speakerLabel!: Phaser.GameObjects.Text;
	private titleLabel!: Phaser.GameObjects.Text;
	private storyLabel!: Phaser.GameObjects.Text;
	private progressLabel!: Phaser.GameObjects.Text;
	private nextLabel!: Phaser.GameObjects.Text;

	constructor() {
		super("engineer-story");
	}

	preload() {
		this.load.image("engineer-workshop", "/art/engineer-workshop.svg");
		this.load.image("engineer", "/art/engineer.svg");
	}

	create() {
		this.beatIndex = 0;
		this.add.image(480, 270, "engineer-workshop").setDisplaySize(960, 540);
		this.add.rectangle(260, 270, 520, 540, 0xfff0cf, 0.97).setStrokeStyle(2, 0xe88758);
		this.add.rectangle(746, 120, 356, 88, 0xfff0cf, 0.92).setStrokeStyle(2, 0x438478);
		addMusicToggle(this, 884, 38);

		this.add
			.text(746, 104, "THE SIGNAL WORKSHOP", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#286d66",
			})
			.setOrigin(0.5);
		this.add
			.text(746, 145, "A little repair can\nlight a whole street.", {
				fontFamily: "Fraunces, serif",
				fontSize: "21px",
				color: "#17464a",
				align: "center",
				lineSpacing: -2,
			})
			.setOrigin(0.5);

		const engineer = this.add
			.image(668, 454, "engineer")
			.setOrigin(0.5, 1)
			.setScale(1.42);
		this.tweens.add({
			targets: engineer,
			y: 448,
			duration: 1800,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		this.add
			.text(62, 43, "7-LIVES  /  LIFE TWO", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#286d66",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(62, 78, "Before the repair shift", {
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
		this.add.rectangle(64, 390, 414, 3, 0xe88758);

		this.progressLabel = this.add
			.text(64, 414, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#647d6c",
			})
			.setOrigin(0, 0.5);

		const nextButton = this.add
			.rectangle(268, 464, 290, 48, 0xe88758)
			.setStrokeStyle(2, 0xf2c66d)
			.setInteractive({ useHandCursor: true });
		this.nextLabel = this.add
			.text(268, 464, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#173f43",
			})
			.setOrigin(0.5);
		nextButton.on("pointerover", () => nextButton.setFillStyle(0xf6a375));
		nextButton.on("pointerout", () => nextButton.setFillStyle(0xe88758));
		nextButton.on("pointerdown", () => this.advance());

		this.add
			.text(268, 520, "PRESS ENTER TO CONTINUE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#647d6c",
			})
			.setOrigin(0.5);
		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.code === "Space") this.advance();
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
			this.beatIndex === storyBeats.length - 1 ? "ENTER THE WORKSHOP" : "CONTINUE THE STORY",
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

	private advance() {
		playSound("confirm");
		if (this.beatIndex === storyBeats.length - 1) {
			this.scene.start("engineer-world");
			return;
		}
		this.beatIndex += 1;
		this.renderBeat();
	}
}