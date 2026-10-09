export interface GameProgress {
    version: 1;
    currentLife: number;
    clearedLives: number[];
    selectedRoleId: number | null;
    complete: boolean;
}

const STORAGE_KEY = "7-lives-progress";

export function newProgress(): GameProgress {
    return {
        version: 1,
        currentLife: 1,
        clearedLives: [],
        selectedRoleId: null,
        complete: false,
    };
}

export function loadProgress(): GameProgress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return newProgress();

        const saved: unknown = JSON.parse(raw);
        if (!isGameProgress(saved)) return newProgress();

        return {
            ...saved,
            clearedLives: [...new Set(saved.clearedLives)],
        };
    } catch {
        return newProgress();
    }
}

export function saveProgress(progress: GameProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // The game remains playable when browser storage is unavailable.
    }
}

function isGameProgress(value: unknown): value is GameProgress {
    if (typeof value !== "object" || value === null) return false;

    const candidate = value as Partial<GameProgress>;
    return (
        candidate.version === 1 &&
        Number.isInteger(candidate.currentLife) &&
        candidate.currentLife! >= 1 &&
        candidate.currentLife! <= 7 &&
        Array.isArray(candidate.clearedLives) &&
        candidate.clearedLives.every(
            (life) => Number.isInteger(life) && life >= 1 && life <= 7,
        ) &&
        (candidate.selectedRoleId === null ||
            Number.isInteger(candidate.selectedRoleId)) &&
        typeof candidate.complete === "boolean"
    );
}