import Phaser from "phaser";
import { addMusicToggle, playSound } from "../audio/audioManager";

interface Chapter {
	roleName: string;
	lifeNumber: number;
	worldName: string;
	asset: string;
	speaker: string;
	title: string;
	copy: string;
	challenge: string;
}

const chapters: Record<number, Chapter> = {
	2: {
		roleName: "Lawyer",
		lifeNumber: 4,
		worldName: "THE TOWN HALL",
		asset: "law-court",
		speaker: "LIFE FOUR  /  THE LAWYER",
		title: "One small fact\ncan change a case.",
		copy: "A lantern vanished from the town archive. Three witnesses remember the night differently, and the town wants a fair answer before the bell rings again.",
		challenge: "Listen to each witness, compare their accounts with the archive log, and identify the statement that cannot be true.",
	},
	4: {
		roleName: "Athlete",
		lifeNumber: 5,
		worldName: "THE HILLTOP TRACK",
		asset: "athletics-track",
		speaker: "LIFE FIVE  /  THE ATHLETE",
		title: "The whole block\nis cheering for you.",
		copy: "The neighborhood relay is ready to start. The route crosses the old orchard track, where fallen hurdles and a few muddy surprises stand between you and the finish.",
		challenge: "Run the course, watch each hazard, and jump at the right moment. Reach the finish with enough hearts left to carry the signal home.",
	},
	5: {
		roleName: "Teacher",
		lifeNumber: 6,
		worldName: "THE GARDEN CLASSROOM",
		asset: "classroom",
		speaker: "LIFE SIX  /  THE TEACHER",
		title: "Every student\nnotices something.",
		copy: "A class wants to grow a garden, but the activity cards are all mixed up. The students have clues about what needs to happen first, next, and last.",
		challenge: "Listen around the classroom, then arrange the garden lesson in an order that gives every seed a chance to grow.",
	},
	6: {
		roleName: "Scientist",
		lifeNumber: 7,
		worldName: "THE HILLTOP OBSERVATORY",
		asset: "observatory",
		speaker: "LIFE SEVEN  /  THE SCIENTIST",
		title: "Something out there\nis trying to say hello.",
		copy: "A repeating pulse has arrived through the old telescope. Its colors match the observatory's four signal lamps, but the pattern keeps slipping away.",
		challenge: "Listen to the signal, remember its color sequence, and replay it on the console to send an answer back into the sky.",
	},
};

export class ProfessionStoryScene extends Phaser.Scene {
	private chapter!: Chapter;

	constructor() {
		super("profession-story");
	}

	preload() {
		this.load.image("law-court", "/art/law-court.svg");
		this.load.image("athletics-track", "/art/athletics-track.svg");
		this.load.image("classroom", "/art/classroom.svg");
		this.load.image("observatory", "/art/observatory.svg");
	}

