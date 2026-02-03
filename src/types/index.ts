export type EquationType = "LINEAR_1VAR" | "LINEAR_2VAR" | "SYSTEM";

export interface Equation {
  id: number;
  latex: string;
  coefficients: { a: number; b: number; c: number };
  /** Forma de mostrar cada coeficiente (fracción o decimal) según la entrada del usuario. */
  coefficientDisplays?: { a?: string; b?: string; c?: string };
  color: string;
}

export interface StepItem {
  label: string;
  latex?: string;
}

export interface Solution {
  hasSolution: boolean;
  x?: number;
  y?: number;
  steps: StepItem[];
}

export interface AppState {
  rawInput: string;
  activeMode: EquationType;
  equations: Equation[];
  solution: Solution;
}

export type ParserOutput =
  | { valid: true; mode: EquationType; equations: Equation[] }
  | { valid: false; message: string };
