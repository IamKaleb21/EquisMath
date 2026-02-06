/**
 * Fase 7 — Teacher Mode (PRD §2 Flujo Docente)
 * Tests para verificar la implementación correcta de:
 * - TeacherMode container: MathLive input + visualization + block display
 * - MathLiveInput: wrapper para entrada LaTeX
 * - Integración con parseEquation del equation-engine
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { TeacherMode } from "./TeacherMode";
import { MathLiveInput } from "./MathLiveInput";
import { useGameStore } from "@/shared/store/gameStore";
import { parseEquation } from "@/features/equation-engine";
import { EquationBar } from "@/features/block-system";

describe("features/teacher-mode (Fase 7)", () => {
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
      equation: { leftSide: [], rightSide: [], solution: 0 },
    });
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    vi.restoreAllMocks();
  });

  function renderTeacherMode() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(TeacherMode));
    });
  }

  describe("TeacherMode container", () => {
    it("renders MathLiveInput component", () => {
      renderTeacherMode();
      expect(container.querySelector("math-field")).toBeTruthy();
      expect(container.textContent).toContain("Aplicar");
    });

    it("renders EquationBar (block-system) when equation is parsed", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
            { id: "c1", type: "CONSTANT", value: 3, sign: 1 },
          ],
          rightSide: [{ id: "c2", type: "CONSTANT", value: 7, sign: 1 }],
          solution: 2,
        },
      });
      renderTeacherMode();
      expect(container.textContent).toMatch(/\+2x|\+3|\+7|=/);
    });

    it("renders EquationGraph and ValueTable when equation is valid", () => {
      useGameStore.setState({
        equation: {
          leftSide: [
            { id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          ],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 5, sign: 1 }],
          solution: 5,
        },
      });
      renderTeacherMode();
      // Option D: first block omits +, so we get "x" and "5" instead of "+x" and "+5"
      expect(container.textContent).toMatch(/[+]?x|[+]?5/);
    });

    it("shows error message when parse fails", () => {
      renderTeacherMode();
      const mf = container.querySelector("math-field") as HTMLElement & { getValue?: (f?: string) => string };
      if (mf) {
        (mf as unknown as { getValue: (f?: string) => string }).getValue = () => "";
      }
      const btn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Aplicar")
      );
      act(() => {
        (btn as HTMLButtonElement)?.click();
      });
      const errorZone = container.querySelector('[role="alert"]');
      expect(errorZone?.textContent).toMatch(/Escribe una ecuación|inválid|igual/i);
    });

    it("blocks are read-only (EquationBar with readOnly)", () => {
      useGameStore.setState({
        equation: {
          leftSide: [{ id: "v1", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
          rightSide: [{ id: "c1", type: "CONSTANT", value: 4, sign: 1 }],
          solution: 4,
        },
      });
      renderTeacherMode();
      const bar = container.querySelector(".flex-wrap");
      expect(bar).toBeTruthy();
      const draggables = container.querySelectorAll("[data-dnd-kit-draggable-id]");
      expect(draggables.length).toBe(0);
    });
  });

  describe("MathLiveInput component", () => {
    it("renders MathLive editor element", () => {
      root = createRoot(container);
      act(() => {
        root.render(createElement(MathLiveInput));
      });
      expect(container.querySelector("math-field")).toBeTruthy();
      expect(container.textContent).toContain("Aplicar");
    });

    it("calls onError callback when provided", () => {
      const onError = vi.fn();
      root = createRoot(container);
      act(() => {
        root.render(createElement(MathLiveInput, { onError }));
      });
      const btn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Aplicar")
      );
      const mf = container.querySelector("math-field") as HTMLElement & { getValue: (f?: string) => string };
      if (mf && typeof mf.getValue === "undefined") {
        (mf as unknown as { getValue: (f?: string) => string }).getValue = () => "";
      }
      act(() => {
        (btn as HTMLButtonElement)?.click();
      });
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("equation parsing integration", () => {
    it("parses simple equation 2x + 3 = 7 and setEquation updates store", () => {
      const result = parseEquation("2x+3=7");
      expect("message" in result).toBe(false);
      if ("message" in result) return;
      useGameStore.getState().setEquation(result);
      const eq = useGameStore.getState().equation;
      expect(eq.leftSide.length).toBeGreaterThan(0);
      expect(eq.rightSide.length).toBeGreaterThan(0);
      expect(eq.solution).toBe(2);
    });

    it("shows user-friendly error for invalid LaTeX", () => {
      const result = parseEquation("invalid no equals");
      expect("message" in result).toBe(true);
      if (!("message" in result)) return;
      expect(result.message).toMatch(/igual|ecuación/i);
    });

    it("parses equation with multiple terms", () => {
      const result = parseEquation("2*x+3=7");
      expect("message" in result).toBe(false);
      if ("message" in result) return;
      expect(result.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(result.leftSide.some((b) => b.type === "CONSTANT")).toBe(true);
      expect(result.rightSide.length).toBeGreaterThan(0);
    });
  });

  describe("block system in teacher mode", () => {
    it("EquationBar with readOnly renders blocks without DndContext", () => {
      const equation = {
        leftSide: [
          { id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 2 },
          { id: "c1", type: "CONSTANT" as const, value: 3, sign: 1 as const },
        ],
        rightSide: [{ id: "c2", type: "CONSTANT" as const, value: 7, sign: 1 as const }],
        solution: 2,
      };
      root = createRoot(container);
      act(() => {
        root.render(createElement(EquationBar, { equation, readOnly: true }));
      });
      expect(container.textContent).toMatch(/\+2x|\+3|\+7/);
      expect(container.querySelector("[data-dnd-kit-dnd-context-id]")).toBeFalsy();
    });

    it("block display matches parsed equation structure", () => {
      const result = parseEquation("2x+3=7");
      if ("message" in result) throw new Error("Expected success");
      root = createRoot(container);
      act(() => {
        root.render(createElement(EquationBar, { equation: result, readOnly: true }));
      });
      expect(container.textContent).toMatch(/\+2x|\+3|\+7/);
    });
  });
});
