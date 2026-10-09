import Phaser from "phaser";
import { playSound } from "../audio/audioManager";

type Direction = "up" | "down" | "left" | "right";
type PieceShape = "corner" | "straight";

interface CircuitPiece {
	col: number;
	row: number;
	shape: PieceShape;
	rotation: number;
}

interface CircuitPuzzle {
	name: string;
	output: { col: number; row: number; port: number };
	pieces: CircuitPiece[];
	solution: number[];
}

interface RepairStation {
	name: string;
	x: number;
	y: number;
	color: number;
	repaired: boolean;
}

const puzzleLayouts: CircuitPuzzle[] = [
	{
		name: "GENERATOR RELAY",
		output: { col: 3, row: 1, port: 3 },
		solution: [3, 1, 2, 0],
		pieces: [
			{ col: 1, row: 1, shape: "corner", rotation: 0 },
			{ col: 1, row: 0, shape: "corner", rotation: 2 },
			{ col: 2, row: 0, shape: "corner", rotation: 3 },
			{ col: 2, row: 1, shape: "corner", rotation: 1 },
		],
	},
	{
		name: "WATER PUMP RELAY",
		output: { col: 3, row: 1, port: 3 },
		solution: [2, 0, 0, 1],
		pieces: [
			{ col: 1, row: 1, shape: "corner", rotation: 0 },
			{ col: 1, row: 2, shape: "corner", rotation: 1 },
			{ col: 2, row: 2, shape: "straight", rotation: 0 },
			{ col: 2, row: 1, shape: "corner", rotation: 2 },
		],
	},
	{
		name: "STREETLIGHT RELAY",
		output: { col: 3, row: 1, port: 0 },
		solution: [3, 1, 0, 2],
		pieces: [
			{ col: 1, row: 1, shape: "corner", rotation: 0 },
			{ col: 1, row: 0, shape: "corner", rotation: 2 },
			{ col: 2, row: 0, shape: "straight", rotation: 1 },
			{ col: 3, row: 0, shape: "corner", rotation: 3 },
		],
	},
];

const directions = [
	{ col: 0, row: -1 },
	{ col: 1, row: 0 },
	{ col: 0, row: 1 },
	{ col: -1, row: 0 },
];

export class EngineerWorldScene extends Phaser.Scene {
	private engineer!: Phaser.GameObjects.Image;
	private engineerX = 108;
	private engineerY = 440;
	private keysDown = new Set<string>();
	private touchDirections = new Set<Direction>();
	private stations: RepairStation[] = [];
	private systemLabel!: Phaser.GameObjects.Text;
	private messageLabel!: Phaser.GameObjects.Text;
	private activeStation = -1;
	private activePuzzle: CircuitPuzzle | undefined;
	private puzzleLayer: Phaser.GameObjects.Container | undefined;
	private hintStep = 0;
	private hintedPieceIndex = -1;
	private hintText = "Tap HINT for a nudge. Numbered tiles rotate clockwise.";
	private elapsed = 0;
	private complete = false;

	constructor() {
		super("engineer-world");
	}

	preload() {
		this.load.image("engineer-workshop", "/art/engineer-workshop.svg");
		this.load.image("engineer", "/art/engineer.svg");
	}

	create() {
		this.engineerX = 108;
		this.engineerY = 440;
		this.keysDown.clear();
		this.touchDirections.clear();
		this.activeStation = -1;
		this.activePuzzle = undefined;
		this.puzzleLayer = undefined;
		this.elapsed = 0;
		this.complete = false;
		this.stations = [
			{ name: "GENERATOR", x: 256, y: 340, color: 0xe9b85c, repaired: false },
			{ name: "WATER PUMP", x: 522, y: 410, color: 0x62a9a0, repaired: false },
			{ name: "STREETLIGHTS", x: 785, y: 342, color: 0xe88758, repaired: false },
		];

		this.cameras.main.setBackgroundColor("#c8dfd2");
		this.add.image(480, 270, "engineer-workshop").setDisplaySize(960, 540);
		this.add.rectangle(480, 37, 960, 74, 0x246b65, 0.97);
		this.add
			.text(28, 21, "LIFE TWO  /  ENGINEER", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#ffe08c",
			})
			.setOrigin(0, 0.5);
		this.add
			.text(28, 49, "The Signal Workshop", {
				fontFamily: "Fraunces, serif",
				fontSize: "27px",
				color: "#fff3d8",
			})
			.setOrigin(0, 0.5);

