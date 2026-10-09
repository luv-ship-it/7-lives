import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";
import { roles, type Role } from "../data/roles";

export class RoleSelectScene extends Phaser.Scene {
	private selectedRole: Role | undefined;
	private cardBackgrounds = new Map<number, Phaser.GameObjects.Rectangle>();
	private continueBackground!: Phaser.GameObjects.Rectangle;
	private continueLabel!: Phaser.GameObjects.Text;
	private selectionMessage!: Phaser.GameObjects.Text;

	constructor() {
		super("role-select");
	}

	preload() {
		this.load.image("chef-kitchen", "/art/chef-kitchen.svg");
	}

	create() {
		this.selectedRole = undefined;
		this.cardBackgrounds.clear();
		this.cameras.main.setBackgroundColor("#17424b");
		addMusicToggle(this, 882, 38);
		this.add
			.image(480, 270, "chef-kitchen")
			.setDisplaySize(960, 540)
			.setAlpha(0.9)
			.setDepth(-2);
		this.add
			.rectangle(480, 270, 960, 540, 0x123943)
			.setAlpha(0.48)
			.setDepth(-1);

		this.add
			.text(480, 47, "SEVEN LIVES", {
				fontFamily: "Fraunces, serif",
				fontSize: "15px",
				color: "#ffd77a",
				letterSpacing: 2,
			})
			.setOrigin(0.5);

		this.add
			.text(480, 88, "Choose your first life", {
				fontFamily: "Fraunces, serif",
				fontSize: "38px",
				color: "#fff0cf",
			})
			.setOrigin(0.5);

		this.add
			.text(
				480,
				130,
				"LIFE 01  /  THE CHEF'S WORLD IS READY",
				{
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				color: "#d8e9d9",
				},
			)
			.setOrigin(0.5);

		this.add
			.text(480, 157, "CHOOSE A LIFE TO ENTER  /  OTHER WORLDS WILL OPEN LATER", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#f3c776",
			})
			.setOrigin(0.5);

		const displayedRoles = [
			...roles.filter((role) => role.id === 7),
			...roles.filter((role) => role.id !== 7),
		];
		displayedRoles.forEach((role, index) => this.createRoleCard(role, index));

		this.selectionMessage = this.add
			.text(480, 426, "Chef is the first playable life. Choose Chef to begin.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				color: "#fff0cf",
			})
			.setOrigin(0.5);

		this.continueBackground = this.add
			.rectangle(480, 464, 270, 48, 0xec8155)
			.setStrokeStyle(2, 0xffd77a)
			.setInteractive({ useHandCursor: true });

		this.continueLabel = this.add
			.text(480, 464, "SELECT A ROLE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "14px",
				color: "#fff0cf",
			})
			.setOrigin(0.5);

		this.continueBackground.on("pointerover", () => {
			if (this.selectedRole) this.continueBackground.setFillStyle(0xffa36f);
		});
		this.continueBackground.on("pointerout", () => {
			this.continueBackground.setFillStyle(
				this.selectedRole ? 0xec8155 : 0x245e61,
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

	}

	private createRoleCard(role: Role, index: number) {
		const isTopRow = index < 4;
		const column = isTopRow ? index : index - 4;
		const x = isTopRow ? 150 + column * 220 : 260 + column * 220;
		const y = isTopRow ? 228 : 350;
		const isAvailable = role.id === 7;
		const background = this.add
			.rectangle(x, y, 194, 102, isAvailable ? 0x286d66 : 0x354d50)
			.setStrokeStyle(isAvailable ? 3 : 1, isAvailable ? 0xffd77a : 0x68817a)
			.setInteractive({ useHandCursor: true });

		this.cardBackgrounds.set(role.id, background);

		this.add
			.text(x - 76, y - 32, `0${role.id}`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: isAvailable ? "#ffe08c" : "#a9beb0",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(x - 76, y - 10, role.name, {
				fontFamily: "Fraunces, serif",
				fontSize: "21px",
				color: isAvailable ? "#fff0cf" : "#c7d0c4",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(x - 76, y + 19, role.description, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: isAvailable ? "#e4f0dc" : "#aebeb1",
				wordWrap: { width: 158 },
			})
			.setOrigin(0, 0.5);

		this.add
			.text(x - 76, y + 40, isAvailable ? "WORLD READY" : "COMING SOON", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				color: isAvailable ? "#ffe08c" : "#f2a184",
			})
			.setOrigin(0, 0.5);

		background.on("pointerover", () => {
			if (isAvailable && this.selectedRole?.id !== role.id) background.setFillStyle(0x38877b);
		});
		background.on("pointerout", () => {
			if (isAvailable && this.selectedRole?.id !== role.id) background.setFillStyle(0x286d66);
		});
		background.on("pointerdown", () => {
			if (isAvailable) {
				this.selectRole(role);
			} else {
				playSound("select");
				this.selectionMessage.setText(`${role.name}'s life is coming later. The Chef's world is ready now.`);
			}
		});
	}

	private selectRole(role: Role | undefined) {
		if (!role) return;
		if (role.id !== 7) {
			this.selectionMessage.setText(`${role.name}'s life is coming later. The Chef's world is ready now.`);
			return;
		}

		this.selectedRole = role;
		playSound("select");
		for (const [id, background] of this.cardBackgrounds) {
			const selected = id === role.id;
			background
				.setFillStyle(selected ? 0x54876b : id === 7 ? 0x286d66 : 0x354d50)
				.setStrokeStyle(
					selected ? 3 : 1,
					selected ? 0xffd77a : id === 7 ? 0x75aaa0 : 0x68817a,
				);
		}

		this.continueBackground.setFillStyle(0xec8155);
		this.continueBackground.setStrokeStyle(2, 0xffd77a);
		this.continueLabel.setText(`CONTINUE AS ${role.name.toUpperCase()}`);
		this.continueLabel.setColor("#182b2b");
		this.selectionMessage.setText("Chef selected. Welcome to The Last Table.");
	}

	private startLife() {
		if (!this.selectedRole) return;
		playSound("confirm");

		this.scene.start("chef-story");
	}
}

