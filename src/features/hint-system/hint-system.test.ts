/**
 * Fase 6 — Hint System (FR5)
 * Tests para verificar la implementación correcta de:
 * - HandHint/HintOverlay: componente visual de pista
 * - useHintTimer: hook para temporizador de inactividad
 * - Integración con consecutiveErrors del store
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { HandHint, useHintTimer } from "./index";
import { useGameStore } from "@/shared/store/gameStore";

describe("features/hint-system (Fase 6)", () => {
  beforeEach(() => {
    useGameStore.setState({
      hint: {
        showHint: false,
        targetBlockId: null,
        isFirstExerciseOfLevel: false,
        consecutiveErrors: 0,
      },
    });
  });

  describe("HandHint/HintOverlay component (FR5)", () => {
    it("renders when hint.showHint is true", () => {
      useGameStore.setState({
        hint: { showHint: true, targetBlockId: "b1", isFirstExerciseOfLevel: false, consecutiveErrors: 0 },
      });
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(HandHint));
      });
      expect(container.textContent).toMatch(/Entendido|Arrastra/);
      root.unmount();
      container.remove();
    });

    it("does not render when hint.showHint is false", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(HandHint));
      });
      expect(container.textContent).not.toMatch(/Entendido/);
      root.unmount();
      container.remove();
    });

    it("has animated hand icon", () => {
      useGameStore.setState({
        hint: { showHint: true, targetBlockId: null, isFirstExerciseOfLevel: false, consecutiveErrors: 0 },
      });
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(HandHint));
      });
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
      root.unmount();
      container.remove();
    });

    it("has 'Entendido' or dismiss button", () => {
      useGameStore.setState({
        hint: { showHint: true, targetBlockId: null, isFirstExerciseOfLevel: false, consecutiveErrors: 0 },
      });
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(HandHint));
      });
      const btn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Entendido")
      );
      expect(btn).toBeTruthy();
      root.unmount();
      container.remove();
    });

    it("calls clearHint when dismiss button is clicked", () => {
      useGameStore.setState({
        hint: { showHint: true, targetBlockId: null, isFirstExerciseOfLevel: false, consecutiveErrors: 0 },
      });
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      const clearHintSpy = vi.spyOn(useGameStore.getState(), "clearHint");
      act(() => {
        root.render(createElement(HandHint));
      });
      const btn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Entendido")
      );
      act(() => {
        (btn as HTMLButtonElement)?.click();
      });
      expect(clearHintSpy).toHaveBeenCalled();
      root.unmount();
      container.remove();
    });
  });

  describe("useHintTimer hook (FR5)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls onTrigger callback after inactivityMs elapses", () => {
      const onTrigger = vi.fn();
      const TestComponent = () => {
        useHintTimer(100, { onTrigger });
        return createElement("div", null, "test");
      };
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(TestComponent));
      });
      expect(onTrigger).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(onTrigger).toHaveBeenCalledTimes(1);
      root.unmount();
      container.remove();
    });

    it("resets timer on user interaction", () => {
      const onTrigger = vi.fn();
      const TestComponent = () => {
        useHintTimer(200, { onTrigger });
        return createElement("div", null, "test");
      };
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(TestComponent));
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      document.dispatchEvent(new PointerEvent("pointerdown"));
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(onTrigger).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(onTrigger).toHaveBeenCalledTimes(1);
      root.unmount();
      container.remove();
    });

    it("cleans up timer on unmount", () => {
      const onTrigger = vi.fn();
      const TestComponent = () => {
        useHintTimer(500, { onTrigger });
        return createElement("div", null, "test");
      };
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(TestComponent));
      });
      root.unmount();
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(onTrigger).not.toHaveBeenCalled();
      container.remove();
    });
  });

  describe("consecutive errors trigger (FR5)", () => {
    it("hint shows after consecutiveErrors >= 2", () => {
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
      expect(useGameStore.getState().hint.showHint).toBe(false);
      useGameStore.getState().recordError();
      expect(useGameStore.getState().hint.showHint).toBe(true);
    });

    it("hint.targetBlockId is set to suggested block to move when 2 errors", () => {
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

  describe("hint dismissal rules (FR5)", () => {
    it("hides hint when user clicks 'Entendido' (clearHint)", () => {
      useGameStore.setState({
        hint: { showHint: true, targetBlockId: "b1", isFirstExerciseOfLevel: false, consecutiveErrors: 2 },
      });
      useGameStore.getState().clearHint();
      expect(useGameStore.getState().hint.showHint).toBe(false);
      expect(useGameStore.getState().hint.consecutiveErrors).toBe(0);
    });
  });
});
