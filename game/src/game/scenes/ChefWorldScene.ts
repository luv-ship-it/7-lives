import Phaser from "phaser";
import { playSound } from "../audio/audioManager";

interface Ingredient {
	name: string;
	color: number;
	x: number;
	y: number;
	collected: boolean;
	visual: Phaser.GameObjects.Container;
}

type KitchenTarget =
	| { kind: "ingredient"; ingredient: Ingredient; x: number; y: number }
	| { kind: "stove"; x: number; y: number }
	| { kind: "serving"; x: number; y: number };

type Direction = "up" | "down" | "left" | "right";

export class ChefWorldScene extends Phaser.Scene {
	private chef!: Phaser.GameObjects.Image;
	private chefX = 105;
	private chefY = 438;
	private keysDown = new Set<string>();
	private touchDirections = new Set<Direction>();
	private ingredients: Ingredient[] = [];
	private phase: "gather" | "cook" | "serve" | "complete" = "gather";
	private pantryLabel!: Phaser.GameObjects.Text;
	private objectiveLabel!: Phaser.GameObjects.Text;
	private promptLabel!: Phaser.GameObjects.Text;
	private stoveGlow!: Phaser.GameObjects.Arc;
	private serveGlow!: Phaser.GameObjects.Arc;
	private elapsed = 0;

	constructor() {
		super("chef-world");
	}

	preload() {
		this.load.image("chef-kitchen", "/art/chef-kitchen.svg");
		this.load.image("chef", "/art/chef.svg");
	}

	create() {
		this.phase = "gather";
		this.chefX = 105;
		this.chefY = 438;
		this.elapsed = 0;
		this.keysDown.clear();
		this.touchDirections.clear();
		this.cameras.main.setBackgroundColor("#e9c888");
		this.add.image(480, 270, "chef-kitchen").setDisplaySize(960, 540);
		this.add.rectangle(480, 37, 960, 74, 0x246b65, 0.96);

		this.add
			.text(28, 22, "LIFE ONE  /  CHEF", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#ffe08c",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(28, 49, "The Last Table", {
				fontFamily: "Fraunces, serif",
				fontSize: "27px",
				color: "#fff3d8",
			})
			.setOrigin(0, 0.5);

