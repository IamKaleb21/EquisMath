import type { Block, EquationState } from "@/shared/types";

const COEF_EPS = 1e-9;

/** Left side effective coefficient: CONSTANT before VARIABLE = coef, else VARIABLE.coefficient ?? 1. */
function leftEffectiveVarCoef(blocks: Block[]): number {
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

/** Right side effective constant sum (standalone constants only). */
function rightConstValue(blocks: Block[]): number {
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

/** Victory: left = x (effective coef ±1 when right is 0, else coef 1), no standalone constants, right = single constant. */
export function checkVictory(equation: EquationState): boolean {
  const { leftSide, rightSide } = equation;
  const leftVarBlocks = leftSide.filter((b) => b.type === "VARIABLE");
  const rightConstBlocks = rightSide.filter((b) => b.type === "CONSTANT");
  if (leftVarBlocks.length !== 1 || rightConstBlocks.length !== 1) return false;
  const effectiveCoef = leftEffectiveVarCoef(leftSide);
  const rightVal = rightConstValue(rightSide);
  const leftStandaloneConst = leftSide.filter(
    (b, i) => b.type === "CONSTANT" && leftSide[i + 1]?.type !== "VARIABLE"
  );
  if (leftStandaloneConst.length > 0) return false;
  // x = k (effective coef 1)
  if (Math.abs(effectiveCoef - 1) < COEF_EPS) return true;
  // -x = 0 → x = 0 (edge case: single variable -X, no move possible, already solved)
  if (Math.abs(effectiveCoef + 1) < COEF_EPS && Math.abs(rightVal) < COEF_EPS) return true;
  return false;
}
