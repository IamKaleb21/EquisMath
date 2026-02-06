import { create } from "zustand";
import type { EquationState, GameState, Level, Role, Side } from "@/shared/types";
import {
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

  setLevel: (level) =>
    set((state) => ({
      currentLevel: level,
      hint: { ...state.hint, isFirstExerciseOfLevel: true },
    })),

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
    set({ equation: simplified });

    if (checkVictory(simplified)) {
      set((s) => ({
        score: s.score + 1,
        totalScore: s.totalScore + 1,
      }));
      get().clearHint();
      get().persistToLocalStorage();
      // TODO (FR4): optional playPopSound() when user preference enabled
    }
  },

  clearLastFailedMove: () => set({ lastFailedMove: null }),

  requestNewEquation: (options) => {
    const level = get().currentLevel;
    const result = generateEquation(level);
    const isFirstOfLevel = options?.isFirstOfLevel === true;
    set((state) => ({
      equation: { ...result },
      hint: {
        ...initialHintState,
        isFirstExerciseOfLevel: isFirstOfLevel ? state.hint.isFirstExerciseOfLevel : false,
      },
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
      hasCompletedLevels: [], // can be extended when we track level completion
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
