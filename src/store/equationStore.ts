import { create } from "zustand";
import { parseInput } from "@/modules/parser";
import { solve } from "@/modules/solver";
import type { AppState, Equation, Solution } from "@/types";

const initialSolution: Solution = {
  hasSolution: false,
  steps: [],
};

const initialState: AppState = {
  rawInput: "",
  activeMode: "LINEAR_1VAR",
  equations: [],
  solution: initialSolution,
};

interface EquationStore extends AppState {
  setInput: (rawInput: string) => void;
  updateCoefficient: (
    eqId: number,
    coef: "a" | "b" | "c",
    value: number
  ) => void;
}

export const useEquationStore = create<EquationStore>((set) => ({
  ...initialState,

  setInput: (rawInput: string) => {
    const result = parseInput(rawInput);
    if (!result.valid) {
      set({
        rawInput,
        activeMode: "LINEAR_1VAR",
        equations: [],
        solution: { hasSolution: false, steps: [{ label: result.message }] },
      });
      return;
    }
    const solution = solve(result.equations, result.mode);
    set({
      rawInput,
      activeMode: result.mode,
      equations: result.equations,
      solution,
    });
  },

  updateCoefficient: (eqId: number, coef: "a" | "b" | "c", value: number) => {
    set((state) => {
      const equations = state.equations.map((eq: Equation) =>
        eq.id === eqId
          ? {
              ...eq,
              coefficients: { ...eq.coefficients, [coef]: value },
              coefficientDisplays: { ...eq.coefficientDisplays, [coef]: undefined },
            }
          : eq
      );
      const solution = solve(equations, state.activeMode);
      return { equations, solution };
    });
  },
}));
