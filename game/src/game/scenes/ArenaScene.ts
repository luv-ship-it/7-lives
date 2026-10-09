import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";
import type { Role } from "../data/roles";

interface ArenaSceneData {
	lifeNumber: number;
	role: Role;
}

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

export class ArenaScene extends Phaser.Scene {
	private lifeNumber = 1;
	private role!: Role;
	private bossName = bossNames[0];
	private playerHealth = 4;
	private bossHealth = 6;
	private empoweredDamage = 0;
	private guardCharges = 0;
	private skillUsed = false;
	private finished = false;
	private playerX = 250;
	private readonly playerFloorY = 404;
	private playerSprite!: Phaser.GameObjects.Image;
	private bossSprite!: Phaser.GameObjects.Image;
	private playerHealthText!: Phaser.GameObjects.Text;
	private bossHealthText!: Phaser.GameObjects.Text;
	private playerHealthBar!: Phaser.GameObjects.Rectangle;
	private bossHealthBar!: Phaser.GameObjects.Rectangle;
	private statusText!: Phaser.GameObjects.Text;
	private warningLine!: Phaser.GameObjects.Rectangle;
	private skillButton!: Phaser.GameObjects.Rectangle;
	private skillLabel!: Phaser.GameObjects.Text;
	private leftHeld = false;
	private rightHeld = false;
	private keyboardLeft = false;
	private keyboardRight = false;
	private dodgeWindow = 0;
	private dodgeCooldown = 0;
	private strikeCooldown = 0;
	private attackTimer = 1850;
	private attackWindup = 0;

	constructor() {
		super("boss");
	}

