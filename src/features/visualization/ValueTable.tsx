import type { EquationState } from "@/shared/types";
import { blocksToLineCoefficients } from "./blocksToLineCoefficients";

const DEFAULT_X_RANGE: [number, number] = [-5, 5];

export interface ValueTableProps {
  equation: EquationState;
  /** Precomputed coefficients; if provided, equation is only used when coefficients are not passed. */
  coefficients?: { a: number; b: number; c: number };
  xRange?: [number, number];
  highlightedX?: number | null;
  onHighlight?: (x: number | null) => void;
}

function getCoefficients(
  equation: EquationState,
  coefficientsProp?: { a: number; b: number; c: number }
): { a: number; b: number; c: number } {
  return coefficientsProp ?? blocksToLineCoefficients(equation);
}

export function ValueTable({
  equation,
  coefficients: coefficientsProp,
  xRange = DEFAULT_X_RANGE,
  highlightedX = null,
  onHighlight,
}: ValueTableProps) {
  const { a, c } = getCoefficients(equation, coefficientsProp);
  const [xMin, xMax] = xRange;
  const rows: { x: number; y: number }[] = [];
  for (let x = xMin; x <= xMax; x++) {
    rows.push({ x, y: a * x + c });
  }

  const hasBlocks = equation.leftSide.length > 0 || equation.rightSide.length > 0;
  if (!hasBlocks) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-muted-foreground">
        <p className="text-sm">Sin ecuación</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th
              className="px-3 py-2 text-left font-medium text-foreground"
              scope="col"
            >
              x
            </th>
            <th
              className="px-3 py-2 text-left font-medium text-foreground"
              scope="col"
            >
              y
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ x, y }) => {
            const isHighlighted = highlightedX !== null && highlightedX === x;
            return (
              <tr
                key={x}
                className={`border-b border-border/50 transition-colors ${
                  isHighlighted ? "bg-primary/20" : "hover:bg-muted/50"
                }`}
                onMouseEnter={() => onHighlight?.(x)}
                onMouseLeave={() => onHighlight?.(null)}
              >
                <td className="px-3 py-1.5 font-mono text-foreground">{x}</td>
                <td className="px-3 py-1.5 font-mono text-foreground">
                  {Number.isInteger(y) ? y : y.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
