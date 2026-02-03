import { useRef, useState, useEffect } from "react";
import { Mafs, Coordinates, Line, Point, Text } from "mafs";
import "mafs/core.css";
import type { Equation } from "@/types";
import { findIntersection } from "@/utils/graphHelpers";

/** Formatea un número para mostrar en tooltip (máx 4 decimales, evita .0 innecesarios) */
function formatCoord(n: number): string {
  const rounded = Math.round(n * 1e4) / 1e4;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/** Punto con tooltip de coordenadas al hacer hover (estilo GeoGebra) */
function PointWithTooltip({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <Point x={x} y={y} color={color} />
      {/* Círculo invisible más grande encima para facilitar el hover */}
      <Point
        x={x}
        y={y}
        color="transparent"
        svgCircleProps={{
          r: 24,
          style: { pointerEvents: "all", cursor: "pointer" },
        }}
      />
      {hovered && (
        <Text
          x={x}
          y={y}
          attach="n"
          attachDistance={24}
          size={14}
          color="var(--chalk-white)"
          svgTextProps={{
            style: {
              fill: "var(--chalk-white)",
              paintOrder: "stroke",
              stroke: "oklch(0.2 0.04 145)",
              strokeWidth: 3,
            },
          }}
        >
          ({formatCoord(x)}, {formatCoord(y)})
        </Text>
      )}
    </g>
  );
}

interface GraphProps {
  equations: Equation[];
  mode: "LINEAR_1VAR" | "LINEAR_2VAR" | "SYSTEM";
  solution?: { x?: number; y?: number; hasSolution: boolean };
}

export function Graph({ equations, mode, solution }: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    updateDimensions();

    return () => ro.disconnect();
  }, [equations.length]);

  if (equations.length === 0) {
    return (
      <div className="graph-container flex flex-col items-center justify-center gap-4 rounded-xl">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-chalk-white/20">
              <svg className="size-8 text-chalk-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
              </svg>
            </div>
          </div>
          <p className="font-display text-lg text-chalk-white/60">
            Ingresa una ecuación
          </p>
          <p className="mt-1 font-mono text-sm text-chalk-white/40">
            Ej: 2x − 4 = 0
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-chalk-white/20">
            <div className="h-px w-8 bg-current" />
            <span className="font-mono text-xs">f(x)</span>
            <div className="h-px w-8 bg-current" />
          </div>
        </div>
      </div>
    );
  }

  const xDomain: [number, number] = [-10, 10];
  const yDomain: [number, number] = [-10, 10];

  const simulateZoom = (direction: 1 | -1) => {
    const el = containerRef.current?.querySelector(".MafsView") as HTMLElement | null;
    if (el) {
      el.dispatchEvent(new WheelEvent("wheel", { deltaY: direction * 120, bubbles: true }));
    }
  };

  return (
    <div
      ref={containerRef}
      className="graph-container rounded-xl"
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Mafs
          width={dimensions.width}
          height={dimensions.height}
          viewBox={{ x: xDomain, y: yDomain }}
          pan
          zoom={{ min: 0.25, max: 8 }}
        >
          <Coordinates.Cartesian
            xAxis={{ lines: 1}}
            yAxis={{ lines: 1}}
          />
          {mode === "LINEAR_1VAR" && equations.length >= 1 && (() => {
            const { a, b } = equations[0].coefficients;
            if (a === 0) return null;
            const rootX = -b / a;
            return (
              <PointWithTooltip key="root-1var" x={rootX} y={0} color="var(--chalk-pink)" />
            );
          })()}
          {equations.map((eq) => {
            const { a, b, c } = eq.coefficients;
            if (mode === "LINEAR_1VAR") {
              const rootX = -b / a;
              return (
                <Line.PointAngle
                  key={eq.id}
                  point={[rootX, 0]}
                  angle={Math.PI / 2}
                  color={eq.color}
                />
              );
            }
            if (b === 0) {
              const x0 = a === 0 ? 0 : c / a;
              return (
                <Line.PointAngle
                  key={eq.id}
                  point={[x0, 0]}
                  angle={Math.PI / 2}
                  color={eq.color}
                />
              );
            }
            return (
              <Line.PointSlope
                key={eq.id}
                point={[0, c / b]}
                slope={-a / b}
                color={eq.color}
              />
            );
          })}
          {mode === "LINEAR_2VAR" && equations.length === 1 && (
            <InterceptPoints equations={equations} />
          )}
          {mode === "SYSTEM" && equations.length === 2 && (
            <>
              <InterceptPoints equations={equations} skipIntersection />
              {solution?.hasSolution &&
                solution.x != null &&
                solution.y != null && (
                  <PointWithTooltip
                    x={solution.x}
                    y={solution.y}
                    color="var(--chalk-yellow)"
                  />
                )}
            </>
          )}
        </Mafs>
      )}
      <div className="absolute bottom-3 right-3 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => simulateZoom(-1)}
          className="zoom-btn flex size-9 items-center justify-center rounded-lg bg-chalk-white/10 text-chalk-white transition-colors hover:bg-chalk-white/20"
          aria-label="Zoom in"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => simulateZoom(1)}
          className="zoom-btn flex size-9 items-center justify-center rounded-lg bg-chalk-white/10 text-chalk-white transition-colors hover:bg-chalk-white/20"
          aria-label="Zoom out"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function InterceptPoints({
  equations,
  skipIntersection,
}: {
  equations: Equation[];
  skipIntersection?: boolean;
}) {
  const points: { x: number; y: number }[] = [];
  for (const eq of equations) {
    const { a, b, c } = eq.coefficients;
    if (b !== 0) {
      if (a !== 0) points.push({ x: c / a, y: 0 });
      points.push({ x: 0, y: c / b });
    } else if (a !== 0) {
      points.push({ x: c / a, y: 0 });
    }
  }
  if (
    !skipIntersection &&
    equations.length === 2 &&
    findIntersection(equations[0], equations[1])
  ) {
    const pt = findIntersection(equations[0], equations[1])!;
    points.push(pt);
  }

  return (
    <>
      {points.map((p, i) => (
        <PointWithTooltip key={i} x={p.x} y={p.y} color="var(--chalk-blue)" />
      ))}
    </>
  );
}
