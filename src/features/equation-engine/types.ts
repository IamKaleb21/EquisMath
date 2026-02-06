import type { Block, EquationState } from "@/shared/types";

/** Result of generate or parse: same shape as EquationState. */
export interface EquationResult extends EquationState {
  leftSide: Block[];
  rightSide: Block[];
  solution: number;
}

export interface ParseError {
  message: string;
}
