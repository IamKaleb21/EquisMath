import { describe, it, expect } from "vitest";
import {
  initialEquationState,
  initialHintState,
  initialGameState,
} from "./index";

describe("shared/types (Fase 1)", () => {
  describe("initialEquationState", () => {
    it("has empty leftSide and rightSide and solution 0", () => {
      expect(initialEquationState.leftSide).toEqual([]);
      expect(initialEquationState.rightSide).toEqual([]);
      expect(initialEquationState.solution).toBe(0);
    });
  });

  describe("initialHintState", () => {
    it("has showHint false, targetBlockId null, isFirstExerciseOfLevel true, consecutiveErrors 0", () => {
      expect(initialHintState.showHint).toBe(false);
      expect(initialHintState.targetBlockId).toBeNull();
      expect(initialHintState.isFirstExerciseOfLevel).toBe(true);
      expect(initialHintState.consecutiveErrors).toBe(0);
    });
  });

  describe("initialGameState", () => {
    it("has role null, currentLevel 1, score 0, totalScore 0", () => {
      expect(initialGameState.role).toBeNull();
      expect(initialGameState.currentLevel).toBe(1);
      expect(initialGameState.score).toBe(0);
      expect(initialGameState.totalScore).toBe(0);
    });
    it("uses initialEquationState and initialHintState", () => {
      expect(initialGameState.equation).toBe(initialEquationState);
      expect(initialGameState.hint).toBe(initialHintState);
    });
  });
});
