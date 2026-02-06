import { describe, it, expect, beforeEach } from "vitest";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_KEY,
} from "./index";
import type { LocalStorageData } from "@/shared/types";

describe("features/persistence (Fase 1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("STORAGE_KEY", () => {
    it("is equismath-state", () => {
      expect(STORAGE_KEY).toBe("equismath-state");
    });
  });

  describe("loadFromLocalStorage", () => {
    it("returns empty object when nothing stored", () => {
      expect(loadFromLocalStorage()).toEqual({});
    });
    it("returns empty object when stored value is invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not json");
      expect(loadFromLocalStorage()).toEqual({});
    });
    it("returns empty object when stored value is not an object", () => {
      localStorage.setItem(STORAGE_KEY, "42");
      expect(loadFromLocalStorage()).toEqual({});
    });
    it("restores role when valid TEACHER or STUDENT", () => {
      saveToLocalStorage({
        role: "STUDENT",
        lastLevel: 2,
        totalScore: 10,
        hasCompletedLevels: [],
      });
      expect(loadFromLocalStorage().role).toBe("STUDENT");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          role: "TEACHER",
          lastLevel: 1,
          totalScore: 0,
          hasCompletedLevels: [],
        })
      );
      expect(loadFromLocalStorage().role).toBe("TEACHER");
    });
    it("restores currentLevel from lastLevel when 1, 2 or 3", () => {
      saveToLocalStorage({
        role: "STUDENT",
        lastLevel: 3,
        totalScore: 0,
        hasCompletedLevels: [],
      });
      expect(loadFromLocalStorage().currentLevel).toBe(3);
    });
    it("restores totalScore when non-negative number", () => {
      saveToLocalStorage({
        role: "STUDENT",
        lastLevel: 1,
        totalScore: 100,
        hasCompletedLevels: [],
      });
      expect(loadFromLocalStorage().totalScore).toBe(100);
    });
    it("ignores invalid role and does not set it", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          role: "INVALID",
          lastLevel: 1,
          totalScore: 0,
        })
      );
      expect(loadFromLocalStorage()).not.toHaveProperty("role");
    });
    it("ignores lastLevel when invalid (0, 4, negative)", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ role: "STUDENT", lastLevel: 0, totalScore: 0 })
      );
      expect(loadFromLocalStorage()).not.toHaveProperty("currentLevel");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ role: "STUDENT", lastLevel: 4, totalScore: 0 })
      );
      expect(loadFromLocalStorage()).not.toHaveProperty("currentLevel");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ role: "STUDENT", lastLevel: -1, totalScore: 0 })
      );
      expect(loadFromLocalStorage()).not.toHaveProperty("currentLevel");
    });
    it("ignores totalScore when negative", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ role: "STUDENT", lastLevel: 1, totalScore: -5 })
      );
      expect(loadFromLocalStorage()).not.toHaveProperty("totalScore");
    });
  });

  describe("saveToLocalStorage", () => {
    it("persists LocalStorageData so loadFromLocalStorage returns same values", () => {
      const data: LocalStorageData = {
        role: "STUDENT",
        lastLevel: 2,
        totalScore: 5,
        hasCompletedLevels: [true, false, true],
      };
      saveToLocalStorage(data);
      const loaded = loadFromLocalStorage();
      expect(loaded.role).toBe(data.role);
      expect(loaded.currentLevel).toBe(data.lastLevel);
      expect(loaded.totalScore).toBe(data.totalScore);
    });
  });
});
