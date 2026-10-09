import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";
import { roles, type Role } from "../data/roles";

export class RoleSelectScene extends Phaser.Scene {
	private selectedRole: Role | undefined;
	private unlockedRoles = new Set<number>();
	private cardBackgrounds = new Map<number, Phaser.GameObjects.Rectangle>();
	private continueBackground!: Phaser.GameObjects.Rectangle;
	private continueLabel!: Phaser.GameObjects.Text;
	private selectionMessage!: Phaser.GameObjects.Text;

	constructor() {
		super("role-select");
	}

	preload() {
		this.load.image("seven-lives", "/art/seven-lives.svg");
	}

	create() {
		this.selectedRole = undefined;
		this.unlockedRoles = this.getUnlockedRoles();
		this.cardBackgrounds.clear();
		this.cameras.main.setBackgroundColor("#17424b");
		addMusicToggle(this, 882, 38);
		this.add
			.image(480, 270, "seven-lives")
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
				this.campaignComplete()
					? "ALL SEVEN LIVES CLEARED"
					: `${this.unlockedRoles.size} OF 7 LIVES UNLOCKED  /  ${this.nextRole()?.name.toUpperCase() ?? "CAMPAIGN COMPLETE"} READY`,
				{
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				color: "#d8e9d9",
				},
			)
			.setOrigin(0.5);

		this.add
			.text(480, 157, this.campaignComplete()
				? "EVERY LIFE CLEARED  /  START A NEW JOURNEY"
				: `CLEAR ${this.previousRoleName().toUpperCase()} TO UNLOCK THE NEXT LIFE`, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#f3c776",
			})
			.setOrigin(0.5);

		const displayedRoles = [
			...roles.filter((role) => role.id === 7),
			...roles.filter((role) => role.id === 3),
			...roles.filter((role) => role.id === 1),
			...roles.filter((role) => role.id === 2),
			...roles.filter((role) => role.id === 4),
			...roles.filter((role) => role.id === 5),
			...roles.filter((role) => role.id === 6),
		];
		displayedRoles.forEach((role, index) => this.createRoleCard(role, index));

		this.selectionMessage = this.add
			.text(480, 426, this.selectedRole
				? this.selectedMessage(this.selectedRole)
				: `${this.nextRole()?.name ?? "All lives"} is the next playable world.`, {
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
		const isAvailable = this.isRoleAvailable(role);
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
			.text(x - 76, y + 40, isAvailable ? "WORLD READY" : this.lockLabel(role), {
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
				this.selectionMessage.setText(this.lockMessage(role));
			}
		});
	}

	private selectRole(role: Role | undefined) {
		if (!role) return;
		if (!this.isRoleAvailable(role)) {
			this.selectionMessage.setText(this.lockMessage(role));
			return;
		}

		this.selectedRole = role;
		playSound("select");
		for (const [id, background] of this.cardBackgrounds) {
			const selected = id === role.id;
			background
				.setFillStyle(
					selected
						? 0x54876b
						: this.isRoleAvailable(roles.find((entry) => entry.id === id)!)
							? 0x286d66
							: 0x354d50,
				)
				.setStrokeStyle(
					selected ? 3 : 1,
					selected
						? 0xffd77a
						: this.isRoleAvailable(roles.find((entry) => entry.id === id)!)
							? 0x75aaa0
							: 0x68817a,
				);
		}

		this.continueBackground.setFillStyle(0xec8155);
		this.continueBackground.setStrokeStyle(2, 0xffd77a);
		this.continueLabel.setText(`CONTINUE AS ${role.name.toUpperCase()}`);
		this.continueLabel.setColor("#182b2b");
		this.selectionMessage.setText(this.selectedMessage(role));
	}

	private startLife() {
		if (!this.selectedRole) return;
		playSound("confirm");

		if (this.selectedRole.id === 7) {
			this.scene.start("chef-story");
		} else if (this.selectedRole.id === 3) {
			this.scene.start("engineer-story");
		} else if (this.selectedRole.id === 1) {
			this.scene.start("doctor-story");
		} else {
			this.scene.start("profession-story", { roleId: this.selectedRole.id });
		}
	}

	private isRoleAvailable(role: Role): boolean {
		return this.unlockedRoles.has(role.id);
	}

	private lockLabel(role: Role): string {
		const previous = this.previousRoleFor(role.id);
		return previous ? `CLEAR ${previous.name.toUpperCase()} FIRST` : "COMING SOON";
	}

	private lockMessage(role: Role): string {
		const previous = this.previousRoleFor(role.id);
		return previous
			? `Clear the ${previous.name} life to unlock ${role.name}.`
			: `${role.name}'s world is coming later.`;
	}

	private selectedMessage(role: Role): string {
		if (role.id === 7) return "Chef selected. Welcome to The Last Table.";
		if (role.id === 3) return "Engineer selected. The Signal Workshop needs you.";
		if (role.id === 1) return "Doctor selected. The Lantern Clinic is waiting.";
		return `${role.name} selected. Your next world is ready.`;
	}

	private getUnlockedRoles(): Set<number> {
		const order = [7, 3, 1, 2, 4, 5, 6];
		const unlocked = new Set<number>([order[0]]);
		for (let index = 0; index < order.length - 1; index += 1) {
			if (!this.isLifeComplete(order[index])) break;
			unlocked.add(order[index + 1]);
		}
		return unlocked;
	}

	private isLifeComplete(roleId: number): boolean {
		const keys: Record<number, string> = {
			7: "7-lives-chef-dinner-rush-cleared-v1",
			3: "7-lives-engineer-life-complete",
			1: "7-lives-doctor-life-complete-v1",
			2: "7-lives-lawyer-life-complete-v1",
			4: "7-lives-athlete-life-complete-v1",
			5: "7-lives-teacher-life-complete-v1",
			6: "7-lives-scientist-life-complete-v1",
		};
		try {
			return localStorage.getItem(keys[roleId]) === "true";
		} catch {
			return false;
		}
	}

	private previousRoleFor(roleId: number): Role | undefined {
		const order = [7, 3, 1, 2, 4, 5, 6];
		const previousId = order[order.indexOf(roleId) - 1];
		return roles.find((role) => role.id === previousId);
	}

	private nextRole(): Role | undefined {
		const order = [7, 3, 1, 2, 4, 5, 6];
		return roles.find((role) => !this.unlockedRoles.has(role.id) && order.includes(role.id));
	}

	private previousRoleName(): string {
		const next = this.nextRole();
		return next ? this.previousRoleFor(next.id)?.name ?? "previous life" : "all lives";
	}

	private campaignComplete(): boolean {
		return this.unlockedRoles.size === roles.length;
	}
}

