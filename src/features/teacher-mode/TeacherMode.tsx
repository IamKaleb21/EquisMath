/**
 * Modo Docente — Layout como estudiante: gráfica a la izquierda (siempre visible),
 * entrada de ecuación y bloques a la derecha. Sin animación de entrada.
 */
import { useState, useCallback } from "react";
import { useGameStore } from "@/shared/store/gameStore";
import { EquationBar } from "@/features/block-system";
import { EquationGraph, ValueTable } from "@/features/visualization";
import { MathLiveInput } from "./MathLiveInput";

export function TeacherMode() {
  const equation = useGameStore((s) => s.equation);
  const [parseError, setParseError] = useState("");
  const [highlightedX, setHighlightedX] = useState<number | null>(null);

  const handleParseError = useCallback((message: string) => {
    setParseError(message);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="grid flex-1 min-h-0 w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.35fr)]">
        {/* Columna izquierda: Gráfica + overlay de tabulación (siempre visible) */}
        <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md">
          <div className="flex-1 w-full min-h-0">
            <EquationGraph
              equation={equation}
              highlightedPoint={
                highlightedX !== null ? { x: highlightedX } : null
              }
            />
          </div>
          <div className="absolute bottom-4 left-4 w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-sm">
            <div className="border-b border-border/80 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Tabulación de la ecuación
              </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              <ValueTable
                equation={equation}
                highlightedX={highlightedX}
                onHighlight={setHighlightedX}
              />
            </div>
          </div>
        </div>

        {/* Columna derecha: Entrada de ecuación + bloques */}
        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto">
          <div className="shrink-0 rounded-2xl border border-border/80 bg-card/40 p-4 shadow-md">
            <h2 className="mb-1 font-display text-lg font-semibold text-foreground">
              Escribe tu ecuación
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Ej: 2x + 3 = 7. Aplica para ver la gráfica.
            </p>
            <MathLiveInput onError={handleParseError} />
            {parseError && (
              <p
                className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {parseError}
              </p>
            )}
          </div>

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md">
            <div className="shrink-0 border-b border-border/80 px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Bloques de ecuación
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <EquationBar equation={equation} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
