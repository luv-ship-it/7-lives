import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";
import type { Role } from "../data/roles";
import { loadProgress, newProgress, saveProgress } from "../state/progress";

interface ResultsSceneData {
	lifeNumber: number;
	role: Role;
	bossName: string;
	outcome: "victory" | "defeat";
}

export class ResultsScene extends Phaser.Scene {
	private campaignComplete = false;

	constructor() {
		super("results");
	}

	create(data: ResultsSceneData) {
		if (!data?.role) {
			this.scene.start("role-select");
			return;
		}

		this.cameras.main.setBackgroundColor("#14211f");
		addMusicToggle(this, 884, 38);
		this.add
			.image(480, 270, "last-light")
			.setDisplaySize(960, 540)
			.setAlpha(0.52)
			.setDepth(-2);
		this.add
			.rectangle(480, 270, 960, 540, 0x101817)
			.setAlpha(0.55)
			.setDepth(-1);

		if (data.outcome === "victory") {
			const progress = loadProgress();
			const clearedLives = [...new Set([...progress.clearedLives, data.lifeNumber])];
			this.campaignComplete = data.lifeNumber >= 7;
			saveProgress({
				...progress,
				currentLife: this.campaignComplete ? 7 : data.lifeNumber + 1,
				clearedLives,
				selectedRoleId: null,
				complete: this.campaignComplete,
			});
		} else {
			this.campaignComplete = false;
		}

		const won = data.outcome === "victory";
		playSound(won ? "victory" : "defeat");
		this.add
			.text(480, 92, won ? "LIFE CLEARED" : "LIFE FAILED", {
				fontFamily: "Fraunces, serif",
				fontSize: "40px",
				color: won ? "#e2ad58" : "#d9846f",
			})
			.setOrigin(0.5);

		this.add
			.text(
				480,
				154,
				won
					? `${data.role.name} defeated ${data.bossName}.`
					: `${data.role.name} was defeated by ${data.bossName}.`,
				{
					fontFamily: "DM Sans, sans-serif",
					fontSize: "17px",
					color: "#d5dfd8",
					align: "center",
					wordWrap: { width: 680 },
				},
			)
			.setOrigin(0.5);

		const nextMessage = this.campaignComplete
			? "All seven lives are complete."
			: won
				? `Life ${data.lifeNumber + 1} is ready when you are.`
				: "Your progress is safe. You can try again or choose another role.";
		this.add
			.text(480, 212, nextMessage, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "15px",
				color: "#aebfb5",
				align: "center",
			})
			.setOrigin(0.5);

		if (won && this.campaignComplete) {
			this.createButton(480, "START A NEW RUN", () => this.startNewRun());
		} else if (won) {
			this.createButton(480, "CHOOSE A ROLE FOR THE NEXT LIFE", () =>
				this.scene.start("role-select"),
			);
		} else {
			this.createButton(360, "RETRY THIS LIFE", () =>
				this.scene.start("life", {
					lifeNumber: data.lifeNumber,
					role: data.role,
				}),
				220,
			);
			this.createButton(600, "CHANGE ROLE", () =>
				this.scene.start("role-select"),
				220,
			);
		}
	}

	private createButton(
		x: number,
		label: string,
		onPress: () => void,
		width = 260,
	) {
		const background = this.add
			.rectangle(x, 310, width, 52, 0xec8155)
			.setStrokeStyle(2, 0xffd77a)
			.setInteractive({ useHandCursor: true });
		this.add
			.text(x, 310, label, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				color: "#182b2b",
				align: "center",
				wordWrap: { width: width - 24 },
			})
			.setOrigin(0.5);

		background.on("pointerover", () => background.setFillStyle(0xffa36f));
		background.on("pointerout", () => background.setFillStyle(0xec8155));
		background.on("pointerdown", () => {
			playSound("confirm");
			onPress();
		});
	}

	private startNewRun() {
		saveProgress(newProgress());
		this.scene.start("role-select");
	}
}
