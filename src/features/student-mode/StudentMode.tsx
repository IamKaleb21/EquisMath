/**
 * Modo Estudiante — contenedor: LevelSelect, EquationBar, EquationGraph, ValueTable,
 * ProgressBar, HandHint, useHintTimer, useVictoryEffect, botón Siguiente.
 */
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/shared/store/gameStore";
import { checkVictory } from "@/features/block-system";
import { EquationBar } from "@/features/block-system";
import { EquationGraph, ValueTable } from "@/features/visualization";
import { ProgressBar, useVictoryEffect } from "@/features/feedback";
import { HandHint, useHintTimer } from "@/features/hint-system";
import { LevelSelect } from "./LevelSelect";
import { Button } from "@/components/ui/button";
import { cn, primaryButtonClass } from "@/shared/lib/utils";

const PROGRESS_MAX = 10;

const stagger = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function StudentMode() {
  const equation = useGameStore((s) => s.equation);
  const score = useGameStore((s) => s.score);
  const requestNewEquation = useGameStore((s) => s.requestNewEquation);
  const persistToLocalStorage = useGameStore((s) => s.persistToLocalStorage);

  const [highlightedX, setHighlightedX] = useState<number | null>(null);

  const won = checkVictory(equation);

  // Cargar primera ecuación al entrar si no hay bloques (para que siempre se vea hero + gráfica)
  useEffect(() => {
    const state = useGameStore.getState();
    const empty =
      state.equation.leftSide.length === 0 && state.equation.rightSide.length === 0;
    if (empty) state.requestNewEquation();
  }, []);

  useVictoryEffect();

  const onHintTrigger = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.hint.isFirstExerciseOfLevel) return;
    const blocks = state.equation.leftSide;
    const firstStandalone = blocks.find(
      (b, i) => b.type === "CONSTANT" && blocks[i + 1]?.type !== "VARIABLE"
    );
    const firstCoeff = blocks.find(
      (b, i) => b.type === "CONSTANT" && blocks[i + 1]?.type === "VARIABLE"
    );
    const target = firstStandalone ?? firstCoeff ?? null;
    if (target) state.showHintForBlock(target.id);
  }, []);

  useHintTimer(5000, { onTrigger: onHintTrigger });

  function handleNext() {
    requestNewEquation();
    persistToLocalStorage();
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Grid de 2 columnas: gráfica (izq) + sidebar (der) */}
      <motion.div
        className="grid flex-1 min-h-0 w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.35fr)]"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Columna izquierda: Gráfica + overlay de tabulación */}
        <motion.div
          variants={item}
          className="relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md"
        >
          {/* Gráfica ocupa toda la zona */}
          <div className="flex-1 w-full min-h-0">
            <EquationGraph
              equation={equation}
              highlightedPoint={
                highlightedX !== null ? { x: highlightedX } : null
              }
            />
          </div>

          {/* Overlay: Tabulación de la ecuación (abajo-izquierda) */}
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
        </motion.div>

        {/* Columna derecha: Sidebar con LevelSelect, ProgressBar y Bloques de ecuación */}
        <motion.div
          variants={item}
          className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto"
        >
          {/* LevelSelect compacto */}
          <div className="shrink-0">
            <p className="mb-2 text-xs text-muted-foreground">Elige nivel</p>
            <LevelSelect />
          </div>

          {/* ProgressBar */}
          <div className="shrink-0 rounded-2xl border border-border bg-card/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Llevas <span className="font-semibold text-foreground">{score}</span> de {PROGRESS_MAX}
              </span>
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
                Meta: {PROGRESS_MAX}
              </span>
            </div>
            <ProgressBar score={score} max={PROGRESS_MAX} showLabel={false} />
          </div>

          {/* Bloques de ecuación */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-md">
            <div className="shrink-0 border-b border-border/80 px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Bloques de ecuación
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <EquationBar equation={equation} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Victoria: overlay centrado */}
      {won && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-5 rounded-2xl border border-primary/30 bg-zinc-950/95 px-12 py-10 shadow-2xl"
          >
            <p className="font-display text-2xl font-semibold text-primary">¡Muy bien!</p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={handleNext}
                className={cn(primaryButtonClass, "min-w-[180px] rounded-xl px-8 py-3")}
              >
                Siguiente
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      <HandHint />
    </div>
  );
}
