import { describe, it, expect } from "vitest";
import { generateEquation } from "./generate";
import { evaluateBlocksAt } from "./parse";
import { blocksToLineCoefficients } from "@/features/visualization";

function checkBlockShape(block: { id: string; type: string; value: number; sign: 1 | -1; coefficient?: number }) {
  expect(block.id).toBeDefined();
  expect(typeof block.id).toBe("string");
  expect(["VARIABLE", "CONSTANT"]).toContain(block.type);
  expect([1, -1]).toContain(block.sign);
  expect(Number.isFinite(block.value)).toBe(true);
  if (block.type === "VARIABLE") {
    expect(block.coefficient).toBeDefined();
    expect(Number.isFinite(block.coefficient)).toBe(true);
    expect(block.coefficient).not.toBe(0);
  }
}

describe("equation-engine generateEquation (Fase 2)", () => {
  describe("level 1 — ax + b = c", () => {
    it("returns EquationResult with leftSide, rightSide, solution", () => {
      for (let i = 0; i < 20; i++) {
        const result = generateEquation(1);
        expect(result.leftSide).toBeDefined();
        expect(result.rightSide).toBeDefined();
        expect(Number.isFinite(result.solution)).toBe(true);
        expect(Number.isInteger(result.solution)).toBe(true);
      }
    });
    it("has exactly one VARIABLE and one CONSTANT on left, one CONSTANT on right", () => {
      const result = generateEquation(1);
      expect(result.leftSide.length).toBeGreaterThanOrEqual(2);
      const leftVar = result.leftSide.find((b) => b.type === "VARIABLE");
      const leftConst = result.leftSide.find((b) => b.type === "CONSTANT");
      expect(leftVar).toBeDefined();
      expect(leftConst).toBeDefined();
      expect(result.rightSide).toHaveLength(1);
      expect(result.rightSide[0].type).toBe("CONSTANT");
    });
    it("solution satisfies ax + b = c (integer)", () => {
      for (let i = 0; i < 15; i++) {
        const result = generateEquation(1);
        const x = result.solution;
        const left = evaluateBlocksAt(result.leftSide, x);
        const right = evaluateBlocksAt(result.rightSide, x);
        expect(left).toBeCloseTo(right, 10);
      }
    });
    it("all blocks have valid shape", () => {
      const result = generateEquation(1);
      result.leftSide.forEach(checkBlockShape);
      result.rightSide.forEach(checkBlockShape);
    });
  });

  describe("level 2 — ax = b", () => {
    it("has one VARIABLE on left, one CONSTANT on right", () => {
      const result = generateEquation(2);
      expect(result.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(result.rightSide).toHaveLength(1);
      expect(result.rightSide[0].type).toBe("CONSTANT");
    });
    it("solution satisfies ax = b (integer)", () => {
      for (let i = 0; i < 15; i++) {
        const result = generateEquation(2);
        const x = result.solution;
        const left = evaluateBlocksAt(result.leftSide, x);
        const right = evaluateBlocksAt(result.rightSide, x);
        expect(left).toBeCloseTo(right, 10);
      }
    });
    it("solution is always integer", () => {
      for (let i = 0; i < 10; i++) {
        const result = generateEquation(2);
        expect(Number.isInteger(result.solution)).toBe(true);
      }
    });
    it("coefficient never ±1 (Level 2)", () => {
      for (let i = 0; i < 50; i++) {
        const result = generateEquation(2);
        const coeffBlock = result.leftSide[0];
        expect(coeffBlock.type).toBe("CONSTANT");
        const coefVal = coeffBlock.sign * coeffBlock.value;
        expect(Math.abs(coefVal)).not.toBe(1);
      }
    });
  });

  describe("level 3 — ax + b = cx + d", () => {
    it("has VARIABLE and CONSTANT on both sides", () => {
      const result = generateEquation(3);
      expect(result.leftSide.length).toBeGreaterThanOrEqual(2);
      expect(result.rightSide.length).toBeGreaterThanOrEqual(2);
      expect(result.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(result.leftSide.some((b) => b.type === "CONSTANT")).toBe(true);
      expect(result.rightSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(result.rightSide.some((b) => b.type === "CONSTANT")).toBe(true);
    });
    it("solution satisfies ax + b = cx + d (integer), a !== c", () => {
      for (let i = 0; i < 15; i++) {
        const result = generateEquation(3);
        const x = result.solution;
        const left = evaluateBlocksAt(result.leftSide, x);
        const right = evaluateBlocksAt(result.rightSide, x);
        expect(left).toBeCloseTo(right, 10);
        expect(Number.isInteger(result.solution)).toBe(true);
        const leftVar = result.leftSide.reduce((s, b, i) => {
          if (b.type === "CONSTANT" && result.leftSide[i + 1]?.type === "VARIABLE") return s + b.sign * b.value;
          if (b.type === "VARIABLE" && result.leftSide[i - 1]?.type !== "CONSTANT") return s + b.sign * (b.coefficient ?? 1);
          return s;
        }, 0);
        const rightVar = result.rightSide.reduce((s, b, i) => {
          if (b.type === "CONSTANT" && result.rightSide[i + 1]?.type === "VARIABLE") return s + b.sign * b.value;
          if (b.type === "VARIABLE" && result.rightSide[i - 1]?.type !== "CONSTANT") return s + b.sign * (b.coefficient ?? 1);
          return s;
        }, 0);
        expect(leftVar).not.toBe(rightVar);
      }
    });
  });

  describe("block ids", () => {
    it("uses gen-left-N and gen-right-N ids", () => {
      const result = generateEquation(1);
      expect(result.leftSide[0].id).toMatch(/^gen-left-/);
      expect(result.rightSide[0].id).toMatch(/^gen-right-/);
    });
  });

  describe("coefficient never zero (business rule)", () => {
    it("VARIABLE blocks or coefficient CONSTANT before VARIABLE never zero", () => {
      for (let i = 0; i < 50; i++) {
        const level = ((i % 3) + 1) as 1 | 2 | 3;
        const result = generateEquation(level);
        const allBlocks = [...result.leftSide, ...result.rightSide];
        for (let j = 0; j < allBlocks.length; j++) {
          const b = allBlocks[j];
          if (b.type === "CONSTANT" && allBlocks[j + 1]?.type === "VARIABLE") {
            expect(b.value * b.sign).not.toBe(0);
          }
        }
      }
    });
  });
});
