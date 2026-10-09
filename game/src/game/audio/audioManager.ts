import type Phaser from "phaser";

export type SoundEffect =
	| "select"
	| "confirm"
	| "strike"
	| "dodge"
	| "warning"
	| "hurt"
	| "skill"
	| "victory"
	| "defeat";

const MUSIC_PREFERENCE_KEY = "7-lives-music-enabled";
const melody = [392, 0, 523, 587, 659, 523, 440, 0, 349, 0, 440, 523, 587, 523, 392, 0];
const bass = [130.81, 0, 0, 0, 146.83, 0, 0, 0, 110, 0, 0, 0, 98, 0, 0, 0];

let audioContext: AudioContext | undefined;
let musicTimer: number | undefined;
let musicStep = 0;
let musicEnabled: boolean | undefined;

function getAudioContext(): AudioContext | undefined {
	if (typeof window === "undefined" || !("AudioContext" in window)) return;
	if (!audioContext) audioContext = new window.AudioContext();
	return audioContext;
}

export function isMusicEnabled(): boolean {
	if (musicEnabled !== undefined) return musicEnabled;
	try {
		musicEnabled = localStorage.getItem(MUSIC_PREFERENCE_KEY) !== "false";
	} catch {
		musicEnabled = true;
	}
	return musicEnabled;
}

export function startGameAudio(): void {
	const context = getAudioContext();
	if (!context) return;
	if (context.state === "suspended") void context.resume();
	if (isMusicEnabled() && musicTimer === undefined) scheduleMusicStep();
}

export function toggleMusic(): boolean {
	musicEnabled = !isMusicEnabled();
	try {
		localStorage.setItem(MUSIC_PREFERENCE_KEY, String(musicEnabled));
	} catch {
		// The preference remains active for this session when storage is unavailable.
	}

	if (musicEnabled) {
		startGameAudio();
	} else if (musicTimer !== undefined) {
		window.clearTimeout(musicTimer);
		musicTimer = undefined;
	}

	return musicEnabled;
}

export function playSound(effect: SoundEffect): void {
	const context = audioContext;
	if (!context || context.state !== "running") return;

	const patterns: Record<SoundEffect, number[]> = {
		select: [659],
		confirm: [523, 784],
		strike: [196, 130],
		dodge: [392, 784],
		warning: [294, 220, 294],
		hurt: [147, 110],
		skill: [392, 523, 659],
		victory: [523, 659, 784, 1047],
		defeat: [392, 330, 247, 196],
	};

	patterns[effect].forEach((frequency, index) => {
		playTone(context, frequency, context.currentTime + index * 0.075, 0.12, "triangle", 0.075);
	});
}

function scheduleMusicStep(): void {
	const context = getAudioContext();
	if (!context || !isMusicEnabled()) return;
	if (context.state === "suspended") void context.resume();

	const currentStep = musicStep % melody.length;
	const when = context.currentTime + 0.025;
	const melodyNote = melody[currentStep];
	const bassNote = bass[currentStep];
	if (melodyNote > 0) playTone(context, melodyNote, when, 0.31, "sine", 0.025);
	if (bassNote > 0) playTone(context, bassNote, when, 0.52, "triangle", 0.035);
	if (currentStep === 0 || currentStep === 8) {
		playTone(context, melodyNote * 1.5, when, 0.72, "sine", 0.012);
	}

	musicStep += 1;
	musicTimer = window.setTimeout(scheduleMusicStep, 390);
}

function playTone(
	context: AudioContext,
	frequency: number,
	when: number,
	duration: number,
	waveform: OscillatorType,
	volume: number,
): void {
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, when);
	gain.gain.setValueAtTime(0.0001, when);
	gain.gain.exponentialRampToValueAtTime(volume, when + 0.025);
	gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start(when);
	oscillator.stop(when + duration + 0.02);
}

export function addMusicToggle(scene: Phaser.Scene, x: number, y: number): void {
	const button = scene.add
		.rectangle(x, y, 112, 32, 0x245e61)
		.setStrokeStyle(1, 0xf2c66d)
		.setInteractive({ useHandCursor: true });
	const label = scene.add
		.text(x, y, "", {
			fontFamily: "DM Sans, sans-serif",
			fontSize: "10px",
			fontStyle: "bold",
			color: "#fff2cf",
		})
		.setOrigin(0.5);

	const updateLabel = (enabled: boolean) => {
		label.setText(enabled ? "MUSIC: ON" : "MUSIC: OFF");
		button.setFillStyle(enabled ? 0x245e61 : 0x485253);
	};
	updateLabel(isMusicEnabled());
	button.on("pointerover", () => button.setStrokeStyle(2, 0xffdf85));
	button.on("pointerout", () => button.setStrokeStyle(1, 0xf2c66d));
	button.on("pointerdown", () => {
		const enabled = toggleMusic();
		if (enabled) startGameAudio();
		playSound("select");
		updateLabel(enabled);
	});
}