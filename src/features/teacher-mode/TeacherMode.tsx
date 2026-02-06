/**
 * Modo Docente — MathLiveInput, EquationBar (readOnly), EquationGraph, ValueTable.
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/shared/store/gameStore";
import { EquationBar } from "@/features/block-system";
import { EquationGraph, ValueTable } from "@/features/visualization";
import { MathLiveInput } from "./MathLiveInput";

const stagger = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function TeacherMode() {
  const equation = useGameStore((s) => s.equation);
  const [parseError, setParseError] = useState("");
  const [highlightedX, setHighlightedX] = useState<number | null>(null);

  const hasBlocks =
    equation.leftSide.length > 0 || equation.rightSide.length > 0;

  const handleParseError = useCallback((message: string) => {
    setParseError(message);
  }, []);

  return (
    <motion.div
      className="flex flex-col gap-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.section
        variants={item}
        className="rounded-3xl border border-border border-l-4 border-l-primary bg-card/60 p-6 shadow-xl shadow-primary/5 md:p-8"
      >
        <h2 className="mb-1 font-display text-xl font-semibold text-foreground">
          Escribe tu ecuación
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ej: 2x + 3 = 7. Aplica para ver bloques y gráfica.
        </p>
        <MathLiveInput onError={handleParseError} />
        {parseError && (
          <p
            className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive"
            role="alert"
          >
            {parseError}
          </p>
        )}
      </motion.section>

      {hasBlocks && (
        <>
          <motion.section variants={item}>
            <p className="mb-3 text-sm text-muted-foreground">Tu ecuación en acción</p>
            <div className="mb-6 rounded-2xl border border-border/80 bg-card/40 p-4 shadow-md md:p-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Ecuación</p>
              <EquationBar equation={equation} readOnly />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md">
                <div className="border-b border-border/80 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Gráfica</p>
                </div>
                <div className="h-[260px] w-full md:h-[300px]">
                  <EquationGraph
                    equation={equation}
                    highlightedPoint={
                      highlightedX !== null ? { x: highlightedX } : null
                    }
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md">
                <div className="border-b border-border/80 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Valores</p>
                </div>
                <ValueTable
                  equation={equation}
                  highlightedX={highlightedX}
                  onHighlight={setHighlightedX}
                />
              </div>
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
