import Phaser from "phaser";
import type { Role } from "../data/roles";

interface BossSceneData {
	lifeNumber: number;
	role: Role;
}

type FightAction = "strike" | "guard";
type FightOutcome = "victory" | "defeat";

const bossNames = [
	"The Warden",
	"The Doubt",
	"The Undertow",
	"The Unfinished",
	"The Noise",
	"The Unknown",
	"The Last Shadow",
];

export class BossScene extends Phaser.Scene {
	private lifeNumber = 1;
	private role!: Role;
	private bossName = bossNames[0];
	private playerHealth = 6;
	private bossHealth = 12;
	private empoweredDamage = 0;
	private guarded = false;
	private skillUsed = false;
	private finished = false;
	private playerHealthLabel!: Phaser.GameObjects.Text;
	private bossHealthLabel!: Phaser.GameObjects.Text;
	private playerHealthBar!: Phaser.GameObjects.Rectangle;
	private bossHealthBar!: Phaser.GameObjects.Rectangle;
	private statusLabel!: Phaser.GameObjects.Text;
	private skillButton!: Phaser.GameObjects.Rectangle;
	private skillButtonLabel!: Phaser.GameObjects.Text;

	constructor() {
		super("boss");
	}

	create({ lifeNumber, role }: BossSceneData) {
		if (!role) {
			this.scene.start("role-select");
			return;
		}

		this.lifeNumber = lifeNumber;
		this.role = role;
		this.bossName = bossNames[(lifeNumber - 1) % bossNames.length];
		this.playerHealth = 6;
		this.bossHealth = 12;
		this.empoweredDamage = 0;
		this.guarded = false;
		this.skillUsed = false;
		this.finished = false;
		this.cameras.main.setBackgroundColor("#14211f");

		this.add
			.text(480, 48, `LIFE ${lifeNumber}  /  BOSS ENCOUNTER`, {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#e2ad58",
			})
			.setOrigin(0.5);

		this.add
			.text(480, 98, this.bossName, {
				fontFamily: "Georgia, serif",
				fontSize: "38px",
				color: "#f1eadb",
			})
			.setOrigin(0.5);

		this.add
			.rectangle(265, 220, 300, 172, 0x20312e)
			.setStrokeStyle(1, 0x43574e);
		this.add
			.rectangle(695, 220, 300, 172, 0x322927)
			.setStrokeStyle(1, 0x775148);

		this.add
			.text(265, 161, role.name.toUpperCase(), {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#aebfb5",
			})
			.setOrigin(0.5);
		this.add
			.text(695, 161, this.bossName.toUpperCase(), {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#d0a69a",
			})
			.setOrigin(0.5);

		this.add
			.text(145, 205, "HEALTH", {
				fontFamily: "Arial, sans-serif",
				fontSize: "11px",
				color: "#aebfb5",
			})
			.setOrigin(0, 0.5);
		this.add
			.rectangle(145, 229, 240, 12, 0x111b19)
			.setOrigin(0, 0.5);
		this.playerHealthBar = this.add
			.rectangle(145, 229, 240, 12, 0x83b18c)
			.setOrigin(0, 0.5);
		this.playerHealthLabel = this.add
			.text(145, 257, "", {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#d5dfd8",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(575, 205, "HEALTH", {
				fontFamily: "Arial, sans-serif",
				fontSize: "11px",
				color: "#d0a69a",
			})
			.setOrigin(0, 0.5);
		this.add
			.rectangle(575, 229, 240, 12, 0x201715)
			.setOrigin(0, 0.5);
		this.bossHealthBar = this.add
			.rectangle(575, 229, 240, 12, 0xc76e58)
			.setOrigin(0, 0.5);
		this.bossHealthLabel = this.add
			.text(575, 257, "", {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#ead8d0",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(265, 315, role.description, {
				fontFamily: "Arial, sans-serif",
				fontSize: "15px",
				color: "#c4d0c8",
				align: "center",
				wordWrap: { width: 245 },
			})
			.setOrigin(0.5);
		this.add
			.text(695, 315, "It watches for your next move.", {
				fontFamily: "Arial, sans-serif",
				fontSize: "15px",
				color: "#d9c4bc",
				align: "center",
				wordWrap: { width: 245 },
			})
			.setOrigin(0.5);

		this.add.rectangle(480, 385, 700, 58, 0x1b2926);
		this.statusLabel = this.add
			.text(480, 385, `${this.bossName} blocks the way. Choose your move.`, {
				fontFamily: "Arial, sans-serif",
				fontSize: "15px",
				color: "#d5dfd8",
				align: "center",
				wordWrap: { width: 650 },
			})
			.setOrigin(0.5);

		this.createButton(295, "STRIKE", () => this.takeTurn("strike"));
		this.createButton(480, "GUARD", () => this.takeTurn("guard"));
		const skillButton = this.createButton(665, role.ability.toUpperCase(), () =>
			this.useRoleSkill(),
		);
		this.skillButton = skillButton.background;
		this.skillButtonLabel = skillButton.label;
		this.updateHealthDisplay();

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (event.key === "1") this.takeTurn("strike");
			if (event.key === "2") this.takeTurn("guard");
			if (event.key === "3") this.useRoleSkill();
		});
	}

	private createButton(
		x: number,
		label: string,
		onPress: () => void,
	): { background: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
		const background = this.add
			.rectangle(x, 480, 164, 48, 0x31453d)
			.setStrokeStyle(1, 0x64796d)
			.setInteractive({ useHandCursor: true });
		const text = this.add
			.text(x, 480, label, {
				fontFamily: "Arial, sans-serif",
				fontSize: "13px",
				color: "#f1eadb",
			})
			.setOrigin(0.5);

		background.on("pointerover", () => background.setFillStyle(0x435b4d));
		background.on("pointerout", () => background.setFillStyle(0x31453d));
		background.on("pointerdown", onPress);
		return { background, label: text };
	}

	private takeTurn(action: FightAction) {
		if (this.finished) return;

		let message: string;
		if (action === "strike") {
			const damage = 3 + this.empoweredDamage;
			this.empoweredDamage = 0;
			this.bossHealth = Math.max(0, this.bossHealth - damage);
			message = `${this.role.name} strikes for ${damage} damage.`;
		} else {
			this.guarded = true;
			message = `${this.role.name} braces for the next hit.`;
		}

		if (this.bossHealth === 0) {
			this.updateHealthDisplay();
			this.finishFight("victory");
			return;
		}

		this.receiveBossAttack(message);
	}

	private useRoleSkill() {
		if (this.finished || this.skillUsed) return;

		this.skillUsed = true;
		const skill = this.role.skill;
		let message = `${this.role.name} uses ${this.role.ability}.`;

		switch (skill.type) {
			case "heal":
				this.playerHealth = Math.min(6, this.playerHealth + skill.amount);
				message += ` Restored ${skill.amount} health.`;
				break;
			case "guard":
				this.guarded = true;
				message += " The next hit will be blocked.";
				break;
			case "empower":
				this.empoweredDamage = skill.amount;
				message += ` The next strike gains ${skill.amount} damage.`;
				break;
			case "strike":
				this.bossHealth = Math.max(0, this.bossHealth - skill.amount);
				message += ` Dealt ${skill.amount} damage.`;
				break;
			case "rally":
				this.playerHealth = Math.min(6, this.playerHealth + skill.heal);
				this.empoweredDamage = skill.damage;
				message += ` Restored ${skill.heal} health and empowered the next strike.`;
				break;
		}

		this.skillButton.disableInteractive().setFillStyle(0x293630);
		this.skillButtonLabel.setText("ABILITY USED").setColor("#9eaca3");

		if (this.bossHealth === 0) {
			this.updateHealthDisplay();
			this.finishFight("victory");
			return;
		}

		this.receiveBossAttack(message);
	}

	private receiveBossAttack(message: string) {
		if (this.guarded) {
			this.guarded = false;
			message += " The boss attacks, but your guard holds.";
		} else {
			this.playerHealth = Math.max(0, this.playerHealth - 1);
			message += " The boss hits for 1 damage.";
		}

		this.updateHealthDisplay();
		this.statusLabel.setText(message);

		if (this.playerHealth === 0) this.finishFight("defeat");
	}

	private updateHealthDisplay() {
		this.playerHealthLabel.setText(`${this.playerHealth} / 6`);
		this.bossHealthLabel.setText(`${this.bossHealth} / 12`);
		this.playerHealthBar.setScale(this.playerHealth / 6, 1);
		this.bossHealthBar.setScale(this.bossHealth / 12, 1);
	}

	private finishFight(outcome: FightOutcome) {
		if (this.finished) return;
		this.finished = true;
		this.scene.start("results", {
			lifeNumber: this.lifeNumber,
			role: this.role,
			bossName: this.bossName,
			outcome,
		});
	}
}
