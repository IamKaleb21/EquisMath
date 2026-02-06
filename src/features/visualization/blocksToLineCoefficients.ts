import type { EquationState, Block } from "@/shared/types";

/** CONSTANT immediately before VARIABLE = coefficient. VARIABLE without preceding CONSTANT = coefficient 1. */
function sideVarCoef(blocks: Block[]): number {
  let sum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT") {
      const next = blocks[i + 1];
      if (next?.type === "VARIABLE") sum += curr.sign * curr.value;
    } else if (curr.type === "VARIABLE") {
      const prev = blocks[i - 1];
      if (prev?.type !== "CONSTANT") sum += curr.sign * (curr.coefficient ?? 1);
    }
  }
  return sum;
}

/** CONSTANT not immediately before VARIABLE = standalone constant. */
function sideConst(blocks: Block[]): number {
  let sum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT") {
      const next = blocks[i + 1];
      if (next?.type !== "VARIABLE") sum += curr.sign * curr.value;
    }
  }
  return sum;
}

/**
 * Converts equation blocks to line coefficients for Ax + By + C = 0.
 * We plot y = LHS(x) - RHS(x), so y = Ax + C with A = leftVar - rightVar, C = leftConst - rightConst.
 * Returns { a: A, b: -1, c: C }.
 */
export function blocksToLineCoefficients(
  equation: EquationState
): { a: number; b: number; c: number } {
  const leftVar = sideVarCoef(equation.leftSide);
  const leftConst = sideConst(equation.leftSide);
  const rightVar = sideVarCoef(equation.rightSide);
  const rightConst = sideConst(equation.rightSide);
  const a = leftVar - rightVar;
  const c = leftConst - rightConst;
  return { a, b: -1, c };
}
