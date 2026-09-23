import { create } from "zustand";
import type { EquationState, GameState, Level, Role, Side } from "@/shared/types";
import {
  EXERCISES_PER_LEVEL,
  initialGameState,
  initialHintState,
} from "@/shared/types";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/features/persistence";
import { generateEquation } from "@/features/equation-engine";
import {
  validateMove,
  applyMove as applyMoveBlock,
  simplifyEquation,
  checkVictory,
  describeMove,
} from "@/features/block-system";

export interface LastFailedMove {
  blockId: string;
  timestamp: number;
}

export interface RequestNewEquationOptions {
  isFirstOfLevel?: boolean;
}

interface GameStore extends GameState {
  lastFailedMove: LastFailedMove | null;
  setRole: (role: Role | null) => void;
  setEquation: (equation: EquationState) => void;
  setLevel: (level: Level) => void;
  applyMove: (blockId: string, fromSide: Side, toSide: Side) => void;
  clearLastFailedMove: () => void;
  requestNewEquation: (options?: RequestNewEquationOptions) => void;
  recordError: () => void;
  clearHint: () => void;
  showHintForBlock: (blockId: string) => void;
  persistToLocalStorage: () => void;
  hydrateFromLocalStorage: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState,
  lastFailedMove: null,

  setRole: (role) => set({ role }),

  setEquation: (equation) =>
    set({ equation: { ...equation } }),

  setLevel: (level) => {
    if (level > get().maxUnlockedLevel) return;
    set((state) => ({
      currentLevel: level,
      score: 0,
      hint: { ...state.hint, isFirstExerciseOfLevel: true },
    }));
  },

  applyMove: (blockId, fromSide, toSide) => {
    const state = get();
    const equation = state.equation;
    const sideBlocks = fromSide === "left" ? equation.leftSide : equation.rightSide;
    const block = sideBlocks.find((b) => b.id === blockId);
    if (!block) return;

    const validation = validateMove(block, fromSide, toSide, equation);
    if (!validation.valid) {
      set({ lastFailedMove: { blockId, timestamp: Date.now() } });
      get().recordError();
      return;
    }

    const newEquation = applyMoveBlock(equation, blockId, fromSide, toSide);
    const simplified = simplifyEquation(newEquation);
    const crossing = fromSide !== toSide;
    set((s) => ({
      equation: simplified,
      solutionSteps:
        crossing
          ? [
              ...s.solutionSteps,
              {
                stepNumber: s.solutionSteps.length + 1,
                description: describeMove(block, fromSide, toSide, equation),
                equationAfter: simplified,
              },
            ]
          : s.solutionSteps,
    }));

    if (checkVictory(simplified)) {
      set((s) => {
        const newScore = Math.min(s.score + 1, EXERCISES_PER_LEVEL);
        const nextMaxUnlocked: Level =
          newScore === EXERCISES_PER_LEVEL && s.currentLevel < 3
            ? (Math.max(s.maxUnlockedLevel, s.currentLevel + 1) as Level)
            : s.maxUnlockedLevel;
        return {
          score: newScore,
          totalScore: s.totalScore + 1,
          maxUnlockedLevel: nextMaxUnlocked,
        };
      });
      get().clearHint();
      get().persistToLocalStorage();
      // TODO (FR4): optional playPopSound() when user preference enabled
    }
  },

  clearLastFailedMove: () => set({ lastFailedMove: null }),

  requestNewEquation: (options) => {
    const state = get();
    const level = state.currentLevel;
    const result = generateEquation(level);
    const isFirstOfLevel = options?.isFirstOfLevel === true;
    const resetScore = state.score === EXERCISES_PER_LEVEL;
    set((s) => ({
      equation: { ...result },
      ...(resetScore ? { score: 0 } : {}),
      hint: {
        ...initialHintState,
        isFirstExerciseOfLevel: isFirstOfLevel ? s.hint.isFirstExerciseOfLevel : false,
      },
      solutionSteps: [],
    }));
  },

  recordError: () => {
    set((state) => {
      const consecutiveErrors = state.hint.consecutiveErrors + 1;
      const showHint = consecutiveErrors >= 2;
      const blocks = state.equation.leftSide;
      const firstStandaloneConstant = blocks.find(
        (b, i) => b.type === "CONSTANT" && blocks[i + 1]?.type !== "VARIABLE"
      );
      const firstCoefficientConstant = blocks.find(
        (b, i) => b.type === "CONSTANT" && blocks[i + 1]?.type === "VARIABLE"
      );
      const suggestedBlock = firstStandaloneConstant ?? firstCoefficientConstant ?? null;
      const targetBlockId =
        showHint && suggestedBlock ? suggestedBlock.id : state.hint.targetBlockId;
      return {
        hint: {
          ...state.hint,
          consecutiveErrors,
          showHint: showHint || state.hint.showHint,
          targetBlockId,
        },
      };
    });
  },

  showHintForBlock: (blockId) =>
    set((state) => ({
      hint: {
        ...state.hint,
        showHint: true,
        targetBlockId: blockId,
      },
    })),

  clearHint: () =>
    set((state) => ({
      hint: {
        ...state.hint,
        showHint: false,
        targetBlockId: null,
        consecutiveErrors: 0,
      },
    })),

  persistToLocalStorage: () => {
    const state = get();
    if (state.role === null) return;
    saveToLocalStorage({
      role: state.role,
      lastLevel: state.currentLevel,
      totalScore: state.totalScore,
      maxUnlockedLevel: state.maxUnlockedLevel,
      hasCompletedLevels: [],
    });
  },

  hydrateFromLocalStorage: () => {
    const partial = loadFromLocalStorage();
    set((state) => ({
      ...state,
      ...partial,
    }));
  },
}));