		this.add
			.text(600, 26, "RESTORE POWER  /  Repair all three systems", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "13px",
				fontStyle: "bold",
				color: "#fff3d8",
			})
			.setOrigin(0.5);
		this.systemLabel = this.add
			.text(906, 61, "SYSTEMS  0 / 3", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				fontStyle: "bold",
				color: "#ffe08c",
			})
			.setOrigin(1, 0.5);

		this.stations.forEach((station, index) => this.drawStation(station, index));
		this.engineer = this.add
			.image(this.engineerX, this.engineerY, "engineer")
			.setOrigin(0.5, 0.86)
			.setScale(0.66)
			.setDepth(3);
		this.add
			.text(this.engineerX, this.engineerY - 58, "ENGINEER", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "9px",
				fontStyle: "bold",
				color: "#24534f",
			})
			.setOrigin(0.5);

		this.messageLabel = this.add
			.text(480, 497, "Walk to a relay and press E to inspect its circuit.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#fff3d8",
				backgroundColor: "#24534f",
				padding: { x: 14, y: 8 },
			})
			.setOrigin(0.5)
			.setDepth(5);

		this.addTouchButton(76, 446, "LEFT", "left");
		this.addTouchButton(148, 398, "UP", "up");
		this.addTouchButton(148, 494, "DOWN", "down");
		this.addTouchButton(220, 446, "RIGHT", "right");
		this.addInteractButton(864, 454);

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			this.keysDown.add(key);
			if (key === "e" && !this.puzzleLayer) this.interactWithStation();
			if (key === "escape" && this.puzzleLayer) this.closePuzzle();
		});
		this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
			this.keysDown.delete(event.key.toLowerCase());
		});
	}

	update(_time: number, delta: number) {
		if (this.complete || this.puzzleLayer) return;
		this.elapsed += delta;
		const horizontal =
			Number(this.keysDown.has("d") || this.keysDown.has("arrowright") || this.touchDirections.has("right")) -
			Number(this.keysDown.has("a") || this.keysDown.has("arrowleft") || this.touchDirections.has("left"));
		const vertical =
			Number(this.keysDown.has("s") || this.keysDown.has("arrowdown") || this.touchDirections.has("down")) -
			Number(this.keysDown.has("w") || this.keysDown.has("arrowup") || this.touchDirections.has("up"));
		const movement = new Phaser.Math.Vector2(horizontal, vertical);
		if (movement.lengthSq() > 0) {
			movement.normalize();
			this.engineerX = Phaser.Math.Clamp(this.engineerX + movement.x * 215 * delta / 1000, 48, 912);
			this.engineerY = Phaser.Math.Clamp(this.engineerY + movement.y * 190 * delta / 1000, 145, 465);
			this.engineer.setPosition(this.engineerX, this.engineerY + Math.sin(this.elapsed / 85) * 2);
			if (movement.x !== 0) this.engineer.setFlipX(movement.x < 0);
		} else {
			this.engineer.setPosition(this.engineerX, this.engineerY + Math.sin(this.elapsed / 480) * 1.5);
		}

		const station = this.nearestStation();
		const message = station
			? station.repaired
				? `${station.name} is online.`
				: `E  /  INSPECT ${station.name}`
			: "Walk to a relay and press E to inspect its circuit.";
		if (message !== this.messageLabel.text) this.messageLabel.setText(message);
	}

	private drawStation(station: RepairStation, index: number) {
		this.add.circle(station.x, station.y, 34, 0xfff2d4, 0.92).setStrokeStyle(3, station.color).setDepth(1);
		this.add.circle(station.x, station.y, 20, 0x315b55).setDepth(2);
		this.add.text(station.x, station.y, `${index + 1}`, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "14px",
			fontStyle: "bold",
			color: "#fff3d8",
		}).setOrigin(0.5).setDepth(3);
		this.add.text(station.x, station.y + 51, station.name, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#fff3d8",
			backgroundColor: "#24534f",
			padding: { x: 6, y: 3 },
		}).setOrigin(0.5).setDepth(3);
	}

	private nearestStation(): RepairStation | undefined {
		return this.stations
			.map((station) => ({
				station,
				distance: Phaser.Math.Distance.Between(this.engineerX, this.engineerY, station.x, station.y),
			}))
			.filter(({ distance }) => distance < 76)
			.sort((first, second) => first.distance - second.distance)[0]?.station;
	}

	private interactWithStation() {
		const station = this.nearestStation();
		if (!station) {
			playSound("select");
			return;
		}
		if (station.repaired) {
			this.messageLabel.setText(`${station.name} is already powered.`);
			return;
		}
		this.activeStation = this.stations.indexOf(station);
		this.activePuzzle = this.clonePuzzle(puzzleLayouts[this.activeStation]);
		this.hintStep = 0;
		this.hintedPieceIndex = -1;
		this.hintText = "Tap HINT for a nudge. Numbered tiles rotate clockwise.";
		playSound("confirm");
		this.drawPuzzle();
	}

	private clonePuzzle(puzzle: CircuitPuzzle): CircuitPuzzle {
		return {
			...puzzle,
			output: { ...puzzle.output },
			pieces: puzzle.pieces.map((piece) => ({ ...piece })),
		};
	}

	private drawPuzzle() {
		this.puzzleLayer?.destroy(true);
		this.puzzleLayer = this.add.container(0, 0).setDepth(10);
		this.puzzleLayer.add(this.add.rectangle(480, 270, 960, 540, 0x173943, 0.58));
		this.puzzleLayer.add(
			this.add.rectangle(480, 274, 650, 428, 0xfff0cf).setStrokeStyle(4, 0x438478),
		);
		this.puzzleLayer.add(
			this.add.text(480, 97, this.activePuzzle!.name, {
				fontFamily: "Fraunces, serif",
				fontSize: "28px",
				color: "#17464a",
			}).setOrigin(0.5),
		);
		this.puzzleLayer.add(
			this.add.text(480, 128, "Rotate the wire tiles to connect POWER to OUTPUT.", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				color: "#355a52",
			}).setOrigin(0.5),
		);
		this.puzzleLayer.add(
			this.add.rectangle(704, 283, 174, 130, 0xd7e6d4).setStrokeStyle(2, 0x9bb9a5),
		);
		this.puzzleLayer.add(
			this.add.text(704, 238, "NEED A NUDGE?", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#286d66",
			}).setOrigin(0.5),
		);
		this.puzzleLayer.add(
			this.add.text(704, 292, this.hintText, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "11px",
				color: "#355a52",
				align: "center",
				wordWrap: { width: 146 },
			}).setOrigin(0.5),
		);
		const hintButton = this.add
			.rectangle(704, 375, 148, 38, 0xe88758)
			.setStrokeStyle(2, 0xf2c66d)
			.setInteractive({ useHandCursor: true });
		this.puzzleLayer.add(hintButton);
		const hintButtonText = this.add.text(704, 375, "SHOW HINT", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#fff3d8",
		}).setOrigin(0.5);
		this.puzzleLayer.add(hintButtonText);
		hintButton.on("pointerover", () => hintButton.setFillStyle(0xf6a375));
		hintButton.on("pointerout", () => hintButton.setFillStyle(0xe88758));
		hintButton.on("pointerdown", () => this.showHint());

		const cell = 70;
		const startX = 480 - cell * 1.5;
		const startY = 279 - cell;
		for (let row = 0; row < 3; row += 1) {
			for (let col = 0; col < 4; col += 1) {
				this.puzzleLayer.add(
					this.add.rectangle(startX + col * cell, startY + row * cell, 62, 62, 0xd7e6d4)
						.setStrokeStyle(1, 0x9bb9a5),
				);
			}
		}

		this.drawTerminal(startX, startY + cell, "POWER", 1);
		this.drawTerminal(
			startX + this.activePuzzle!.output.col * cell,
			startY + this.activePuzzle!.output.row * cell,
			"OUT",
			this.activePuzzle!.output.port,
		);
		this.activePuzzle!.pieces.forEach((piece, index) => this.drawPiece(piece, index, startX, startY, cell));

		const close = this.add
			.text(480, 461, "RETURN TO WORKSHOP  /  ESC", {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "10px",
				fontStyle: "bold",
				color: "#286d66",
				backgroundColor: "#d6e6d3",
				padding: { x: 14, y: 7 },
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });
		close.on("pointerdown", () => this.closePuzzle());
		this.puzzleLayer.add(close);
	}

	private drawTerminal(x: number, y: number, label: string, port: number) {
		const graphics = this.add.graphics();
		graphics.fillStyle(label === "POWER" ? 0x438478 : 0xe88758, 1);
		graphics.fillRoundedRect(x - 28, y - 28, 56, 56, 10);
		graphics.lineStyle(8, 0xfff0cf, 1);
		const direction = directions[port];
		graphics.lineBetween(x, y, x + direction.col * 25, y + direction.row * 25);
		const text = this.add.text(x, y, label, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#fff3d8",
		}).setOrigin(0.5);
		this.puzzleLayer?.add([graphics, text]);
	}

	private drawPiece(piece: CircuitPiece, index: number, startX: number, startY: number, cell: number) {
		const x = startX + piece.col * cell;
		const y = startY + piece.row * cell;
		const energized = this.connectedPieces().has(`${piece.col},${piece.row}`);
		if (index === this.hintedPieceIndex) {
			this.puzzleLayer?.add(
				this.add.rectangle(x, y, 64, 64, 0xf2c66d, 0.12).setStrokeStyle(3, 0xe88758),
			);
		}
		const color = energized ? 0xe8a94e : 0x438478;
		const graphics = this.add.graphics();
		const ports = this.portsFor(piece);
		graphics.lineStyle(10, color, 1);
		ports.forEach((port) => {
			const direction = directions[port];
			graphics.lineBetween(x, y, x + direction.col * 25, y + direction.row * 25);
		});
		graphics.fillStyle(energized ? 0xe8a94e : 0x286d66, 1);
		graphics.fillCircle(x, y, 9);
		const hitArea = this.add.rectangle(x, y, 58, 58, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
		const number = this.add.text(x - 24, y - 25, `${index + 1}`, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#17464a",
			backgroundColor: "#fff0cf",
			padding: { x: 3, y: 2 },
		}).setOrigin(0.5);
		this.puzzleLayer?.add([graphics, number, hitArea]);
		hitArea.on("pointerdown", () => this.rotatePiece(index));
	}

	private rotatePiece(index: number) {
		if (!this.activePuzzle) return;
		this.activePuzzle.pieces[index].rotation = (this.activePuzzle.pieces[index].rotation + 1) % 4;
		playSound("select");
		if (this.hasCompletePath()) {
			playSound("skill");
			this.repairStation();
		} else {
			this.drawPuzzle();
		}
	}

	private showHint() {
		if (!this.activePuzzle) return;
		const hintIndex = this.hintStep % this.activePuzzle.pieces.length;
		const piece = this.activePuzzle.pieces[hintIndex];
		const targetRotation = this.activePuzzle.solution[hintIndex];
		const targetPorts = this.portsFor({ ...piece, rotation: targetRotation })
			.map((port) => ["north", "east", "south", "west"][port]);
		this.hintedPieceIndex = hintIndex;
		this.hintText = `Tile ${hintIndex + 1} needs connections to ${targetPorts.join(" and ")}.`;
		this.hintStep += 1;
		playSound("skill");
		this.drawPuzzle();
	}

	private portsFor(piece: CircuitPiece): number[] {
		const base = piece.shape === "straight" ? [1, 3] : [0, 1];
		return base.map((port) => (port + piece.rotation) % 4);
	}

	private connectedPieces(): Set<string> {
		if (!this.activePuzzle) return new Set();
		const pieces = new Map(this.activePuzzle.pieces.map((piece) => [`${piece.col},${piece.row}`, piece]));
		const first = pieces.get("1,1");
		if (!first || !this.portsFor(first).includes(3)) return new Set();
		const connected = new Set<string>();
		const queue = [{ col: 1, row: 1, incoming: 3 }];
		while (queue.length > 0) {
			const current = queue.shift()!;
			const key = `${current.col},${current.row}`;
			if (connected.has(key)) continue;
			connected.add(key);
			const piece = pieces.get(key);
			if (!piece) continue;
			for (const port of this.portsFor(piece)) {
				if (port === current.incoming) continue;
				const direction = directions[port];
				const col = current.col + direction.col;
				const row = current.row + direction.row;
				if (
					col === this.activePuzzle.output.col &&
					row === this.activePuzzle.output.row &&
					(port + 2) % 4 === this.activePuzzle.output.port
				) {
					continue;
				}
				const neighbor = pieces.get(`${col},${row}`);
				if (neighbor && this.portsFor(neighbor).includes((port + 2) % 4)) {
					queue.push({ col, row, incoming: (port + 2) % 4 });
				}
			}
		}
		return connected;
	}

	private hasCompletePath(): boolean {
		if (!this.activePuzzle) return false;
		const pieces = new Map(this.activePuzzle.pieces.map((piece) => [`${piece.col},${piece.row}`, piece]));
		const first = pieces.get("1,1");
		if (!first || !this.portsFor(first).includes(3)) return false;
		const visited = new Set<string>();
		const queue = [{ col: 1, row: 1, incoming: 3 }];
		while (queue.length > 0) {
			const current = queue.shift()!;
			const key = `${current.col},${current.row}`;
			if (visited.has(key)) continue;
			visited.add(key);
			const piece = pieces.get(key);
			if (!piece) continue;
			for (const port of this.portsFor(piece)) {
				if (port === current.incoming) continue;
				const direction = directions[port];
				const col = current.col + direction.col;
				const row = current.row + direction.row;
				if (
					col === this.activePuzzle.output.col &&
					row === this.activePuzzle.output.row &&
					(port + 2) % 4 === this.activePuzzle.output.port
				) {
					return true;
				}
				const neighbor = pieces.get(`${col},${row}`);
				if (neighbor && this.portsFor(neighbor).includes((port + 2) % 4)) {
					queue.push({ col, row, incoming: (port + 2) % 4 });
				}
			}
		}
		return false;
	}

	private repairStation() {
		const station = this.stations[this.activeStation];
		station.repaired = true;
		this.puzzleLayer?.destroy(true);
		this.puzzleLayer = undefined;
		this.activePuzzle = undefined;
		const repaired = this.stations.filter((entry) => entry.repaired).length;
		this.systemLabel.setText(`SYSTEMS  ${repaired} / 3`);
		this.messageLabel.setText(`${station.name} is online. Find the next relay.`);
		if (repaired === this.stations.length) this.showCompletion();
	}

	private closePuzzle() {
		this.puzzleLayer?.destroy(true);
		this.puzzleLayer = undefined;
		this.activePuzzle = undefined;
	}

	private showCompletion() {
		this.complete = true;
		playSound("victory");
		try {
			localStorage.setItem("7-lives-engineer-life-complete", "true");
		} catch {
			// Completion remains visible for this run if storage is unavailable.
		}
		this.add.rectangle(480, 270, 960, 540, 0x173943, 0.48).setDepth(20);
		this.add.rectangle(480, 270, 610, 280, 0xfff0cf).setStrokeStyle(4, 0x438478).setDepth(21);
		this.add.text(480, 191, "ENGINEER LIFE  /  COMPLETE", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0.5).setDepth(22);
		this.add.text(480, 250, "The lights\ncame back on.", {
			fontFamily: "Fraunces, serif",
			fontSize: "42px",
			color: "#17464a",
			align: "center",
			lineSpacing: -3,
		}).setOrigin(0.5).setDepth(22);
		this.add.text(480, 322, "The neighborhood is alive again because you fixed it.", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "13px",
			color: "#355a52",
		}).setOrigin(0.5).setDepth(22);
		const button = this.add.rectangle(480, 371, 230, 44, 0x438478)
			.setStrokeStyle(2, 0xf2c66d)
			.setInteractive({ useHandCursor: true })
			.setDepth(22);
		this.add.text(480, 371, "RETURN TO LIFE SELECT", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#fff3d8",
		}).setOrigin(0.5).setDepth(23);
		button.on("pointerdown", () => this.scene.start("role-select"));
	}

	private addTouchButton(x: number, y: number, label: string, direction: Direction) {
		const button = this.add.rectangle(x, y, 58, 48, 0x24534f, 0.86)
			.setStrokeStyle(2, 0xffd77a)
			.setInteractive({ useHandCursor: true })
			.setDepth(8);
		this.add.text(x, y, label, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#fff4d9",
		}).setOrigin(0.5).setDepth(9);
		button.on("pointerdown", () => this.touchDirections.add(direction));
		button.on("pointerup", () => this.touchDirections.delete(direction));
		button.on("pointerupoutside", () => this.touchDirections.delete(direction));
		button.on("pointerout", () => this.touchDirections.delete(direction));
	}

	private addInteractButton(x: number, y: number) {
		const button = this.add.rectangle(x, y, 112, 56, 0xe88758)
			.setStrokeStyle(3, 0xf2c66d)
			.setInteractive({ useHandCursor: true })
			.setDepth(8);
		this.add.text(x, y, "E  /  REPAIR", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#fff4d9",
		}).setOrigin(0.5).setDepth(9);
		button.on("pointerdown", () => this.interactWithStation());
	}
}