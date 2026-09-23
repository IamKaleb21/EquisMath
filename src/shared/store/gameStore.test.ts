import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  STORAGE_KEY,
} from "@/features/persistence";

describe("shared/store gameStore (Fase 1)", () => {
  beforeEach(() => {
    useGameStore.setState({
      role: null,
      currentLevel: 1,
      maxUnlockedLevel: 1,
      score: 0,
      totalScore: 0,
      equation: { leftSide: [], rightSide: [], solution: 0 },
      hint: {
        showHint: false,
        targetBlockId: null,
        isFirstExerciseOfLevel: true,
        consecutiveErrors: 0,
      },
      lastFailedMove: null,
      solutionSteps: [],
    });
    localStorage.clear();
  });

  describe("setRole", () => {
    it("updates role", () => {
      useGameStore.getState().setRole("STUDENT");
      expect(useGameStore.getState().role).toBe("STUDENT");
      useGameStore.getState().setRole("TEACHER");
      expect(useGameStore.getState().role).toBe("TEACHER");
      useGameStore.getState().setRole(null);
      expect(useGameStore.getState().role).toBeNull();
    });
  });

  describe("setEquation", () => {
    it("updates equation with leftSide, rightSide, solution", () => {
      const eq = {
        leftSide: [
          { id: "a", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 2 },
        ],
        rightSide: [
          { id: "b", type: "CONSTANT" as const, value: 6, sign: 1 as const },
        ],
        solution: 3,
      };
      useGameStore.getState().setEquation(eq);
      expect(useGameStore.getState().equation.solution).toBe(3);
      expect(useGameStore.getState().equation.leftSide).toHaveLength(1);
      expect(useGameStore.getState().equation.rightSide).toHaveLength(1);
    });
  });

  describe("setLevel", () => {
    it("updates currentLevel to 1, 2 or 3 when level is unlocked", () => {
      useGameStore.setState({ maxUnlockedLevel: 3 });
      useGameStore.getState().setLevel(2);
      expect(useGameStore.getState().currentLevel).toBe(2);
      useGameStore.getState().setLevel(3);
      expect(useGameStore.getState().currentLevel).toBe(3);
    });
    it("sets isFirstExerciseOfLevel to true (Fase 6)", () => {
      useGameStore.setState({
        maxUnlockedLevel: 2,
        hint: { showHint: false, targetBlockId: null, isFirstExerciseOfLevel: false, consecutiveErrors: 0 },
      });
      useGameStore.getState().setLevel(2);
      expect(useGameStore.getState().hint.isFirstExerciseOfLevel).toBe(true);
    });
    it("resets score to 0 when changing level", () => {
      useGameStore.setState({ maxUnlockedLevel: 2, score: 3 });
      useGameStore.getState().setLevel(2);
      expect(useGameStore.getState().score).toBe(0);
    });
    it("does not change currentLevel when level is locked", () => {
      useGameStore.setState({ maxUnlockedLevel: 1, currentLevel: 1 });
      useGameStore.getState().setLevel(2);
      expect(useGameStore.getState().currentLevel).toBe(1);
      useGameStore.getState().setLevel(3);
      expect(useGameStore.getState().currentLevel).toBe(1);
    });
  });

  describe("recordError", () => {
    it("increments consecutiveErrors", () => {
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.consecutiveErrors).toBe(1);
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.consecutiveErrors).toBe(2);
    });
    it("sets showHint true when consecutiveErrors >= 2", () => {
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.showHint).toBe(false);
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.showHint).toBe(true);
    });
    it("sets targetBlockId to first CONSTANT on left when consecutiveErrors >= 2 (Fase 6)", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c1", type: "CONSTANT", value: 5, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 10, sign: 1 }],
          solution: 5,
        },
      });
      useGameStore.getState().recordError();
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.targetBlockId).toBe("c1");
    });
  });

  describe("showHintForBlock (Fase 6)", () => {
    it("sets showHint true and targetBlockId to given blockId", () => {
      useGameStore.getState().showHintForBlock("block-1");
      expect(useGameStore.getState().hint.showHint).toBe(true);
      expect(useGameStore.getState().hint.targetBlockId).toBe("block-1");
    });
  });

  describe("clearHint", () => {
    it("resets showHint, targetBlockId and consecutiveErrors", () => {
      useGameStore.getState().recordError();
      useGameStore.getState().recordError();
      useGameStore.getState().clearHint();
      expect(useGameStore.getState().hint.showHint).toBe(false);
      expect(useGameStore.getState().hint.targetBlockId).toBeNull();
      expect(useGameStore.getState().hint.consecutiveErrors).toBe(0);
    });
  });

  describe("persistToLocalStorage", () => {
    it("does nothing when role is null", () => {
      useGameStore.getState().setLevel(2);
      useGameStore.getState().setRole(null);
      useGameStore.getState().persistToLocalStorage();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
    it("saves role, lastLevel, totalScore when role is set", () => {
      useGameStore.getState().setRole("STUDENT");
      useGameStore.setState({ maxUnlockedLevel: 2 });
      useGameStore.getState().setLevel(2);
      useGameStore.getState().persistToLocalStorage();
      const loaded = loadFromLocalStorage();
      expect(loaded.role).toBe("STUDENT");
      expect(loaded.currentLevel).toBe(2);
    });
  });

  describe("hydrateFromLocalStorage", () => {
    it("restores state from localStorage", () => {
      saveToLocalStorage({
        role: "TEACHER",
        lastLevel: 3,
        totalScore: 50,
        maxUnlockedLevel: 3,
        hasCompletedLevels: [],
      });
      useGameStore.getState().hydrateFromLocalStorage();
      expect(useGameStore.getState().role).toBe("TEACHER");
      expect(useGameStore.getState().currentLevel).toBe(3);
      expect(useGameStore.getState().totalScore).toBe(50);
      expect(useGameStore.getState().maxUnlockedLevel).toBe(3);
    });
  });

  describe("applyMove (Fase 4)", () => {
    // specs: validate → applyMove → simplifyEquation → checkVictory; ecuación actualizada en movimiento válido
    it("updates equation on valid move and simplifies", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 5, sign: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 7, sign: 1 }],
          solution: 1,
        },
      });
      useGameStore.getState().applyMove("c1", "left", "right");
      const eq = useGameStore.getState().equation;
      expect(eq.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(eq.rightSide.length).toBeGreaterThanOrEqual(1);
      expect(eq.rightSide.some((b) => b.type === "CONSTANT")).toBe(true);
    });
    // PRD FR2 Validación: movimiento ilegal → rebote; store: lastFailedMove + recordError
    it("sets lastFailedMove and records error on invalid move (variable with coefficient)", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          ],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 6, sign: 1 }],
          solution: 3,
        },
      });
      useGameStore.getState().applyMove("v1", "left", "right");
      expect(useGameStore.getState().lastFailedMove?.blockId).toBe("v1");
      expect(useGameStore.getState().hint.consecutiveErrors).toBe(1);
    });
    // PRD §4 Victoria; specs: checkVictory → score++, totalScore++, clearHint()
    it("on victory increments score, totalScore and clears hint", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 3, sign: -1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 0, sign: 1 }],
          solution: 3,
        },
        hint: { showHint: true, targetBlockId: "v1", isFirstExerciseOfLevel: false, consecutiveErrors: 2 },
      });
      useGameStore.getState().applyMove("c1", "left", "right");
      const state = useGameStore.getState();
      expect(state.score).toBe(1);
      expect(state.totalScore).toBe(1);
      expect(state.hint.showHint).toBe(false);
    });
    it("initial state has maxUnlockedLevel 1 and score 0", () => {
      const state = useGameStore.getState();
      expect(state.maxUnlockedLevel).toBe(1);
      expect(state.score).toBe(0);
    });
    it("after 5 victories on level 1, maxUnlockedLevel becomes 2", () => {
      useGameStore.setState({ currentLevel: 1, maxUnlockedLevel: 1, score: 0 });
      const winningEq = {
        leftSide: [
          { id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 1 },
          { id: "c1", type: "CONSTANT" as const, value: 0, sign: 1 as const },
        ],
        rightSide: [{ id: "c2", type: "CONSTANT" as const, value: 5, sign: 1 as const }],
        solution: 5,
      };
      for (let i = 0; i < 5; i++) {
        useGameStore.setState({ equation: winningEq });
        useGameStore.getState().applyMove("c1", "left", "right");
      }
      expect(useGameStore.getState().score).toBe(5);
      expect(useGameStore.getState().maxUnlockedLevel).toBe(2);
    });
    it("after 5 victories on level 2, maxUnlockedLevel becomes 3", () => {
      useGameStore.setState({ currentLevel: 2, maxUnlockedLevel: 2, score: 0 });
      const winningEq = {
        leftSide: [
          { id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 1 },
          { id: "c1", type: "CONSTANT" as const, value: 0, sign: 1 as const },
        ],
        rightSide: [{ id: "c2", type: "CONSTANT" as const, value: 5, sign: 1 as const }],
        solution: 5,
      };
      for (let i = 0; i < 5; i++) {
        useGameStore.setState({ equation: winningEq });
        useGameStore.getState().applyMove("c1", "left", "right");
      }
      expect(useGameStore.getState().score).toBe(5);
      expect(useGameStore.getState().maxUnlockedLevel).toBe(3);
    });
    it("score does not exceed 5", () => {
      useGameStore.setState({ currentLevel: 1, maxUnlockedLevel: 1, score: 0 });
      const winningEq = {
        leftSide: [
          { id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 1 },
          { id: "c1", type: "CONSTANT" as const, value: 0, sign: 1 as const },
        ],
        rightSide: [{ id: "c2", type: "CONSTANT" as const, value: 5, sign: 1 as const }],
        solution: 5,
      };
      for (let i = 0; i < 6; i++) {
        useGameStore.setState({ equation: winningEq });
        useGameStore.getState().applyMove("c1", "left", "right");
      }
      expect(useGameStore.getState().score).toBe(5);
    });
    it("pushes one solution step on valid move (stepNumber 1, non-empty description)", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 5, sign: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 7, sign: 1 }],
          solution: 1,
        },
      });
      useGameStore.getState().applyMove("c1", "left", "right");
      const steps = useGameStore.getState().solutionSteps;
      expect(steps).toHaveLength(1);
      expect(steps[0].stepNumber).toBe(1);
      expect(steps[0].description).toBeTruthy();
      expect(steps[0].description.length).toBeGreaterThan(0);
    });
    it("pushes second step with stepNumber 2 on second valid move", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 5, sign: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 7, sign: 1 }],
          solution: 1,
        },
      });
      useGameStore.getState().applyMove("c1", "left", "right");
      const afterFirst = useGameStore.getState().equation;
      const coeffBlock = afterFirst.leftSide.find(
        (b, i) => b.type === "CONSTANT" && afterFirst.leftSide[i + 1]?.type === "VARIABLE"
      );
      expect(coeffBlock).toBeDefined();
      useGameStore.getState().applyMove(coeffBlock!.id, "left", "right");
      const steps = useGameStore.getState().solutionSteps;
      expect(steps).toHaveLength(2);
      expect(steps[0].stepNumber).toBe(1);
      expect(steps[1].stepNumber).toBe(2);
    });
    it("does not push step on invalid move", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          ],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 6, sign: 1 }],
          solution: 3,
        },
      });
      useGameStore.getState().applyMove("v1", "left", "right");
      expect(useGameStore.getState().solutionSteps).toHaveLength(0);
    });
    it("does not push step when reordering on same side (e.g. move -9 left of -2x)", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: -1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 9, sign: -1 },
          ],
          rightSide: [
            { id: "v2", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c2", type: "CONSTANT", value: 12, sign: -1 },
          ],
          solution: 0,
        },
      });
      expect(useGameStore.getState().solutionSteps).toHaveLength(0);
      useGameStore.getState().applyMove("c1", "left", "left");
      expect(useGameStore.getState().solutionSteps).toHaveLength(0);
    });
  });

  describe("requestNewEquation (Fase 2 integration)", () => {
    it("sets equation from generateEquation(currentLevel)", () => {
      useGameStore.getState().setLevel(1);
      useGameStore.getState().requestNewEquation();
      const eq = useGameStore.getState().equation;
      expect(eq.leftSide.length).toBeGreaterThan(0);
      expect(eq.rightSide.length).toBeGreaterThan(0);
      expect(Number.isInteger(eq.solution)).toBe(true);
    });
    it("resets hint with isFirstExerciseOfLevel false when no options", () => {
      useGameStore.getState().requestNewEquation();
      expect(useGameStore.getState().hint.isFirstExerciseOfLevel).toBe(false);
    });
    it("keeps isFirstExerciseOfLevel when requestNewEquation({ isFirstOfLevel: true }) (Fase 6)", () => {
      useGameStore.getState().setLevel(1);
      expect(useGameStore.getState().hint.isFirstExerciseOfLevel).toBe(true);
      useGameStore.getState().requestNewEquation({ isFirstOfLevel: true });
      expect(useGameStore.getState().hint.isFirstExerciseOfLevel).toBe(true);
    });
    it("clears solutionSteps on requestNewEquation", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "c0", type: "CONSTANT", value: 2, sign: 1 },
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
            { id: "c1", type: "CONSTANT", value: 5, sign: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 7, sign: 1 }],
          solution: 1,
        },
      });
      useGameStore.getState().applyMove("c1", "left", "right");
      expect(useGameStore.getState().solutionSteps).toHaveLength(1);
      useGameStore.getState().requestNewEquation();
      expect(useGameStore.getState().solutionSteps).toHaveLength(0);
    });
    it("level 2 produces VARIABLE on left and CONSTANT on right", () => {
      useGameStore.setState({ maxUnlockedLevel: 2 });
      useGameStore.getState().setLevel(2);
      useGameStore.getState().requestNewEquation();
      const eq = useGameStore.getState().equation;
      expect(eq.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(eq.rightSide.some((b) => b.type === "CONSTANT")).toBe(true);
      expect(eq.rightSide.every((b) => b.type === "CONSTANT")).toBe(true);
    });
    it("resets score to 0 when score is 5 and requestNewEquation is called", () => {
      useGameStore.setState({ score: 5 });
      useGameStore.getState().requestNewEquation();
      expect(useGameStore.getState().score).toBe(0);
    });
  });
});
