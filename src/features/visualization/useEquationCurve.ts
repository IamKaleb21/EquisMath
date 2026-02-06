import type { EquationState } from "@/shared/types";
import { blocksToLineCoefficients } from "./blocksToLineCoefficients";

export interface EquationCurveResult {
  fn: (x: number) => number;
  solutionX: number | null;
}

/**
 * Returns line data for the equation y = LHS(x) - RHS(x).
 * solutionX is the x where y = 0 (equation solution), or null if the line is horizontal (a === 0).
 */
export function useEquationCurve(equation: EquationState): EquationCurveResult {
  const { a, c } = blocksToLineCoefficients(equation);
  const fn = (x: number) => a * x + c;
  const solutionX = a !== 0 ? -c / a : null;
  return { fn, solutionX };
}