	create({ roleId }: { roleId: number }) {
		this.chapter = chapters[roleId] ?? chapters[2];
		this.add.image(480, 270, this.chapter.asset).setDisplaySize(960, 540);
		this.add.rectangle(260, 270, 520, 540, 0xfff0cf, 0.97).setStrokeStyle(2, 0x438478);
		this.add.rectangle(748, 126, 348, 100, 0xfff0cf, 0.92).setStrokeStyle(2, 0xe88758);
		addMusicToggle(this, 884, 38);

		this.add.text(748, 105, this.chapter.worldName, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0.5);
		this.add.text(748, 151, `A LIFE AS A\n${this.chapter.roleName.toUpperCase()}`, {
			fontFamily: "Fraunces, serif",
			fontSize: "23px",
			color: "#17464a",
			align: "center",
			lineSpacing: -2,
		}).setOrigin(0.5);

		this.drawProfessionFigure(roleId);

		this.add.text(62, 42, `7-LIVES  /  LIFE ${String(this.chapter.lifeNumber).padStart(2, "0")}`, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0, 0.5);
		this.add.text(62, 78, `Before the ${this.chapter.roleName.toLowerCase()}'s day`, {
			fontFamily: "Fraunces, serif",
			fontSize: "26px",
			color: "#17464a",
		}).setOrigin(0, 0.5);

		this.add.text(64, 133, this.chapter.speaker, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#bd6148",
		}).setOrigin(0, 0.5);
		this.add.text(62, 157, this.chapter.title, {
			fontFamily: "Fraunces, serif",
			fontSize: "39px",
			color: "#17464a",
			lineSpacing: -4,
		}).setOrigin(0, 0);
		this.add.text(64, 274, this.chapter.copy, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "15px",
			color: "#355a52",
			lineSpacing: 6,
			wordWrap: { width: 410 },
		}).setOrigin(0, 0);
		this.add.rectangle(64, 383, 414, 3, 0xe88758);
		this.add.text(64, 403, "THE CHALLENGE", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "9px",
			fontStyle: "bold",
			color: "#286d66",
		}).setOrigin(0, 0.5);
		this.add.text(64, 423, this.chapter.challenge, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			color: "#355a52",
			wordWrap: { width: 410 },
		}).setOrigin(0, 0);

		const beginButton = this.add.rectangle(268, 488, 290, 44, 0xe88758)
			.setStrokeStyle(2, 0xf2c66d)
			.setInteractive({ useHandCursor: true });
		this.add.text(268, 488, `BEGIN ${this.chapter.roleName.toUpperCase()}'S LIFE`, {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "11px",
			fontStyle: "bold",
			color: "#173f43",
		}).setOrigin(0.5);
		beginButton.on("pointerover", () => beginButton.setFillStyle(0xf6a375));
		beginButton.on("pointerout", () => beginButton.setFillStyle(0xe88758));
		beginButton.on("pointerdown", () => this.startWorld());
		this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.code === "Space") this.startWorld();
		});
	}

	private drawProfessionFigure(roleId: number) {
		const colors: Record<number, number> = {
			2: 0x9e5361,
			4: 0x388678,
			5: 0xe3a862,
			6: 0x557ab0,
		};
		const figure = this.add.container(670, 435);
		figure.add(this.add.ellipse(0, 8, 96, 20, 0x315b55, 0.2));
		figure.add(this.add.rectangle(0, -55, 56, 85, colors[roleId] ?? 0x438478).setStrokeStyle(4, 0xfff0d1));
		figure.add(this.add.circle(0, -113, 29, 0xd89a68).setStrokeStyle(4, 0x315b55));
		figure.add(this.add.circle(-9, -117, 3, 0x315b55));
		figure.add(this.add.circle(9, -117, 3, 0x315b55));
		figure.add(this.add.rectangle(-16, -9, 14, 43, 0x315b55));
		figure.add(this.add.rectangle(16, -9, 14, 43, 0x315b55));
		figure.add(this.add.circle(0, -54, 10, 0xf2c66d));
		if (roleId === 2) {
			figure.add(this.add.rectangle(0, -153, 74, 13, 0x315b55));
			figure.add(this.add.rectangle(0, -142, 43, 16, 0x438478));
		} else if (roleId === 4) {
			figure.add(this.add.ellipse(0, -148, 70, 23, 0xe88758).setStrokeStyle(3, 0xfff0d1));
		} else if (roleId === 5) {
			figure.add(this.add.rectangle(26, -72, 22, 56, 0x438478).setStrokeStyle(3, 0xfff0d1));
		} else {
			figure.add(this.add.circle(0, -151, 27, 0xe3a862).setStrokeStyle(3, 0x315b55));
			figure.add(this.add.circle(0, -151, 16, 0x557ab0));
		}
		this.tweens.add({ targets: figure, y: 429, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
	}

	private startWorld() {
		playSound("confirm");
		this.scene.start("other-life-world", { roleId: this.chapter.lifeNumber === 4 ? 2 : this.chapter.lifeNumber === 5 ? 4 : this.chapter.lifeNumber === 6 ? 5 : 6 });
	}
}