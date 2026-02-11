import { useRef, useState, useEffect } from "react";
import { Mafs, Coordinates, Plot, Point } from "mafs";
import "mafs/core.css";
import type { EquationState } from "@/shared/types";
import { blocksToLineCoefficients } from "./blocksToLineCoefficients";
import { THEME_COLORS } from "./constants";

export interface EquationGraphProps {
  equation: EquationState;
  highlightedPoint?: { x: number } | null;
  /** Precomputed coefficients; if provided, equation is not used for the line (only for empty check when equation has no blocks). */
  coefficients?: { a: number; b: number; c: number };
}

const X_DOMAIN: [number, number] = [-10, 10];
const Y_DOMAIN: [number, number] = [-10, 10];

/** Fallback size when container not yet measured so Mafs mounts immediately (avoids rendering null). */
const FALLBACK_DIMENSIONS = { width: 300, height: 260 };

function hasBlocks(equation: EquationState): boolean {
  return equation.leftSide.length > 0 || equation.rightSide.length > 0;
}

export function EquationGraph({
  equation,
  highlightedPoint = null,
  coefficients: coefficientsProp,
}: EquationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      setDimensions((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h }
      );
    };
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    updateDimensions();
    const raf = requestAnimationFrame(() => {
      updateDimensions();
    });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const coefficients =
    coefficientsProp ?? blocksToLineCoefficients(equation);
  const { a, c } = coefficients;

  const empty = !hasBlocks(equation);
  const yAt = (x: number) => a * x + c;
  const hasMeasuredSize = dimensions.width > 0 && dimensions.height > 0;
  const effectiveDimensions = hasMeasuredSize ? dimensions : FALLBACK_DIMENSIONS;
  const canShowMafs = !empty;
  const hasDimensions = hasMeasuredSize;

  const containerStyle =
    hasDimensions
      ? { width: dimensions.width, height: dimensions.height, maxWidth: "100%", maxHeight: "100%" }
      : !empty
        ? { minWidth: 280, minHeight: 260 }
        : undefined;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      style={containerStyle}
    >
      {empty ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-border">
                <svg
                  className="size-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"
                  />
                </svg>
              </div>
            </div>
            <p className="font-display text-lg text-muted-foreground">
              Ingresa una ecuación
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground/80">
              Ej: 2x − 4 = 0
            </p>
          </div>
        </div>
      ) : canShowMafs ? (
        <Mafs
          width={effectiveDimensions.width}
          height={effectiveDimensions.height}
          viewBox={{ x: X_DOMAIN, y: Y_DOMAIN }}
          pan
          zoom={{ min: 0.25, max: 8 }}
        >
          <Coordinates.Cartesian
            xAxis={{ lines: 1 }}
            yAxis={{ lines: 1 }}
            subdivisions={4}
          />
          <Plot.OfX
            y={yAt}
            color={THEME_COLORS.accent}
            weight={2}
          />
          {highlightedPoint != null && (
            <Point
              x={highlightedPoint.x}
              y={yAt(highlightedPoint.x)}
              color={THEME_COLORS.accentLight}
            />
          )}
        </Mafs>
      ) : null}
    </div>
  );
}
