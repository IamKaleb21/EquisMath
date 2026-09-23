/**
 * FR4: Trigger confetti on victory. Uses canvas-confetti.
 */
import confetti from "canvas-confetti";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}

const DEFAULT_OPTIONS: ConfettiOptions = {
  particleCount: 80,
  spread: 70,
  origin: { y: 0.6 },
  colors: ["#FFD700", "#00FFFF", "#ffffff"],
};

export function triggerConfetti(options?: ConfettiOptions): void {
  try {
    (confetti as (opts?: ConfettiOptions) => void)({
      ...DEFAULT_OPTIONS,
      ...options,
    });
  } catch {
    // no-op if not in browser or confetti fails
  }
}