		this.objectiveLabel = this.add
			.text(505, 31, "PANTRY RUN  /  Find the ingredients for tonight's soup", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				fontStyle: "bold",
				color: "#fff3d8",
			})
			.setOrigin(0.5);
		this.pantryLabel = this.add
			.text(906, 62, "PANTRY  0 / 3", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#ffe08c",
			})
			.setOrigin(1, 0.5);

		this.addStation(570, 327, "STOVE", 0xe88758);
		this.addStation(836, 317, "SERVING HATCH", 0x5db59b);
		this.stoveGlow = this.add.circle(570, 327, 36, 0xf4aa57, 0.14).setDepth(1);
		this.serveGlow = this.add.circle(836, 317, 36, 0x62d2ac, 0.12).setDepth(1);
		this.tweens.add({
			targets: this.stoveGlow,
			alpha: 0.38,
			duration: 900,
			yoyo: true,
			repeat: -1,
		});
		this.serveGlow.setAlpha(0.12);

		this.ingredients = [
			this.createIngredient("Tomato", 0xe96650, 240, 345),
			this.createIngredient("Mushroom", 0xd3a66c, 416, 442),
			this.createIngredient("Wild herb", 0x69aa66, 744, 375),
		];
		this.chef = this.add
			.image(this.chefX, this.chefY, "chef")
			.setOrigin(0.5, 0.86)
			.setScale(0.64)
			.setDepth(3);
		this.add
			.text(105, 374, "CHEF", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#24534f",
			})
			.setOrigin(0.5);

		this.add
			.rectangle(480, 497, 414, 38, 0x24534f, 0.95)
			.setStrokeStyle(2, 0xf2c66d)
			.setDepth(5);
		this.promptLabel = this.add
			.text(480, 497, "Find the tomato, mushroom, and wild herb.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#fff3d8",
				align: "center",
			})
			.setOrigin(0.5)
			.setDepth(6);

		this.addTouchButton(76, 446, "LEFT", "left");
		this.addTouchButton(148, 398, "UP", "up");
		this.addTouchButton(148, 494, "DOWN", "down");
		this.addTouchButton(220, 446, "RIGHT", "right");
		this.addInteractButton(864, 454);

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			this.keysDown.add(key);
			if (key === "e" || event.code === "Space") this.interact();
		});
		this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
			this.keysDown.delete(event.key.toLowerCase());
		});
	}

	update(_time: number, delta: number) {
		if (this.phase === "complete") return;
		this.elapsed += delta;
		const horizontal =
			Number(this.keysDown.has("d") || this.keysDown.has("arrowright") || this.touchDirections.has("right")) -
			Number(this.keysDown.has("a") || this.keysDown.has("arrowleft") || this.touchDirections.has("left"));
		const vertical =
			Number(this.keysDown.has("s") || this.keysDown.has("arrowdown") || this.touchDirections.has("down")) -
			Number(this.keysDown.has("w") || this.keysDown.has("arrowup") || this.touchDirections.has("up"));
		const direction = new Phaser.Math.Vector2(horizontal, vertical);
		if (direction.lengthSq() > 0) {
			direction.normalize();
			this.chefX = Phaser.Math.Clamp(this.chefX + direction.x * 215 * delta / 1000, 50, 914);
			this.chefY = Phaser.Math.Clamp(this.chefY + direction.y * 190 * delta / 1000, 150, 465);
			this.chef.setPosition(this.chefX, this.chefY + Math.sin(this.elapsed / 85) * 2);
			if (direction.x !== 0) this.chef.setFlipX(direction.x < 0);
		} else {
			this.chef.setPosition(this.chefX, this.chefY + Math.sin(this.elapsed / 480) * 1.5);
		}

		const target = this.findTarget();
		this.updatePrompt(target);
	}

	private createIngredient(name: string, color: number, x: number, y: number): Ingredient {
		const visual = this.add.container(x, y).setDepth(2);
		visual.add(this.add.ellipse(0, 16, 62, 24, 0x385f4e, 0.18));
		visual.add(this.add.ellipse(0, 9, 51, 21, 0xfff4d9).setStrokeStyle(3, 0xd0a064));
		const food = this.add.graphics();
		food.fillStyle(color, 1);
		if (name === "Mushroom") {
			food.fillRoundedRect(-6, -5, 12, 25, 5);
			food.fillEllipse(0, -5, 34, 22);
			food.fillStyle(0xfff0d1, 0.9);
			food.fillCircle(-7, -7, 2);
			food.fillCircle(6, -4, 2);
		} else if (name === "Wild herb") {
			food.lineStyle(4, color, 1);
			food.lineBetween(0, 13, 0, -12);
			food.fillEllipse(-8, 2, 20, 9);
			food.fillEllipse(9, -4, 21, 9);
			food.fillEllipse(-6, -9, 19, 8);
		} else {
			food.fillCircle(0, 0, 15);
			food.fillStyle(0x72a95c, 1);
			food.fillTriangle(-4, -13, 0, -22, 4, -12);
			food.fillTriangle(0, -13, 10, -21, 6, -10);
		}
		visual.add(food);
		const label = this.add
			.text(x, y + 39, name.toUpperCase(), {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				fontStyle: "bold",
				color: "#24534f",
				backgroundColor: "#fff4d9",
				padding: { x: 6, y: 3 },
			})
			.setOrigin(0.5)
			.setDepth(2);
		visual.add(label);
		return { name, color, x, y, collected: false, visual };
	}

	private addStation(x: number, y: number, name: string, color: number) {
		this.add
			.circle(x, y, 28, 0xfff2d4, 0.9)
			.setStrokeStyle(3, color)
			.setDepth(1);
		this.add
			.text(x, y, name === "STOVE" ? "POT" : "PLATE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				fontStyle: "bold",
				color: "#24534f",
			})
			.setOrigin(0.5)
			.setDepth(2);
		this.add
			.text(x, y + 42, name, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				fontStyle: "bold",
				color: "#fff4d9",
				backgroundColor: "#24534f",
				padding: { x: 6, y: 3 },
			})
			.setOrigin(0.5)
			.setDepth(2);
	}

	private addTouchButton(x: number, y: number, label: string, direction: Direction) {
		const button = this.add
			.rectangle(x, y, 58, 48, 0x24534f, 0.86)
			.setStrokeStyle(2, 0xffd77a)
			.setInteractive({ useHandCursor: true })
			.setDepth(8);
		this.add
			.text(x, y, label, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				fontStyle: "bold",
				color: "#fff4d9",
			})
			.setOrigin(0.5)
			.setDepth(9);
		button.on("pointerdown", () => this.touchDirections.add(direction));
		button.on("pointerup", () => this.touchDirections.delete(direction));
		button.on("pointerupoutside", () => this.touchDirections.delete(direction));
		button.on("pointerout", () => this.touchDirections.delete(direction));
	}

	private addInteractButton(x: number, y: number) {
		const button = this.add
			.rectangle(x, y, 112, 56, 0xec8155)
			.setStrokeStyle(3, 0xffd77a)
			.setInteractive({ useHandCursor: true })
			.setDepth(8);
		this.add
			.text(x, y, "E  /  USE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#fff4d9",
			})
			.setOrigin(0.5)
			.setDepth(9);
		button.on("pointerdown", () => this.interact());
	}

	private findTarget(): KitchenTarget | undefined {
		if (this.phase === "cook") {
			return this.closestTarget([{ kind: "stove", x: 570, y: 327 }]);
		}
		if (this.phase === "gather") {
			const available: KitchenTarget[] = this.ingredients
				.filter((ingredient) => !ingredient.collected)
				.map((ingredient) => ({
					kind: "ingredient" as const,
					ingredient,
					x: ingredient.x,
					y: ingredient.y,
				}));
			if (available.length === 0) available.push({ kind: "stove", x: 570, y: 327 });
			return this.closestTarget(available);
		}
		if (this.phase === "serve") {
			return this.closestTarget([{ kind: "serving", x: 836, y: 317 }]);
		}
		return undefined;
	}

	private closestTarget(targets: KitchenTarget[]): KitchenTarget | undefined {
		return targets
			.map((target) => ({
				target,
				distance: Phaser.Math.Distance.Between(this.chefX, this.chefY, target.x, target.y),
			}))
			.filter(({ distance }) => distance < 68)
			.sort((first, second) => first.distance - second.distance)[0]?.target;
	}

	private updatePrompt(target: KitchenTarget | undefined) {
		let prompt = "Explore the kitchen. Collect the tomato, mushroom, and wild herb.";
		if (target?.kind === "ingredient") prompt = `E  /  PICK UP ${target.ingredient.name.toUpperCase()}`;
		if (target?.kind === "stove") prompt = "E  /  COOK THE SOUP AT THE STOVE";
		if (target?.kind === "serving") prompt = "E  /  SERVE THE SOUP AT THE HATCH";
		if (this.phase === "cook") prompt = "All ingredients gathered. Find the stove.";
		if (this.promptLabel.text !== prompt) this.promptLabel.setText(prompt);
	}

	private interact() {
		if (this.phase === "complete") return;
		const target = this.findTarget();
		if (!target) {
			playSound("select");
			return;
		}

		if (target.kind === "ingredient") {
			target.ingredient.collected = true;
			target.ingredient.visual.destroy();
			playSound("select");
			const count = this.ingredients.filter((ingredient) => ingredient.collected).length;
			this.pantryLabel.setText(`PANTRY  ${count} / 3`);
			if (count === this.ingredients.length) {
				this.phase = "cook";
				this.objectiveLabel.setText("RECIPE READY  /  Bring everything to the stove");
				this.stoveGlow.setAlpha(0.5);
			}
			return;
		}

		if (target.kind === "stove" && this.phase === "cook") {
			this.phase = "serve";
			this.objectiveLabel.setText("SOUP IS READY  /  Take it to the serving hatch");
			this.promptLabel.setText("The kitchen smells like home. Deliver the bowl.");
			this.stoveGlow.setFillStyle(0xf2c66d, 0.4);
			this.serveGlow.setAlpha(0.5);
			this.tweens.add({
				targets: this.stoveGlow,
				scale: 1.45,
				alpha: 0,
				duration: 700,
				yoyo: true,
			});
			playSound("skill");
			return;
		}

		if (target.kind === "serving" && this.phase === "serve") this.completeLife();
	}

	private completeLife() {
		this.phase = "complete";
		playSound("victory");
		try {
			localStorage.setItem("7-lives-chef-life-complete", "true");
		} catch {
			// Completion remains visible for this run if browser storage is unavailable.
		}

		this.add.rectangle(480, 270, 960, 540, 0x173943, 0.52).setDepth(10);
		this.add
			.rectangle(480, 268, 610, 286, 0xfff0cf)
			.setStrokeStyle(4, 0xe88758)
			.setDepth(11);
		this.add
			.text(480, 186, "FIRST SERVICE  /  CHEF LIFE", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#b85d46",
			})
			.setOrigin(0.5)
			.setDepth(12);
		this.add
			.text(480, 237, "A warm meal\nfor a cold city.", {
				fontFamily: "Fraunces, serif",
				fontSize: "42px",
				color: "#24534f",
				align: "center",
				lineSpacing: -3,
			})
			.setOrigin(0.5)
			.setDepth(12);
		this.add
			.text(480, 315, "The first life is complete. The next life will be a new world.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				color: "#506b5c",
			})
			.setOrigin(0.5)
			.setDepth(12);

		const restart = this.add
			.rectangle(480, 365, 226, 42, 0x246b65)
			.setStrokeStyle(2, 0xf2c66d)
			.setInteractive({ useHandCursor: true })
			.setDepth(12);
		this.add
			.text(480, 365, "COOK ANOTHER MEAL", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#fff3d8",
			})
			.setOrigin(0.5)
			.setDepth(13);
		restart.on("pointerdown", () => this.scene.restart());
	}
}