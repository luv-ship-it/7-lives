import Phaser from "phaser";
import { roles, type Role } from "../data/roles";
import { loadProgress, newProgress, saveProgress } from "../state/progress";

export class RoleSelectScene extends Phaser.Scene {
	private selectedRole: Role | undefined;
	private cardBackgrounds = new Map<number, Phaser.GameObjects.Rectangle>();
	private continueBackground!: Phaser.GameObjects.Rectangle;
	private continueLabel!: Phaser.GameObjects.Text;

	constructor() {
		super("role-select");
	}

	create() {
		this.selectedRole = undefined;
		this.cardBackgrounds.clear();
		this.cameras.main.setBackgroundColor("#14211f");
		const progress = loadProgress();

		this.add
			.text(480, 47, "SEVEN LIVES", {
				fontFamily: "Georgia, serif",
				fontSize: "15px",
				color: "#e2ad58",
				letterSpacing: 2,
			})
			.setOrigin(0.5);

		this.add
			.text(480, 88, "Choose your role", {
				fontFamily: "Georgia, serif",
				fontSize: "38px",
				color: "#f1eadb",
			})
			.setOrigin(0.5);

		this.add
			.text(
				480,
				130,
				progress.complete
					? "ALL SEVEN LIVES CLEARED     /     BEGIN AGAIN"
					: `LIFE ${progress.currentLife} OF 7     /     YOUR STORY STARTS HERE`,
				{
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#aab9b0",
				},
			)
			.setOrigin(0.5);

		roles.forEach((role, index) => this.createRoleCard(role, index));

		this.continueBackground = this.add
			.rectangle(480, 464, 270, 48, 0x31453d)
			.setStrokeStyle(1, 0x52645a)
			.setInteractive({ useHandCursor: true });

		this.continueLabel = this.add
			.text(480, 464, "SELECT A ROLE", {
				fontFamily: "Arial, sans-serif",
				fontSize: "14px",
				color: "#9eaca3",
			})
			.setOrigin(0.5);

		this.continueBackground.on("pointerover", () => {
			if (this.selectedRole) this.continueBackground.setFillStyle(0xd79343);
		});
		this.continueBackground.on("pointerout", () => {
			this.continueBackground.setFillStyle(
				this.selectedRole ? 0xc98236 : 0x31453d,
			);
		});
		this.continueBackground.on("pointerdown", () => this.startLife());

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			const roleIndex = Number(event.key) - 1;
			if (roleIndex >= 0 && roleIndex < roles.length) {
				this.selectRole(roles[roleIndex]);
			} else if (event.key === "Enter") {
				this.startLife();
			}
		});

		if (!progress.complete) {
			const savedRole = roles.find((role) => role.id === progress.selectedRoleId);
			if (savedRole) this.selectRole(savedRole);
		}
	}

	private createRoleCard(role: Role, index: number) {
		const isTopRow = index < 4;
		const column = isTopRow ? index : index - 4;
		const x = isTopRow ? 150 + column * 220 : 260 + column * 220;
		const y = isTopRow ? 228 : 350;
		const background = this.add
			.rectangle(x, y, 194, 102, 0x20312e)
			.setStrokeStyle(1, 0x43574e)
			.setInteractive({ useHandCursor: true });

		this.cardBackgrounds.set(role.id, background);

		this.add
			.text(x - 76, y - 32, `0${role.id}`, {
				fontFamily: "Arial, sans-serif",
				fontSize: "11px",
				color: "#d99a4d",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(x - 76, y - 10, role.name, {
				fontFamily: "Georgia, serif",
				fontSize: "21px",
				color: "#f1eadb",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(x - 76, y + 19, role.description, {
				fontFamily: "Arial, sans-serif",
				fontSize: "11px",
				color: "#b7c4bc",
				wordWrap: { width: 158 },
			})
			.setOrigin(0, 0.5);

		background.on("pointerover", () => {
			if (this.selectedRole?.id !== role.id) background.setFillStyle(0x2b403a);
		});
		background.on("pointerout", () => {
			if (this.selectedRole?.id !== role.id) background.setFillStyle(0x20312e);
		});
		background.on("pointerdown", () => this.selectRole(role));
	}

	private selectRole(role: Role | undefined) {
		if (!role) return;

		this.selectedRole = role;
		for (const [id, background] of this.cardBackgrounds) {
			const selected = id === role.id;
			background
				.setFillStyle(selected ? 0x3d5143 : 0x20312e)
				.setStrokeStyle(selected ? 2 : 1, selected ? 0xe2ad58 : 0x43574e);
		}

		this.continueBackground.setFillStyle(0xc98236);
		this.continueBackground.setStrokeStyle(1, 0xe2ad58);
		this.continueLabel.setText(`CONTINUE AS ${role.name.toUpperCase()}`);
		this.continueLabel.setColor("#171b17");

		const progress = loadProgress();
		if (!progress.complete) {
			saveProgress({ ...progress, selectedRoleId: role.id });
		}
	}

	private startLife() {
		if (!this.selectedRole) return;

		const savedProgress = loadProgress();
		const progress = savedProgress.complete ? newProgress() : savedProgress;
		const lifeNumber = progress.currentLife;
		saveProgress({ ...progress, selectedRoleId: this.selectedRole.id });
		this.scene.start("life", {
			lifeNumber,
			role: this.selectedRole,
		});
	}
}

