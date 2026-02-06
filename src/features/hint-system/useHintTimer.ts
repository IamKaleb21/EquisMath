/**
 * FR5: Inactivity timer. Calls onTrigger after inactivityMs (default 5000). Resets on user interaction.
 */
import { useEffect, useRef, useCallback } from "react";

const DEFAULT_INACTIVITY_MS = 5000;

const INTERACTION_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export interface UseHintTimerOptions {
  onTrigger: () => void;
}

export function useHintTimer(
  inactivityMs: number = DEFAULT_INACTIVITY_MS,
  options?: UseHintTimerOptions
): void {
  const onTriggerRef = useRef(options?.onTrigger);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onTriggerRef.current?.();
    }, inactivityMs);
  }, [inactivityMs]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    schedule();
  }, [schedule]);

  useEffect(() => {
    onTriggerRef.current = options?.onTrigger;
  }, [options?.onTrigger]);

  useEffect(() => {
    schedule();
    const handle = () => reset();
    const target = document;
    for (const ev of INTERACTION_EVENTS) {
      target.addEventListener(ev, handle);
    }
    return () => {
      for (const ev of INTERACTION_EVENTS) {
        target.removeEventListener(ev, handle);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [schedule, reset]);
}
