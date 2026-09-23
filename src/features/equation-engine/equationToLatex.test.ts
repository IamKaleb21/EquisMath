import { describe, it, expect } from "vitest";
import { equationToLatex } from "./equationToLatex";
import type { EquationState } from "@/shared/types";

function eq(
  leftSide: EquationState["leftSide"],
  rightSide: EquationState["rightSide"],
  solution = 0
): EquationState {
  return { leftSide, rightSide, solution };
}

function constant(id: string, value: number, sign: 1 | -1 = 1) {
  return { id, type: "CONSTANT" as const, value: Math.abs(value), sign };
}

function variable(id: string, coefficient: number, sign: 1 | -1 = 1) {
  return { id, type: "VARIABLE" as const, value: 1, sign, coefficient };
}

describe("equationToLatex", () => {
  it("returns LaTeX for simple equation x=5", () => {
    const equation = eq(
      [variable("v1", 1)],
      [constant("c1", 5)]
    );
    const latex = equationToLatex(equation);
    expect(latex).toMatch(/x\s*=\s*5/);
  });

  it("returns LaTeX for 2x+5=7", () => {
    const equation = eq(
      [
        constant("c0", 2),
        variable("v1", 1),
        constant("c1", 5),
      ],
      [constant("c2", 7)]
    );
    const latex = equationToLatex(equation);
    expect(latex).toMatch(/2x/);
    expect(latex).toMatch(/5/);
    expect(latex).toMatch(/7/);
    expect(latex).toContain("=");
  });

  it("returns LaTeX for equation with negative terms -5x+5=-x+17", () => {
    const equation = eq(
      [
        constant("c0", 5, -1),
        variable("v1", 1),
        constant("c1", 5),
      ],
      [
        variable("v2", 1, -1),
        constant("c2", 17),
      ]
    );
    const latex = equationToLatex(equation);
    expect(latex).toMatch(/-5x|-5\s*\*\s*x/);
    expect(latex).toMatch(/17/);
    expect(latex).toContain("=");
  });

  it("returns valid LaTeX (no undefined or empty sides)", () => {
    const equation = eq(
      [constant("c0", 1), variable("v1", 1)],
      [constant("c1", 3)]
    );
    const latex = equationToLatex(equation);
    expect(latex.length).toBeGreaterThan(2);
    expect(latex).not.toMatch(/undefined/);
    expect(latex).toContain("=");
  });
});
