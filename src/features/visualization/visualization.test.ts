/**
 * Fase 3 — Visualization (FR3)
 * Tests para verificar la implementación correcta de:
 * - blocksToLineCoefficients: convierte EquationState a coeficientes de línea
 * - THEME_COLORS: colores del tema según PRD
 * - ValueTable data logic, useEquationCurve, EquationGraph mount
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import type { EquationState, Block } from "@/shared/types";
import {
  blocksToLineCoefficients,
  THEME_COLORS,
  useEquationCurve,
  EquationGraph,
} from "./index";
import { initialEquationState } from "@/shared/types";

function eq(
  leftSide: Block[],
  rightSide: Block[],
  solution = 0
): EquationState {
  return { leftSide, rightSide, solution };
}

describe("features/visualization (Fase 3)", () => {
  describe("THEME_COLORS (modern clean theme)", () => {
    it("has accent = #10b981", () => {
      expect(THEME_COLORS.accent).toBe("#10b981");
    });
    it("has accentLight = #34d399", () => {
      expect(THEME_COLORS.accentLight).toBe("#34d399");
    });
    it("has darkBg = #09090b", () => {
      expect(THEME_COLORS.darkBg).toBe("#09090b");
    });
    it("has axesGray = #3f3f46", () => {
      expect(THEME_COLORS.axesGray).toBe("#3f3f46");
    });
  });

  describe("blocksToLineCoefficients", () => {
    it("converts ax + b = c to line coefficients { a, b, c } for Ax + By + C = 0 form", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 3, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 7, sign: 1 }]
      );
      const result = blocksToLineCoefficients(equation);
      expect(result.b).toBe(-1);
      expect(result.a).toBe(2);
      expect(result.c).toBe(3 - 7);
    });

    it("handles equation 2x + 3 = 7 correctly (slope=2, y-intercept from rearrangement)", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 3, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 7, sign: 1 }]
      );
      const { a, b, c } = blocksToLineCoefficients(equation);
      expect(a).toBe(2);
      expect(b).toBe(-1);
      expect(c).toBe(-4);
      expect(a * 2 + c).toBeCloseTo(0);
    });

    it("handles negative coefficients correctly", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: -1, coefficient: 3 },
          { id: "l1", type: "CONSTANT", value: 5, sign: -1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 1, sign: 1 }]
      );
      const { a, b, c } = blocksToLineCoefficients(equation);
      expect(a).toBe(-3);
      expect(b).toBe(-1);
      expect(c).toBe(-5 - 1);
    });

    it("handles equation with variables on both sides (Level 3)", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 1, sign: 1 },
        ],
        [
          { id: "r0", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          { id: "r1", type: "CONSTANT", value: 5, sign: 1 },
        ]
      );
      const { a, b, c } = blocksToLineCoefficients(equation);
      expect(a).toBe(2 - 1);
      expect(b).toBe(-1);
      expect(c).toBe(1 - 5);
    });

    it("returns valid coefficients for graphing a line", () => {
      const equation = eq(
        [{ id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
        [{ id: "r0", type: "CONSTANT", value: 6, sign: 1 }]
      );
      const { a, b, c } = blocksToLineCoefficients(equation);
      expect(typeof a).toBe("number");
      expect(typeof c).toBe("number");
      expect(b).toBe(-1);
    });

    it("returns default for empty equation", () => {
      const result = blocksToLineCoefficients(initialEquationState);
      expect(result).toEqual({ a: 0, b: -1, c: 0 });
    });
  });

  describe("ValueTable data generation", () => {
    it("generates x-y pairs for a given range via coefficients", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 0, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 0, sign: 1 }]
      );
      const { a, c } = blocksToLineCoefficients(equation);
      expect(a).toBe(2);
      expect(c).toBe(0);
      for (const x of [-2, 0, 3]) {
        expect(a * x + c).toBe(2 * x);
      }
    });

    it("uses integer x values in reasonable range (e.g., -5 to 5)", () => {
      const equation = eq(
        [{ id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 }],
        [{ id: "r0", type: "CONSTANT", value: 0, sign: 1 }]
      );
      const { a, c } = blocksToLineCoefficients(equation);
      for (let x = -5; x <= 5; x++) {
        const y = a * x + c;
        expect(Number.isFinite(y)).toBe(true);
      }
    });

    it("calculates correct y values based on equation (2x - 4)", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 3, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 7, sign: 1 }]
      );
      const { a, c } = blocksToLineCoefficients(equation);
      expect(a).toBe(2);
      expect(c).toBe(-4);
      expect(a * 2 + c).toBe(0);
    });
  });

  describe("useEquationCurve", () => {
    it("returns fn and solutionX for equation 2x + 3 = 7", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 2 },
          { id: "l1", type: "CONSTANT", value: 3, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 7, sign: 1 }]
      );
      const { fn, solutionX } = useEquationCurve(equation);
      expect(fn(0)).toBe(-4);
      expect(fn(2)).toBe(0);
      expect(solutionX).toBe(2);
    });
    it("returns solutionX null when line is horizontal", () => {
      const equation = eq(
        [{ id: "l0", type: "CONSTANT", value: 5, sign: 1 }],
        [{ id: "r0", type: "CONSTANT", value: 5, sign: 1 }]
      );
      const { solutionX } = useEquationCurve(equation);
      expect(solutionX).toBeNull();
    });
  });

  describe("EquationGraph integration", () => {
    beforeEach(() => {
      if (typeof ResizeObserver === "undefined") {
        vi.stubGlobal(
          "ResizeObserver",
          class {
            observe = vi.fn();
            disconnect = vi.fn();
            unobserve = vi.fn();
          }
        );
      }
    });

    it("renders empty state with message when equation has no blocks", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(
          createElement(EquationGraph, { equation: initialEquationState })
        );
      });
      expect(container.textContent).toContain("Ingresa una ecuación");
      root.unmount();
      document.body.removeChild(container);
    });

    it("renders with valid equation without throwing", () => {
      const equation = eq(
        [
          { id: "l0", type: "VARIABLE", value: 1, sign: 1, coefficient: 1 },
          { id: "l1", type: "CONSTANT", value: 0, sign: 1 },
        ],
        [{ id: "r0", type: "CONSTANT", value: 0, sign: 1 }]
      );
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(createElement(EquationGraph, { equation }));
      });
      root.unmount();
      document.body.removeChild(container);
    });
  });
});