	create({ lifeNumber, role }: ArenaSceneData) {
		if (!role) {
			this.scene.start("role-select");
			return;
		}

		this.lifeNumber = lifeNumber;
		this.role = role;
		this.bossName = bossNames[(lifeNumber - 1) % bossNames.length];
		this.playerHealth = 4;
		this.bossHealth = 6;
		this.empoweredDamage = 0;
		this.guardCharges = 0;
		this.skillUsed = false;
		this.finished = false;
		this.playerX = 250;
		this.dodgeWindow = 0;
		this.dodgeCooldown = 0;
		this.strikeCooldown = 0;
		this.attackTimer = 1850;
		this.attackWindup = 0;
		this.leftHeld = false;
		this.rightHeld = false;
		this.keyboardLeft = false;
		this.keyboardRight = false;

		this.add.image(480, 270, "last-light").setDisplaySize(960, 540);
		this.add.rectangle(480, 270, 960, 540, 0x0c1513).setAlpha(0.12);
		this.add.rectangle(480, 39, 960, 78, 0x17434a).setAlpha(0.84);
		addMusicToggle(this, 894, 104);

		this.add
			.text(44, 27, `LIFE ${String(lifeNumber).padStart(2, "0")} / 07`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#d2a260",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(44, 51, role.name.toUpperCase(), {
				fontFamily: "Fraunces, serif",
				fontSize: "22px",
				color: "#f1eadb",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(44, 77, "HEALTH", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#b6c2b9",
			})
			.setOrigin(0, 0.5);
		this.add.rectangle(98, 77, 204, 10, 0x33514a).setOrigin(0, 0.5);
		this.playerHealthBar = this.add
			.rectangle(98, 77, 204, 10, 0xa5dc80)
			.setOrigin(0, 0.5);
		this.playerHealthText = this.add
			.text(315, 77, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#e3e8df",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(916, 27, `LIFE ${lifeNumber} BOSS`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#d2775d",
			})
			.setOrigin(1, 0.5);
		this.add
			.text(916, 51, this.bossName.toUpperCase(), {
				fontFamily: "Fraunces, serif",
				fontSize: "22px",
				color: "#f1eadb",
			})
			.setOrigin(1, 0.5);
		this.add
			.text(658, 77, "WARDEN", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#d0a69a",
			})
			.setOrigin(0, 0.5);
		this.add.rectangle(718, 77, 170, 10, 0x5d3934).setOrigin(0, 0.5);
		this.bossHealthBar = this.add
			.rectangle(718, 77, 170, 10, 0xff8068)
			.setOrigin(0, 0.5);
		this.bossHealthText = this.add
			.text(916, 77, "", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#e3e8df",
			})
			.setOrigin(1, 0.5);

		this.playerSprite = this.add
			.image(this.playerX, this.playerFloorY, "traveler")
			.setOrigin(0.5, 1)
			.setScale(0.76)
			.setDepth(2);
		this.bossSprite = this.add
			.image(740, this.playerFloorY, "warden")
			.setOrigin(0.5, 1)
			.setScale(0.68)
			.setDepth(2);

		this.add
			.text(this.playerX, 222, role.name.toUpperCase(), {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#ead8ac",
			})
			.setOrigin(0.5);
		this.add
			.text(740, 190, this.bossName.toUpperCase(), {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				color: "#df9b80",
			})
			.setOrigin(0.5);

		this.warningLine = this.add
			.rectangle(480, this.playerFloorY - 4, 800, 8, 0xee7356)
			.setAlpha(0)
			.setDepth(3);
		this.statusText = this.add
			.text(480, 427, "The Warden is watching. Find your moment.", {
				fontFamily: "Fraunces, serif",
				fontSize: "17px",
				color: "#f1eadb",
				align: "center",
				wordWrap: { width: 720 },
			})
			.setOrigin(0.5);

		this.createHoldButton(72, "MOVE LEFT", (held) => (this.leftHeld = held));
		this.createHoldButton(184, "MOVE RIGHT", (held) => (this.rightHeld = held));
		this.createActionButton(430, "STRIKE", "J", () => this.strike(), 132);
		this.createActionButton(594, "DODGE", "SPACE", () => this.dodge(), 132);
		const roleControl = this.createActionButton(
			798,
			role.ability.toUpperCase(),
			"Q",
			() => this.useRoleSkill(),
			210,
		);
		this.skillButton = roleControl.background;
		this.skillLabel = roleControl.label;

		this.add
			.text(480, 532, "MOVE WITH A / D OR ARROWS    STRIKE J    DODGE SPACE    ROLE SKILL Q", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#c4c0ae",
			})
			.setOrigin(0.5);

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			if (key === "a" || event.key === "ArrowLeft") this.keyboardLeft = true;
			if (key === "d" || event.key === "ArrowRight") this.keyboardRight = true;
			if (key === "j") this.strike();
			if (event.code === "Space") this.dodge();
			if (key === "q") this.useRoleSkill();
		});
		this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			if (key === "a" || event.key === "ArrowLeft") this.keyboardLeft = false;
			if (key === "d" || event.key === "ArrowRight") this.keyboardRight = false;
		});

		this.updateHealthDisplay();
	}

	update(_time: number, delta: number) {
		if (this.finished) return;

		const moveDirection =
			Number(this.rightHeld || this.keyboardRight) -
			Number(this.leftHeld || this.keyboardLeft);
		if (moveDirection !== 0) {
			this.playerX = Phaser.Math.Clamp(
				this.playerX + moveDirection * 260 * (delta / 1000),
				105,
				445,
			);
			this.playerSprite.x = this.playerX;
			this.playerSprite.setFlipX(moveDirection < 0);
		}

		this.strikeCooldown = Math.max(0, this.strikeCooldown - delta);
		this.dodgeCooldown = Math.max(0, this.dodgeCooldown - delta);

		if (this.attackWindup > 0) {
			this.attackWindup -= delta;
			if (this.attackWindup <= 0) this.resolveBossAttack();
		} else {
			this.attackTimer -= delta;
			if (this.attackTimer <= 0) this.beginBossAttack();
		}

		this.dodgeWindow = Math.max(0, this.dodgeWindow - delta);
	}

	private createHoldButton(
		x: number,
		label: string,
		setHeld: (held: boolean) => void,
	) {
		const background = this.add
			.rectangle(x, 486, 100, 46, 0x1c2b27)
			.setStrokeStyle(1, 0x6a7562)
			.setInteractive({ useHandCursor: true });
		this.add
			.text(x, 486, label, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: "#e4dfce",
				align: "center",
				wordWrap: { width: 88 },
			})
			.setOrigin(0.5);
		background.on("pointerdown", () => setHeld(true));
		background.on("pointerup", () => setHeld(false));
		background.on("pointerupoutside", () => setHeld(false));
		background.on("pointerout", () => setHeld(false));
	}

	private createActionButton(
		x: number,
		label: string,
		keyLabel: string,
		onPress: () => void,
		width: number,
	): { background: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
		const background = this.add
			.rectangle(x, 486, width, 46, 0x3b4738)
			.setStrokeStyle(1, 0x958356)
			.setInteractive({ useHandCursor: true });
		const text = this.add
			.text(x, 486, `${label}  /  ${keyLabel}`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#f1eadb",
				align: "center",
				wordWrap: { width: width - 16 },
			})
			.setOrigin(0.5);
		background.on("pointerover", () => background.setFillStyle(0x596648));
		background.on("pointerout", () => background.setFillStyle(0x3b4738));
		background.on("pointerdown", onPress);
		return { background, label: text };
	}

	private strike() {
		if (this.finished || this.strikeCooldown > 0) return;
		playSound("strike");
		this.strikeCooldown = 380;
		const damage = 1 + this.empoweredDamage;
		this.empoweredDamage = 0;
		this.damageBoss(damage, `${this.role.name} lands a ${damage}-point strike.`);

		const slash = this.add.graphics().setDepth(4);
		slash.lineStyle(7, 0xe2ad58, 0.95);
		slash.beginPath();
		slash.moveTo(this.playerX + 32, this.playerFloorY - 102);
		slash.lineTo(650, this.playerFloorY - 126);
		slash.strokePath();
		this.tweens.add({
			targets: slash,
			alpha: 0,
			duration: 180,
			onComplete: () => slash.destroy(),
		});
	}

	private damageBoss(amount: number, message: string) {
		this.bossHealth = Math.max(0, this.bossHealth - amount);
		this.updateHealthDisplay();
		this.statusText.setText(message);
		this.bossSprite.setTint(0xffdca0);
		this.time.delayedCall(120, () => this.bossSprite.clearTint());
		this.tweens.add({
			targets: this.bossSprite,
			x: 752,
			duration: 70,
			yoyo: true,
			repeat: 1,
		});

		if (this.bossHealth === 0) this.finishFight("victory");
	}

	private dodge() {
		if (this.finished || this.dodgeCooldown > 0) return;
		playSound("dodge");
		this.dodgeCooldown = 850;
		this.dodgeWindow = 620;
		this.statusText.setText("Hold your nerve. The Warden is lining up a strike.");
		const dashDirection = this.playerX < 390 ? 1 : -1;
		const dashX = Phaser.Math.Clamp(this.playerX + dashDirection * 76, 105, 445);
		this.playerX = dashX;
		this.tweens.add({
			targets: this.playerSprite,
			x: dashX,
			y: this.playerFloorY - 46,
			alpha: 0.62,
			duration: 130,
			yoyo: true,
			ease: "Sine.easeOut",
			onComplete: () => {
				this.playerSprite.setY(this.playerFloorY).setAlpha(1);
			},
		});
	}

	private useRoleSkill() {
		if (this.finished || this.skillUsed) return;
		playSound("skill");
		this.skillUsed = true;
		const skill = this.role.skill;
		let message = `${this.role.name} uses ${this.role.ability}.`;

		switch (skill.type) {
			case "heal":
				this.playerHealth = Math.min(4, this.playerHealth + skill.amount);
				message += ` Restored ${skill.amount} health.`;
				break;
			case "guard":
				this.guardCharges = 1;
				message += " The next Warden strike will be blocked.";
				break;
			case "empower":
				this.empoweredDamage = skill.amount;
				message += ` Your next strike gains ${skill.amount} damage.`;
				break;
			case "strike":
				message += ` Deals ${skill.amount} damage.`;
				this.damageBoss(skill.amount, message);
				break;
			case "rally":
				this.playerHealth = Math.min(4, this.playerHealth + skill.heal);
				this.empoweredDamage = skill.damage;
				message += " Restored health and empowered your next strike.";
				break;
		}

		this.skillButton.disableInteractive().setFillStyle(0x29332e);
		this.skillLabel.setText("ROLE SKILL USED").setColor("#aeb8ac");
		this.statusText.setText(message);
		this.updateHealthDisplay();
	}

	private beginBossAttack() {
		playSound("warning");
		this.attackWindup = 1050;
		this.warningLine.setAlpha(0.8);
		this.statusText.setText(`${this.bossName} winds up. Dodge the red strike.`);
		this.tweens.add({
			targets: this.bossSprite,
			scaleX: 0.76,
			duration: 170,
			yoyo: true,
			repeat: 2,
		});
	}

	private resolveBossAttack() {
		this.attackWindup = 0;
		this.warningLine.setAlpha(0);
		this.attackTimer = 2250;

		if (this.dodgeWindow > 0) {
			playSound("dodge");
			this.statusText.setText("Perfect dodge. The Warden's strike tears through empty air.");
			this.cameras.main.shake(90, 0.003);
		} else if (this.guardCharges > 0) {
			this.guardCharges -= 1;
			this.statusText.setText("Your role skill absorbs the Warden's strike.");
			this.cameras.main.shake(90, 0.003);
		} else {
			playSound("hurt");
			this.playerHealth = Math.max(0, this.playerHealth - 1);
			this.statusText.setText("The strike lands. Find the next dodge window.");
			this.cameras.main.shake(180, 0.008);
		}

		this.updateHealthDisplay();
		if (this.playerHealth === 0) this.finishFight("defeat");
	}

	private updateHealthDisplay() {
		this.playerHealthText.setText(`${this.playerHealth} / 4`);
		this.bossHealthText.setText(`${this.bossHealth} / 6`);
		this.tweens.add({
			targets: this.playerHealthBar,
			scaleX: this.playerHealth / 4,
			duration: 150,
		});
		this.tweens.add({
			targets: this.bossHealthBar,
			scaleX: this.bossHealth / 6,
			duration: 150,
		});
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