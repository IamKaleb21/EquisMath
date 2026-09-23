import type { GameState, LocalStorageData } from "@/shared/types";

export const STORAGE_KEY = "equismath-state";

type StoredShape = {
  role?: string;
  lastLevel?: number;
  totalScore?: number;
  maxUnlockedLevel?: number;
};

export function loadFromLocalStorage(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as StoredShape;
    if (!data || typeof data !== "object") return {};
    const partial: Partial<GameState> = {};
    if (data.role === "TEACHER" || data.role === "STUDENT" || data.role === "TUI") {
      partial.role = data.role;
    }
    if (data.lastLevel === 1 || data.lastLevel === 2 || data.lastLevel === 3) {
      partial.currentLevel = data.lastLevel;
    }
    if (typeof data.totalScore === "number" && data.totalScore >= 0) {
      partial.totalScore = data.totalScore;
    }
    if (data.maxUnlockedLevel === 1 || data.maxUnlockedLevel === 2 || data.maxUnlockedLevel === 3) {
      partial.maxUnlockedLevel = data.maxUnlockedLevel;
    }
    return partial;
  } catch {
    return {};
  }
}

export function saveToLocalStorage(data: LocalStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write errors
  }
}
