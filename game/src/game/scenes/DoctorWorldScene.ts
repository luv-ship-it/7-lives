import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";

type Direction = "up" | "down" | "left" | "right";
type CareChoices = [string, string, string];

interface Patient {
	name: string;
	concern: string;
	clue: string;
	choices: CareChoices;
	answer: number;
	x: number;
	y: number;
	helped: boolean;
	visual: Phaser.GameObjects.Container;
}

export class DoctorWorldScene extends Phaser.Scene {
	private doctor!: Phaser.GameObjects.Image;
	private doctorX = 110;
	private doctorY = 440;
	private keysDown = new Set<string>();
	private touchDirections = new Set<Direction>();
	private patients: Patient[] = [];
	private progressLabel!: Phaser.GameObjects.Text;
	private messageLabel!: Phaser.GameObjects.Text;
	private consultation?: Phaser.GameObjects.Container;
	private elapsed = 0;
	private complete = false;

	constructor() {
		super("doctor-world");
	}

	preload() {
		this.load.image("doctor-clinic", "/art/doctor-clinic.svg");
		this.load.image("doctor", "/art/doctor.svg");
	}

	create() {
		this.doctorX = 110;
		this.doctorY = 440;
		this.keysDown.clear();
		this.touchDirections.clear();
		this.consultation = undefined;
		this.elapsed = 0;
		this.complete = false;
		this.patients = [
			this.createPatient(
				"WREN",
				"My shadow hides inside my blanket fort.",
				"It peeks out when the room is quiet and calm.",
				["Set up a quiet little nook", "Ring the brass bell", "Open the moon window"],
				0,
				300,
				375,
				0xe9a986,
			),
			this.createPatient(
				"KIT",
				"The tiny bell in my song has gone silent.",
				"It used to ring along with my family's morning tune.",
				["Read a map together", "Hum the morning tune", "Wind the little clock"],
				1,
				510,
				352,
				0x88b9a3,
			),
			this.createPatient(
				"VALE",
				"My paper moon has lost its glow.",
				"It shines when someone reads a kind story beneath it.",
				["Read a story together", "Find a silver wrench", "Open every cupboard"],
				0,
				748,
				378,
				0x9a8abd,
			),
		];

		this.cameras.main.setBackgroundColor("#e4efd9");
		this.add.image(480, 270, "doctor-clinic").setDisplaySize(960, 540);
		this.add.rectangle(480, 37, 960, 74, 0x246b65, 0.97);
		addMusicToggle(this, 884, 105);
		this.add.text(28, 21, "LIFE THREE  /  DOCTOR", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#ffe08c",
		}).setOrigin(0, 0.5);
		this.add.text(28, 49, "The Lantern Clinic", {
			fontFamily: "Fraunces, serif",
			fontSize: "27px",
			color: "#fff3d8",
		}).setOrigin(0, 0.5);
		this.add.text(575, 25, "LISTEN CLOSELY  /  Help each visitor find what they need", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "12px",
			fontStyle: "bold",
			color: "#fff3d8",
		}).setOrigin(0.5);
		this.progressLabel = this.add.text(906, 60, "VISITORS  0 / 3", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#ffe08c",
		}).setOrigin(1, 0.5);

		this.patients.forEach((patient) => this.drawPatient(patient));
		this.doctor = this.add.image(this.doctorX, this.doctorY, "doctor")
			.setOrigin(0.5, 0.86)
			.setScale(0.66)
			.setDepth(3);
		this.add.text(this.doctorX, this.doctorY - 58, "DOCTOR", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#24534f",
		}).setOrigin(0.5);

		this.messageLabel = this.add.text(480, 497, "Walk to a visitor and press E to listen.", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "12px",
			fontStyle: "bold",
			color: "#fff3d8",
			backgroundColor: "#24534f",
			padding: { x: 14, y: 8 },
		}).setOrigin(0.5).setDepth(5);

		this.addTouchButton(76, 446, "LEFT", "left");
		this.addTouchButton(148, 398, "UP", "up");
		this.addTouchButton(148, 494, "DOWN", "down");
		this.addTouchButton(220, 446, "RIGHT", "right");
		this.addInteractButton(864, 454);

		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			this.keysDown.add(key);
			if (key === "e" && !this.consultation) this.listenToPatient();
			if (key === "escape" && this.consultation) this.closeConsultation();
		});
		this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
			this.keysDown.delete(event.key.toLowerCase());
		});
	}

	update(_time: number, delta: number) {
		if (this.complete || this.consultation) return;
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
			this.doctorX = Phaser.Math.Clamp(this.doctorX + movement.x * 215 * delta / 1000, 48, 912);
			this.doctorY = Phaser.Math.Clamp(this.doctorY + movement.y * 190 * delta / 1000, 145, 465);
			this.doctor.setPosition(this.doctorX, this.doctorY + Math.sin(this.elapsed / 85) * 2);
			if (movement.x !== 0) this.doctor.setFlipX(movement.x < 0);
		} else {
			this.doctor.setPosition(this.doctorX, this.doctorY + Math.sin(this.elapsed / 480) * 1.5);
		}

		const patient = this.nearestPatient();
		const prompt = patient
			? patient.helped
				? `${patient.name} feels heard.`
				: `E  /  LISTEN TO ${patient.name}`
			: "Walk to a visitor and press E to listen.";
		if (prompt !== this.messageLabel.text) this.messageLabel.setText(prompt);
	}

	private createPatient(
		name: string,
		concern: string,
		clue: string,
		choices: CareChoices,
		answer: number,
		x: number,
		y: number,
		color: number,
	): Patient {
		const visual = this.add.container(x, y).setDepth(2);
		visual.add(this.add.ellipse(0, 31, 76, 22, 0x355d50, 0.2));
		visual.add(this.add.rectangle(0, 9, 45, 53, color).setStrokeStyle(3, 0xfff0d1));
		visual.add(this.add.circle(0, -29, 21, 0xd89a68).setStrokeStyle(3, 0x315b55));
		visual.add(this.add.circle(-7, -31, 2, 0x315b55));
		visual.add(this.add.circle(7, -31, 2, 0x315b55));
		visual.add(this.add.arc(0, -23, 6, 20, 160, false, 0xa85d4b).setStrokeStyle(2, 0xa85d4b));
		visual.add(this.add.ellipse(0, 19, 29, 13, 0xfff0d1).setStrokeStyle(2, 0xc68c5e));
		visual.add(this.add.circle(0, 17, 6, 0xf2c66d));
		visual.add(this.add.text(-22, 52, name, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#24534f",
			backgroundColor: "#fff4d9",
			padding: { x: 6, y: 3 },
		}));
		visual.add(this.add.text(-8, -68, "...", {
			fontFamily: "Fraunces, serif",
			fontSize: "23px",
			color: "#bd6148",
		}));
		return { name, concern, clue, choices, answer, x, y, helped: false, visual };
	}

	private drawPatient(patient: Patient) {
		this.add.circle(patient.x, patient.y + 2, 44, 0xf8efd6, 0.38)
			.setStrokeStyle(2, 0x438478)
			.setDepth(1);
		this.add.text(patient.x, patient.y + 72, "VISITOR", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "8px",
			fontStyle: "bold",
			color: "#fff3d8",
			backgroundColor: "#438478",
			padding: { x: 5, y: 3 },
		}).setOrigin(0.5).setDepth(3);
	}

	private nearestPatient(): Patient | undefined {
		return this.patients
			.map((patient) => ({
				patient,
				distance: Phaser.Math.Distance.Between(this.doctorX, this.doctorY, patient.x, patient.y),
			}))
			.filter(({ distance }) => distance < 82)
			.sort((first, second) => first.distance - second.distance)[0]?.patient;
	}

	private listenToPatient() {
		const patient = this.nearestPatient();
		if (!patient) {
			playSound("select");
			return;
		}
		if (patient.helped) {
			this.messageLabel.setText(`${patient.name} smiles. Thank you for listening.`);
			return;
		}
		playSound("confirm");
		this.openConsultation(patient);
	}

	private openConsultation(patient: Patient) {
		const layer = this.add.container(0, 0).setDepth(10);
		this.consultation = layer;
		layer.add(this.add.rectangle(480, 270, 960, 540, 0x173943, 0.55));
		layer.add(this.add.rectangle(480, 270, 650, 420, 0xfff0cf).setStrokeStyle(4, 0x438478));
		layer.add(this.add.text(480, 104, "LANTERN CLINIC  /  LISTEN FIRST", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0.5));
		layer.add(this.add.text(480, 139, patient.name, {
			fontFamily: "Fraunces, serif",
			fontSize: "31px",
			color: "#17464a",
		}).setOrigin(0.5));
		layer.add(this.add.text(480, 181, patient.concern, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "14px",
			color: "#355a52",
			align: "center",
			wordWrap: { width: 550 },
		}).setOrigin(0.5));
		layer.add(this.add.rectangle(480, 234, 528, 56, 0xd7e6d4).setStrokeStyle(2, 0xf2c66d));
		layer.add(this.add.text(480, 234, `CLUE  /  ${patient.clue}`, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "12px",
			fontStyle: "bold",
			color: "#24534f",
			align: "center",
			wordWrap: { width: 480 },
		}).setOrigin(0.5));
		layer.add(this.add.text(480, 283, "What might help?", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#bd6148",
		}).setOrigin(0.5));

		patient.choices.forEach((choice, index) => {
			const y = 310 + index * 44;
			const button = this.add.rectangle(480, y, 490, 40, 0x438478)
				.setStrokeStyle(2, 0xf2c66d)
				.setInteractive({ useHandCursor: true });
			layer.add(button);
			layer.add(this.add.text(480, y, choice, {
				fontFamily: "DM Sans, sans-serif",
				fontSize: "12px",
				fontStyle: "bold",
				color: "#fff3d8",
				align: "center",
				wordWrap: { width: 450 },
			}).setOrigin(0.5));
			button.on("pointerover", () => button.setFillStyle(0x60a99a));
			button.on("pointerout", () => button.setFillStyle(0x438478));
			button.on("pointerdown", () => this.chooseCare(patient, index));
		});
		layer.add(this.add.text(480, 450, "ESC  /  RETURN TO THE CLINIC", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			color: "#647d6c",
		}).setOrigin(0.5));
	}

	private chooseCare(patient: Patient, choiceIndex: number) {
		if (choiceIndex !== patient.answer) {
			playSound("select");
			this.messageLabel.setText("That doesn't fit the clue yet. Listen to what they told you.");
			return;
		}

		patient.helped = true;
		patient.visual.setAlpha(0.48);
		patient.visual.add(this.add.text(-22, -82, "HEARD", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "8px",
			fontStyle: "bold",
			color: "#24534f",
			backgroundColor: "#fff4d9",
			padding: { x: 4, y: 2 },
		}));
		playSound("skill");
		this.closeConsultation();
		const helped = this.patients.filter((entry) => entry.helped).length;
		this.progressLabel.setText(`VISITORS  ${helped} / 3`);
		this.messageLabel.setText(`${patient.name} feels heard. Thank you for taking the time.`);
		if (helped === this.patients.length) this.completeLife();
	}

	private closeConsultation() {
		this.consultation?.destroy(true);
		this.consultation = undefined;
	}

	private completeLife() {
		this.complete = true;
		playSound("victory");
		try {
			localStorage.setItem("7-lives-doctor-life-complete-v1", "true");
		} catch {
			// Completion remains visible for this run if storage is unavailable.
		}
		this.add.rectangle(480, 270, 960, 540, 0x173943, 0.5).setDepth(20);
		this.add.rectangle(480, 270, 610, 280, 0xfff0cf).setStrokeStyle(4, 0x438478).setDepth(21);
		this.add.text(480, 191, "DOCTOR LIFE  /  COMPLETE", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0.5).setDepth(22);
		this.add.text(480, 250, "Every story\nwas heard.", {
			fontFamily: "Fraunces, serif",
			fontSize: "42px",
			color: "#17464a",
			align: "center",
			lineSpacing: -3,
		}).setOrigin(0.5).setDepth(22);
		this.add.text(480, 322, "The clinic is peaceful. The next life is waiting.", {
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
		this.add.text(x, y, "E  /  LISTEN", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#fff4d9",
		}).setOrigin(0.5).setDepth(9);
		button.on("pointerdown", () => this.listenToPatient());
	}
}