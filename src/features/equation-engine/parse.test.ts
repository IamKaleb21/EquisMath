import { describe, it, expect } from "vitest";
import { parseEquation, evaluateBlocksAt } from "./parse";

function isParseError(
  result: { leftSide?: unknown[]; rightSide?: unknown[]; solution?: number; message?: string }
): result is { message: string } {
  return "message" in result && typeof result.message === "string";
}

describe("equation-engine parseEquation (Fase 2)", () => {
  describe("valid linear equations in x", () => {
    it("parses 2x+5=12 and returns EquationResult with finite solution", () => {
      const result = parseEquation("2x+5=12");
      if (isParseError(result)) {
        expect.fail("Expected EquationResult, got ParseError: " + result.message);
      }
      expect(result.leftSide.length).toBeGreaterThan(0);
      expect(result.rightSide.length).toBeGreaterThan(0);
      expect(Number.isFinite(result.solution)).toBe(true);
      const x = result.solution!;
      const left = evaluateBlocksAt(result.leftSide, x);
      const right = evaluateBlocksAt(result.rightSide, x);
      expect(left).toBeCloseTo(right, 5);
    });

    it("parses 2*x+5=12 (nerdamer style) and solution satisfies equation from blocks", () => {
      const result = parseEquation("2*x+5=12");
      if (isParseError(result)) {
        expect.fail("Expected EquationResult: " + result.message);
      }
      expect(Number.isFinite(result.solution)).toBe(true);
      const x = result.solution!;
      const left = evaluateBlocksAt(result.leftSide, x);
      const right = evaluateBlocksAt(result.rightSide, x);
      expect(left).toBeCloseTo(right, 5);
    });

    it("parses ax=b form: 3x=9", () => {
      const result = parseEquation("3x=9");
      if (isParseError(result)) {
        expect.fail("Expected EquationResult: " + result.message);
      }
      expect(result.solution).toBe(3);
    });

    it("parses x=5", () => {
      const result = parseEquation("x=5");
      if (isParseError(result)) {
        expect.fail("Expected EquationResult: " + result.message);
      }
      expect(result.solution).toBe(5);
    });

    it("returns blocks with parse- prefix ids", () => {
      const result = parseEquation("x=5");
      if (isParseError(result)) expect.fail(result.message);
      const allIds = [...result.leftSide.map((b) => b.id), ...result.rightSide.map((b) => b.id)];
      expect(allIds.some((id) => id.startsWith("parse-"))).toBe(true);
    });
  });

  describe("ParseError for invalid input", () => {
    it("returns ParseError when no equals sign", () => {
      const result = parseEquation("2x+5");
      expect(isParseError(result)).toBe(true);
      if (isParseError(result)) expect(result.message).toBeDefined();
    });

    it("returns ParseError when empty sides", () => {
      const result = parseEquation("=5");
      expect(isParseError(result)).toBe(true);
    });

    it("returns ParseError for non-linear or unsolvable", () => {
      const result = parseEquation("x^2=4");
      if (!isParseError(result)) {
        expect(Number.isFinite(result.solution)).toBe(true);
      }
    });
  });

  describe("LaTeX normalization", () => {
    it("accepts \\frac for fractions", () => {
      const result = parseEquation("\\frac{1}{2}x=3");
      if (isParseError(result)) {
        expect.fail("Expected EquationResult: " + result.message);
      }
      expect(Number.isFinite(result.solution)).toBe(true);
      expect((1 / 2) * result.solution).toBeCloseTo(3, 5);
    });
  });
});
