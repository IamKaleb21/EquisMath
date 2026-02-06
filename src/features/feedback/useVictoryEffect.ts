/**
 * FR4: Subscribe to victory and trigger confetti once per victory.
 * Does not fire on initial mount.
 */
import { useEffect, useRef } from "react";
import { useGameStore } from "@/shared/store/gameStore";
import { checkVictory } from "@/features/block-system";
import { triggerConfetti } from "./triggerConfetti";

export function useVictoryEffect(): void {
  const prevScoreRef = useRef<number | undefined>(undefined);
  const equation = useGameStore((s) => s.equation);
  const score = useGameStore((s) => s.score);

  useEffect(() => {
    const won = checkVictory(equation);
    const prevScore = prevScoreRef.current;
    prevScoreRef.current = score;
    if (won && prevScore !== undefined && score > prevScore) {
      triggerConfetti();
    }
  }, [equation, score]);
}
