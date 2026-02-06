export type Role = "TEACHER" | "STUDENT";
export type Level = 1 | 2 | 3;
export type Side = "left" | "right";

export interface Block {
  id: string;
  value: number;
  type: "VARIABLE" | "CONSTANT";
  sign: 1 | -1;
  /** Only for VARIABLE. When a CONSTANT immediately precedes a VARIABLE, it represents the coefficient multiplying that variable. VARIABLE with no preceding CONSTANT has implicit coefficient 1. */
  coefficient?: number;
}

export interface EquationState {
  leftSide: Block[];
  rightSide: Block[];
  solution: number;
}

export interface HintState {
  showHint: boolean;
  targetBlockId: string | null;
  isFirstExerciseOfLevel: boolean;
  consecutiveErrors: number;
}

export interface GameState {
  role: Role | null;
  currentLevel: Level;
  score: number;
  totalScore: number;
  equation: EquationState;
  hint: HintState;
}

export interface LocalStorageData {
  role: Role;
  lastLevel: Level;
  totalScore: number;
  hasCompletedLevels: boolean[];
}

export const initialEquationState: EquationState = {
  leftSide: [],
  rightSide: [],
  solution: 0,
};

export const initialHintState: HintState = {
  showHint: false,
  targetBlockId: null,
  isFirstExerciseOfLevel: true,
  consecutiveErrors: 0,
};

export const initialGameState: GameState = {
  role: null,
  currentLevel: 1,
  score: 0,
  totalScore: 0,
  equation: initialEquationState,
  hint: initialHintState,
};
