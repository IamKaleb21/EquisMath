/**
 * Fase 6 — Feedback System (FR4)
 * Tests para verificar la implementación correcta de:
 * - ProgressBar: muestra progreso de sesión
 * - triggerConfetti: dispara confetti en victoria
 * - useVictoryEffect: hook para efectos de victoria
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { ProgressBar, triggerConfetti, useVictoryEffect } from "./index";
import { useGameStore } from "@/shared/store/gameStore";
import { checkVictory } from "@/features/block-system";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("features/feedback (Fase 6)", () => {
  describe("ProgressBar component (FR4)", () => {
    it("renders progress bar element", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(ProgressBar, { score: 3, max: 10 }));
      });
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar).toBeTruthy();
      root.unmount();
      container.remove();
    });

    it("displays current score visually", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(ProgressBar, { score: 5, max: 10 }));
      });
      expect(container.textContent).toContain("5");
      expect(container.textContent).toContain("10");
      root.unmount();
      container.remove();
    });

    it("has max value for full progress indication", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(ProgressBar, { score: 10, max: 10 }));
      });
      const bar = container.querySelector('[role="progressbar"]');
      expect(bar?.getAttribute("aria-valuemax")).toBe("10");
      expect(bar?.getAttribute("aria-valuenow")).toBe("10");
      root.unmount();
      container.remove();
    });

    it("uses theme colors for styling", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(ProgressBar, { score: 2, max: 10 }));
      });
      const fill = container.querySelector('[role="progressbar"]')?.querySelector("div");
      expect(fill?.getAttribute("style")).toMatch(/neon-cyan|width/);
      root.unmount();
      container.remove();
    });

    it("shows percentage or score label when showLabel is true", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(ProgressBar, { score: 3, max: 10, showLabel: true }));
      });
      expect(container.textContent).toMatch(/3\s*\/\s*10/);
      root.unmount();
      container.remove();
    });
  });

  describe("triggerConfetti function (FR4)", () => {
    beforeEach(async () => {
      const confetti = (await import("canvas-confetti")).default;
      vi.mocked(confetti).mockClear();
    });

    it("calls canvas-confetti library when invoked", async () => {
      const confetti = (await import("canvas-confetti")).default;
      triggerConfetti();
      expect(confetti).toHaveBeenCalledTimes(1);
      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 80,
          spread: 70,
          colors: expect.any(Array),
        })
      );
    });

    it("uses appropriate confetti configuration", async () => {
      const confetti = (await import("canvas-confetti")).default;
      triggerConfetti();
      const call = vi.mocked(confetti).mock.calls[0][0];
      expect(call?.particleCount).toBe(80);
      expect(call?.origin?.y).toBe(0.6);
    });

    it("does not throw if called multiple times rapidly", () => {
      expect(() => {
        triggerConfetti();
        triggerConfetti();
        triggerConfetti();
      }).not.toThrow();
    });
  });

  describe("useVictoryEffect hook", () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;

    function VictoryEffectTester() {
      useVictoryEffect();
      return createElement("div", null, "test");
    }

    beforeEach(async () => {
      const confetti = (await import("canvas-confetti")).default;
      vi.mocked(confetti).mockClear();
      useGameStore.setState({
        equation: { leftSide: [], rightSide: [], solution: 0 },
        score: 0,
      });
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(() => {
      root?.unmount();
      container?.remove();
      vi.restoreAllMocks();
    });

    it("does not trigger confetti on initial mount when equation is not won", async () => {
      const confetti = (await import("canvas-confetti")).default;
      act(() => {
        root.render(createElement(VictoryEffectTester));
      });
      expect(confetti).not.toHaveBeenCalled();
    });

    it("triggers confetti when victory is detected (score increase)", async () => {
      const confetti = (await import("canvas-confetti")).default;
      useGameStore.setState({
        equation: {
          leftSide: [{ id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 5, sign: 1 }],
          solution: 5,
        },
        score: 0,
      });
      act(() => {
        root.render(createElement(VictoryEffectTester));
      });
      expect(checkVictory(useGameStore.getState().equation)).toBe(true);
      useGameStore.setState({ score: 1 });
      act(() => {
        root.render(createElement(VictoryEffectTester));
      });
      expect(confetti).toHaveBeenCalled();
    });
  });
});
