/**
 * Wrapper around MathLive math-field. On submit: parseEquation(latex) and setEquation or show error.
 */
import "mathlive/static.css";
import { useRef, useEffect, useCallback } from "react";
import { useGameStore } from "@/shared/store/gameStore";
import { parseEquation } from "@/features/equation-engine";
import { Button } from "@/components/ui/button";
import { cn, primaryButtonClass } from "@/shared/lib/utils";

export interface MathLiveInputProps {
  onError?: (message: string) => void;
}

type MathFieldElement = HTMLElement & {
  getValue: (format?: "latex" | "plain-text") => string;
  value: string;
};

export function MathLiveInput({ onError }: MathLiveInputProps) {
  const mfRef = useRef<MathFieldElement | null>(null);
  const setEquation = useGameStore((s) => s.setEquation);

  const handleSubmit = useCallback(() => {
    const el = mfRef.current;
    if (!el) return;
    const latex = (el.getValue?.("latex") ?? el.getValue?.("plain-text") ?? el.value ?? "").trim();
    if (!latex) {
      onError?.("Escribe una ecuación.");
      return;
    }
    const result = parseEquation(latex);
    if ("message" in result) {
      onError?.(result.message);
      return;
    }
    onError?.("");
    setEquation(result);
  }, [setEquation, onError]);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    mf.addEventListener("keydown", onKeyDown, { capture: true });
    return () => mf.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [handleSubmit]);

  return (
    <div className="flex w-full flex-col gap-3">
      <math-field
        ref={mfRef as React.RefObject<MathFieldElement>}
        math-virtual-keyboard-policy="manual"
        className="min-h-[56px] w-full rounded-lg border border-border bg-input px-4 py-3 font-mono text-lg text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ display: "block" }}
        aria-label="Ecuación en LaTeX"
      />
      <Button
        type="button"
        onClick={handleSubmit}
        className={cn(primaryButtonClass, "w-full rounded-lg px-8 py-3")}
      >
        Aplicar
      </Button>
    </div>
  );
}
