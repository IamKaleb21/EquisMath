import type { GameState, LocalStorageData } from "@/shared/types";

export const STORAGE_KEY = "equismath-state";

type StoredShape = {
  role?: string;
  lastLevel?: number;
  totalScore?: number;
};

export function loadFromLocalStorage(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as StoredShape;
    if (!data || typeof data !== "object") return {};
    const partial: Partial<GameState> = {};
    if (data.role === "TEACHER" || data.role === "STUDENT") partial.role = data.role;
    if (data.lastLevel === 1 || data.lastLevel === 2 || data.lastLevel === 3) {
      partial.currentLevel = data.lastLevel;
    }
    if (typeof data.totalScore === "number" && data.totalScore >= 0) {
      partial.totalScore = data.totalScore;
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
