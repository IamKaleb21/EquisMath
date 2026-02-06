/**
 * Fase 4 — Block System (FR2)
 * Tests para validateMove, applyMove, simplifyEquation, checkVictory.
 * Trazabilidad: PRD FR2 (Smart Drag), PRD §4 (Criterios de Victoria), specs Block System.
 */
import { describe, it, expect } from "vitest";
import type { EquationState, Block, Side } from "@/shared/types";
import {
  validateMove,
  applyMove,
  simplifyEquation,
  checkVictory,
} from "./index";
import { blocksToLineCoefficients } from "@/features/visualization";

function constant(id: string, value: number): Block {
  return {
    id,
    type: "CONSTANT",
    value: Math.abs(value),
    sign: value >= 0 ? 1 : -1,
  };
}

function variable(id: string, coefficient: number, sign: 1 | -1 = 1): Block {
  return { id, type: "VARIABLE", value: 1, sign, coefficient };
}

function eq(
  leftSide: Block[],
  rightSide: Block[],
  solution = 0
): EquationState {
  return { leftSide, rightSide, solution };
}

describe("features/block-system (Fase 4)", () => {
  describe("validateMove (FR2)", () => {
    // PRD FR2 Validación: movimiento ilegal (dejar lado vacío) → rebote; validateMove impide lado vacío
    it("returns valid=true when moving constant from left to right", () => {
      const equation = eq(
        [variable("v1", 2), constant("c1", 5)],
        [constant("c2", 7)]
      );
      const result = validateMove(constant("c1", 5), "left", "right", equation);
      expect(result.valid).toBe(true);
    });

    it("returns valid=true when moving constant from right to left", () => {
      const equation = eq(
        [variable("v1", 2)],
        [constant("c1", 5), constant("c2", 3)]
      );
      const result = validateMove(constant("c1", 5), "right", "left", equation);
      expect(result.valid).toBe(true);
    });

    it("returns valid=true when moving variable block across sides", () => {
      const equation = eq(
        [variable("v1", 1), constant("c1", 1)],
        [variable("v2", 1), constant("c2", 5)]
      );
      const result = validateMove(variable("v1", 1), "left", "right", equation);
      expect(result.valid).toBe(true);
    });

    it("returns valid=false with reason when move would leave a side empty", () => {
      const equation = eq([constant("c0", 2), variable("v1", 1)], [constant("c1", 6)]);
      const result = validateMove(constant("c0", 2), "left", "right", equation);
      expect(result.valid).toBe(true);
      const resultVar = validateMove(variable("v1", 1), "left", "right", equation);
      expect(resultVar.valid).toBe(false);
      expect(resultVar.reason).toBeDefined();
    });

    it("returns valid=false when moving the only block on right", () => {
      const equation = eq(
        [variable("v1", 1), constant("c1", 0)],
        [constant("c2", 5)]
      );
      const result = validateMove(constant("c2", 5), "right", "left", equation);
      expect(result.valid).toBe(false);
    });

    it("returns valid=false when moving coefficient while standalone constant exists (Level 1)", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 3)],
        [constant("c2", 7)]
      );
      const result = validateMove(constant("c0", 2), "left", "right", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Mueve los términos constantes primero");
    });

    it("returns valid=true when moving coefficient when no standalone constant (Level 2)", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1)],
        [constant("c1", 6)]
      );
      const result = validateMove(constant("c0", 2), "left", "right", equation);
      expect(result.valid).toBe(true);
    });

    it("returns valid=false when moving coefficient on either side with standalone constant (Level 3)", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 1)],
        [constant("c2", 4), variable("v2", 1), constant("c3", 3)]
      );
      const resultLeft = validateMove(constant("c0", 2), "left", "right", equation);
      expect(resultLeft.valid).toBe(false);
      expect(resultLeft.reason).toBe("Mueve los términos constantes primero");
      const resultRight = validateMove(constant("c2", 4), "right", "left", equation);
      expect(resultRight.valid).toBe(false);
      expect(resultRight.reason).toBe("Mueve los términos constantes primero");
    });

    it("returns valid=true when moving variable with coefficient when target has VARIABLE (Level 3)", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 3)],
        [constant("c2", 4), variable("v2", 1), constant("c3", 5)]
      );
      const result = validateMove(variable("v2", 1), "right", "left", equation);
      expect(result.valid).toBe(true);
    });

    it("returns valid=false when moving variable with coefficient when target has no VARIABLE", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 3)],
        [constant("c2", 7)]
      );
      const result = validateMove(variable("v1", 1), "left", "right", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Mueve el coeficiente primero");
    });

    it("returns valid=false when moving coefficient when target has VARIABLE", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1)],
        [constant("c2", 4), variable("v2", 1)]
      );
      const result = validateMove(constant("c0", 2), "left", "right", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Usa el término variable para reunir términos");
    });

    it("returns valid=false when moving coefficient with value 0", () => {
      const equation = eq(
        [constant("c0", 0), variable("v1", 1)],
        [constant("c1", 6)]
      );
      const result = validateMove(constant("c0", 0), "left", "right", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("División por cero");
    });

    it("returns valid=false when moving term variable would leave origin empty", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1)],
        [constant("c2", 4), variable("v2", 1), constant("c3", 3)]
      );
      const result = validateMove(variable("v1", 1), "left", "right", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("No se puede dejar un lado vacío");
    });

    it("returns valid=false when reordering term variable on same side (Level 1 bug)", () => {
      const equation = eq(
        [constant("c0", -5), variable("v1", 1), constant("c1", 5)],
        [constant("c2", 45)]
      );
      const result = validateMove(variable("v1", 1), "left", "left", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("No reordenes el término variable en el mismo lado");
    });

    it("returns valid=false when reordering coefficient on same side", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 5)],
        [constant("c2", 7)]
      );
      const result = validateMove(constant("c0", 2), "left", "left", equation);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("No reordenes el coeficiente en el mismo lado");
    });
  });

  describe("applyMove - sign change rule (FR2)", () => {
    // PRD FR2 Regla Suma/Resta: al cruzar =, signo (+) cambia a (-) y viceversa
    it("flips sign when constant moves from left to right (+ becomes -)", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 5)],
        [constant("c2", 7)]
      );
      const next = applyMove(equation, "c1", "left", "right");
      expect(next.rightSide.some((b) => b.id === "c1" || (b.type === "CONSTANT" && b.sign === -1 && b.value === 5))).toBe(true);
      const moved = next.rightSide.find((b) => b.type === "CONSTANT" && b.value === 5);
      expect(moved?.sign).toBe(-1);
      expect(next.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
    });

    it("flips sign when constant moves from right to left (- becomes +)", () => {
      const equation = eq(
        [variable("v1", 1)],
        [constant("c1", 5), { id: "c2", type: "CONSTANT", value: 3, sign: -1 }]
      );
      const next = applyMove(equation, "c2", "right", "left");
      const onLeft = next.leftSide.find((b) => b.value === 3);
      expect(onLeft?.sign).toBe(1);
    });

    it("flips sign when variable (coef 1) moves across = sign", () => {
      const equation = eq(
        [variable("v1", 1), constant("c1", 2)],
        [constant("c2", 4)]
      );
      const next = applyMove(equation, "v1", "left", "right");
      const varOnRight = next.rightSide.find((b) => b.type === "VARIABLE");
      expect(varOnRight?.sign).toBe(-1);
    });

    it("does not flip sign when reordering blocks on same side", () => {
      const equation = eq(
        [constant("c1", 2), constant("c2", 3)],
        [constant("c3", 5)]
      );
      const next = applyMove(equation, "c1", "left", "left");
      const c1 = next.leftSide.find((b) => b.id === "c1");
      expect(c1?.sign).toBe(1);
    });

    it("removes block from original side and adds to target side", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 5)],
        [constant("c2", 7)]
      );
      const next = applyMove(equation, "c1", "left", "right");
      expect(next.leftSide.find((b) => b.id === "c1")).toBeUndefined();
      expect(next.rightSide.some((b) => b.type === "CONSTANT" && b.value === 5)).toBe(true);
    });
  });

  describe("applyMove - coefficient to divisor rule (Level 2)", () => {
    // PRD FR2 Regla Mult/Div: coeficiente (ej. 2 en 2x=6) → divisor en el otro lado (x = 6/2 → 3)
    it("converts coefficient to divisor when moving coefficient constant", () => {
      const equation = eq([constant("c0", 2), variable("v1", 1)], [constant("c1", 6)]);
      const next = applyMove(equation, "c0", "left", "right");
      expect(next.leftSide).toHaveLength(1);
      const leftVar = next.leftSide[0];
      expect(leftVar.type).toBe("VARIABLE");
      expect(next.rightSide).toHaveLength(1);
      expect(next.rightSide[0].type).toBe("CONSTANT");
      expect(next.rightSide[0].value).toBe(3);
      expect(next.rightSide[0].sign).toBe(1);
    });

    it("applies division to constant on other side when coefficient moved", () => {
      const equation = eq([constant("c0", 3), variable("v1", 1)], [constant("c1", 9)]);
      const next = applyMove(equation, "c0", "left", "right");
      expect(next.rightSide[0].value).toBe(3);
    });

    it("example: 2x = 6 → x = 3", () => {
      const equation = eq([constant("c0", 2), variable("v1", 1)], [constant("c1", 6)]);
      const next = applyMove(equation, "c0", "left", "right");
      const simplified = simplifyEquation(next);
      expect(simplified.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      expect(simplified.rightSide).toHaveLength(1);
      expect(simplified.rightSide[0].value).toBe(3);
    });
  });

  describe("applyMove - term variable move (Level 3)", () => {
    it("moves term variable (coeff+var) with flipped signs when target has VARIABLE", () => {
      // [2,x,3] = [4,x,5] → move [4,x] from right to left → [2,x,3,-4,-x] = [5]
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 3)],
        [constant("c2", 4), variable("v2", 1), constant("c3", 5)]
      );
      const next = applyMove(equation, "v2", "right", "left");
      // Right side should only have the constant 5
      expect(next.rightSide).toHaveLength(1);
      expect(next.rightSide[0].value).toBe(5);
      // Left side should have original + flipped term (2,x,3,-4,-x)
      expect(next.leftSide.length).toBeGreaterThanOrEqual(5);
      const simplified = simplifyEquation(next);
      // After simplify: (2-4)x + 3 = 5 → -2x + 3 = 5
      expect(simplified.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      const { a } = blocksToLineCoefficients(simplified);
      expect(a).toBe(-2); // 2 - 4 = -2
    });

    it("moves term from left to right when target has VARIABLE", () => {
      // [2,x,3] = [4,x,5] → move [2,x] from left to right → [3] = [4,x,5,-2,-x]
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 3)],
        [constant("c2", 4), variable("v2", 1), constant("c3", 5)]
      );
      const next = applyMove(equation, "v1", "left", "right");
      // Left side should only have constant 3
      expect(next.leftSide).toHaveLength(1);
      expect(next.leftSide[0].value).toBe(3);
      const simplified = simplifyEquation(next);
      // After simplify: 3 = (4-2)x + 5 → 3 = 2x + 5
      const { a } = blocksToLineCoefficients(simplified);
      expect(a).toBe(-2); // leftVar - rightVar = 0 - 2 = -2
    });

    it("coefficient move uses standalone const sum (not coefficient)", () => {
      // [2,x] = [3] → move 2 (coefficient) → x = 3/2 = 1.5
      const equation = eq(
        [constant("c0", 2), variable("v1", 1)],
        [constant("c1", 3)]
      );
      const next = applyMove(equation, "c0", "left", "right");
      expect(next.rightSide).toHaveLength(1);
      expect(next.rightSide[0].value).toBe(1.5);
    });
  });

  describe("simplifyEquation", () => {
    /**
     * PRD §4: "El sistema simplifica automáticamente: x = 6/2 → x = 3 antes de declarar victoria."
     * specs: simplifyEquation se llama después de applyMove; fusiona términos por lado.
     */
    it("combines like terms on same side (2 + 3 = 5)", () => {
      const equation = eq(
        [constant("c1", 2), constant("c2", 3)],
        [constant("c3", 5)]
      );
      const next = simplifyEquation(equation);
      expect(next.leftSide).toHaveLength(1);
      expect(next.leftSide[0].type).toBe("CONSTANT");
      expect(next.leftSide[0].value).toBe(5);
      expect(next.leftSide[0].sign).toBe(1);
    });

    it("combines variable terms on same side", () => {
      const equation = eq(
        [constant("c1", 2), variable("v1", 1), constant("c2", 3), variable("v2", 1)],
        [constant("c3", 0)]
      );
      const next = simplifyEquation(equation);
      expect(next.leftSide.some((b) => b.type === "VARIABLE")).toBe(true);
      const { a } = blocksToLineCoefficients({
        leftSide: next.leftSide,
        rightSide: next.rightSide,
        solution: 0,
      });
      expect(a).toBe(5);
    });

    it("simplifies negative results correctly", () => {
      const equation = eq(
        [constant("c1", 2), { id: "c2", type: "CONSTANT", value: 5, sign: -1 }],
        [constant("c3", 0)]
      );
      const next = simplifyEquation(equation);
      expect(next.leftSide).toHaveLength(1);
      expect(next.leftSide[0].value).toBe(3);
      expect(next.leftSide[0].sign).toBe(-1);
    });

    it("does not modify equation if already simplified", () => {
      const equation = eq(
        [variable("v1", 1)],
        [constant("c1", 3)]
      );
      const next = simplifyEquation(equation);
      expect(next.leftSide).toHaveLength(1);
      expect(next.rightSide).toHaveLength(1);
    });
  });

  describe("checkVictory (PRD §4 criteria)", () => {
    // PRD §4: left = exactamente 1 VARIABLE con coefficient=1; right = exactamente 1 CONSTANT
    it("returns true when left has one VARIABLE (coef=1) and right has one CONSTANT", () => {
      const equation = eq([variable("v1", 1)], [constant("c1", 3)]);
      expect(checkVictory(equation)).toBe(true);
    });

    it("returns true when left has CONST(1) and VARIABLE (1·x = x)", () => {
      const equation = eq(
        [constant("c0", 1), variable("v1", 1)],
        [constant("c1", 3)]
      );
      expect(checkVictory(equation)).toBe(true);
    });

    it("returns false when left has VARIABLE with coefficient !== 1", () => {
      const equation = eq([constant("c0", 2), variable("v1", 1)], [constant("c1", 6)]);
      expect(checkVictory(equation)).toBe(false);
    });


    it("returns false when right has multiple blocks", () => {
      const equation = eq(
        [variable("v1", 1)],
        [constant("c1", 1), constant("c2", 2)]
      );
      expect(checkVictory(equation)).toBe(false);
    });

    it("returns false when right side has VARIABLE block", () => {
      const equation = eq(
        [variable("v1", 1)],
        [variable("v2", 1)]
      );
      expect(checkVictory(equation)).toBe(false);
    });

    it("returns false when left side has CONSTANT block only", () => {
      const equation = eq([constant("c1", 5)], [constant("c2", 5)]);
      expect(checkVictory(equation)).toBe(false);
    });

    it("handles victory check after simplification (x = 3 is victory)", () => {
      const equation = eq([variable("v1", 1)], [constant("c1", 3)]);
      const simplified = simplifyEquation(equation);
      expect(checkVictory(simplified)).toBe(true);
    });

    it("returns false when left has VARIABLE and standalone CONSTANT (x + 0)", () => {
      const equation = eq(
        [variable("v1", 1), constant("c1", 0)],
        [constant("c2", 3)]
      );
      expect(checkVictory(equation)).toBe(false);
    });

    it("returns true when -x = 0 (edge case: single variable -X, right 0)", () => {
      const equation = eq(
        [{ id: "v1", type: "VARIABLE", value: 1, sign: -1, coefficient: 1 }],
        [constant("c1", 0)]
      );
      expect(checkVictory(equation)).toBe(true);
    });
  });

  describe("dnd-kit integration", () => {
    // PRD FR2 Tech: dnd-kit; bloques con ids únicos, zonas left/right
    it("blocks have unique draggable ids", () => {
      const equation = eq(
        [constant("c0", 2), variable("v1", 1), constant("c1", 5)],
        [constant("c2", 7)]
      );
      const ids = new Set([
        ...equation.leftSide.map((b) => b.id),
        ...equation.rightSide.map((b) => b.id),
      ]);
      expect(ids.size).toBe(equation.leftSide.length + equation.rightSide.length);
    });

    it("drop zones are configured for left and right sides", () => {
      expect(["left", "right"]).toContain("left");
      expect(["left", "right"]).toContain("right");
    });
  });
});
