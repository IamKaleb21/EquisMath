import type { Equation } from "@/types";
import { cn } from "@/lib/utils";

type CoefKey = "a" | "b" | "c";

interface EquationDisplayProps {
  equations: Equation[];
  mode: "LINEAR_1VAR" | "LINEAR_2VAR" | "SYSTEM";
  onCoefficientChange: (id: number, coef: CoefKey, value: number) => void;
}

/** Devuelve el string de display para un coeficiente (fracción o decimal según entrada). */
function displayCoeff(value: number, display?: string): string {
  return display !== undefined && display !== "" ? display : String(value);
}

export function EquationDisplay({
  equations,
  mode,
  onCoefficientChange,
}: EquationDisplayProps) {
  if (equations.length === 0) return null;

  return (
    <div className="space-y-4">
      {equations.map((eq, idx) => {
        const d = eq.coefficientDisplays;
        const { a, b, c } = eq.coefficients;
        const aD = displayCoeff(a, d?.a);
        const bD = displayCoeff(b, d?.b);
        const cD = displayCoeff(c, d?.c);
        const equationText1Var = `${aD}x ${b >= 0 ? "+" : ""} ${bD} = 0`;
        const equationText2Var = `${aD}x ${b >= 0 ? "+" : ""} ${bD}y = ${cD}`;
        
        // Alternate chalk colors for visual interest
        const colorClass = idx === 0 ? "chalk-yellow" : "chalk-pink";
        const borderColor = idx === 0 ? "border-l-chalk-yellow" : "border-l-chalk-pink";
        
        return (
          <div
            key={eq.id}
            className={cn(
              "equation-box rounded-lg transition-all duration-300",
              borderColor
            )}
            style={{ borderLeftColor: eq.color }}
          >
            {/* Equation display */}
            <div className={cn("mb-3 text-center font-mono text-xl", colorClass)}>
              {mode === "LINEAR_1VAR" && equationText1Var}
              {(mode === "LINEAR_2VAR" || mode === "SYSTEM") && equationText2Var}
            </div>
            
            {/* Coefficient sliders */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {mode === "LINEAR_1VAR" && (
                <>
                  <CoefInput
                    value={eq.coefficients.a}
                    onChange={(v) => onCoefficientChange(eq.id, "a", v)}
                    label="x"
                  />
                  <span className="text-chalk-white/50">+</span>
                  <CoefInput
                    value={eq.coefficients.b}
                    onChange={(v) => onCoefficientChange(eq.id, "b", v)}
                    label=""
                  />
                  <span className="text-chalk-white/50">= 0</span>
                </>
              )}
              {(mode === "LINEAR_2VAR" || mode === "SYSTEM") && (
                <>
                  <CoefInput
                    value={eq.coefficients.a}
                    onChange={(v) => onCoefficientChange(eq.id, "a", v)}
                    label="x"
                  />
                  <span className="text-chalk-white/50">+</span>
                  <CoefInput
                    value={eq.coefficients.b}
                    onChange={(v) => onCoefficientChange(eq.id, "b", v)}
                    label="y"
                  />
                  <span className="text-chalk-white/50">=</span>
                  <CoefInput
                    value={eq.coefficients.c}
                    onChange={(v) => onCoefficientChange(eq.id, "c", v)}
                    label=""
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoefInput({
  value,
  onChange,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v)) onChange(v);
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 transition-all duration-200",
        "hover:bg-white/10",
        className
      )}
    >
      <input
        type="number"
        value={value}
        onChange={handleChange}
        className="h-8 w-16 rounded-md border-2 border-chalk-white/20 bg-transparent px-2 text-center font-mono text-sm text-chalk-white outline-none transition-all duration-200 hover:border-chalk-yellow/40 focus:border-chalk-yellow focus:ring-2 focus:ring-chalk-yellow/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {label && <span className="font-mono text-sm text-chalk-white/70">{label}</span>}
    </span>
  );
}
