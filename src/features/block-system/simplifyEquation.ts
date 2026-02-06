import type { Block, EquationState } from "@/shared/types";

/** CONSTANT immediately before VARIABLE = coefficient. Otherwise CONSTANT = standalone. */
function mergeSide(blocks: Block[], sideLabel: "left" | "right"): Block[] {
  let varSum = 0;
  let constSum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT") {
      const next = blocks[i + 1];
      if (next?.type === "VARIABLE") {
        varSum += curr.sign * curr.value;
      } else {
        constSum += curr.sign * curr.value;
      }
    } else if (curr.type === "VARIABLE") {
      const prev = blocks[i - 1];
      const coef = prev?.type === "CONSTANT" ? 0 : curr.sign * (curr.coefficient ?? 1);
      if (coef !== 0) varSum += coef;
    }
  }

  const result: Block[] = [];
  if (varSum !== 0) {
    const absVar = Math.abs(varSum);
    if (absVar !== 1) {
      result.push({
        id: `simpl-${sideLabel}-coef`,
        type: "CONSTANT",
        value: absVar,
        sign: (varSum >= 0 ? 1 : -1) as 1 | -1,
      });
    }
    result.push({
      id: `simpl-${sideLabel}-var`,
      type: "VARIABLE",
      value: 1,
      sign: 1,
      coefficient: 1,
    });
  }
  if (constSum !== 0) {
    result.push({
      id: `simpl-${sideLabel}-const`,
      type: "CONSTANT",
      value: Math.abs(constSum),
      sign: (constSum >= 0 ? 1 : -1) as 1 | -1,
    });
  }
  if (result.length === 0) {
    result.push({
      id: `simpl-${sideLabel}-zero`,
      type: "CONSTANT",
      value: 0,
      sign: 1,
    });
  }
  return result;
}

export function simplifyEquation(equation: EquationState): EquationState {
  return {
    leftSide: mergeSide(equation.leftSide, "left"),
    rightSide: mergeSide(equation.rightSide, "right"),
    solution: equation.solution,
  };
}
