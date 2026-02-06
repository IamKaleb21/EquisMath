/**
 * Fase 6 — Student Mode (PRD §2 Flujo Estudiante)
 * Tests para verificar la implementación correcta de:
 * - StudentMode container: compone level select, equation, visualization, feedback, hints
 * - LevelSelect: permite elegir nivel 1-3
 * - Flujo de juego completo
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { StudentMode } from "./StudentMode";
import { LevelSelect } from "./LevelSelect";
import { useGameStore } from "@/shared/store/gameStore";
import { checkVictory } from "@/features/block-system";

describe("features/student-mode (Fase 6)", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    if (typeof ResizeObserver === "undefined") {
      vi.stubGlobal("ResizeObserver", class {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
      });
    }
    useGameStore.setState({
      role: "STUDENT",
      currentLevel: 1,
      score: 0,
      equation: { leftSide: [], rightSide: [], solution: 0 },
      hint: {
        showHint: false,
        targetBlockId: null,
        isFirstExerciseOfLevel: false,
        consecutiveErrors: 0,
      },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    vi.restoreAllMocks();
  });

  function renderStudentMode() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(StudentMode));
    });
  }

  function renderLevelSelect() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(LevelSelect));
    });
  }

  describe("StudentMode container", () => {
    it("renders LevelSelect component", () => {
      renderStudentMode();
      expect(container.textContent).toMatch(/Nivel 1|Nivel 2|Nivel 3|Básico|Intermedio|Avanzado/);
    });

    it("renders ProgressBar (feedback) component", () => {
      renderStudentMode();
      expect(container.textContent).toMatch(/Llevas|Siguiente meta|de 10/);
      expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
    });

    it("renders 'Siguiente' button after victory", () => {
      useGameStore.setState({
        equation: {
          leftSide: [{ id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 5, sign: 1 }],
          solution: 5,
        },
      });
      renderStudentMode();
      expect(checkVictory(useGameStore.getState().equation)).toBe(true);
      expect(container.textContent).toContain("Siguiente");
    });

    it("renders EquationBar when equation is loaded", () => {
      useGameStore.setState({
        equation: {
          leftSide: [{ id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 }],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 6, sign: 1 }],
          solution: 3,
        },
      });
      renderStudentMode();
      expect(container.textContent).toMatch(/\+2x|\+6|=/);
    });
  });

  describe("LevelSelect component", () => {
    it("displays three level options (1, 2, 3)", () => {
      renderLevelSelect();
      expect(container.textContent).toContain("Nivel 1");
      expect(container.textContent).toContain("Nivel 2");
      expect(container.textContent).toContain("Nivel 3");
    });

    it("shows current level as selected/highlighted", () => {
      useGameStore.setState({ currentLevel: 2 });
      renderLevelSelect();
      const buttons = container.querySelectorAll("button");
      const level2 = Array.from(buttons).find((b) => b.textContent?.includes("Nivel 2"));
      expect(level2?.getAttribute("aria-pressed")).toBe("true");
    });

    it("calls setLevel when a level is clicked", () => {
      const setLevelSpy = vi.spyOn(useGameStore.getState(), "setLevel");
      renderLevelSelect();
      const level3 = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Nivel 3")
      );
      act(() => {
        (level3 as HTMLButtonElement)?.click();
      });
      expect(setLevelSpy).toHaveBeenCalledWith(3);
    });

    it("calls requestNewEquation after level change", () => {
      const requestSpy = vi.spyOn(useGameStore.getState(), "requestNewEquation");
      renderLevelSelect();
      const level2 = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Nivel 2")
      );
      act(() => {
        (level2 as HTMLButtonElement)?.click();
      });
      expect(requestSpy).toHaveBeenCalledWith({ isFirstOfLevel: true });
    });

    it("displays level difficulty descriptions", () => {
      renderLevelSelect();
      expect(container.textContent).toMatch(/Básico|Intermedio|Avanzado/);
    });
  });

  describe("game flow", () => {
    it("'Siguiente' button loads new equation of same level", () => {
      useGameStore.setState({
        currentLevel: 2,
        equation: {
          leftSide: [{ id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 4, sign: 1 }],
          solution: 4,
        },
      });
      renderStudentMode();
      const requestSpy = vi.spyOn(useGameStore.getState(), "requestNewEquation");
      const nextBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Siguiente")
      );
      act(() => {
        (nextBtn as HTMLButtonElement)?.click();
      });
      expect(requestSpy).toHaveBeenCalled();
    });
  });
});
