import type { Equation, EquationType, Solution, StepItem } from "@/types";

type Nerdamer = { solveEquations: (eqs: string[]) => { toString: () => string } };
const nerdamer: Nerdamer = (await import("nerdamer/all.min.js").then(
  (m: { default?: Nerdamer }) => (m.default ?? m) as Nerdamer
)) as Nerdamer;

/**
 * Resuelve el sistema o ecuación y devuelve la solución numérica usando Nerdamer.
 */
export function solve(
  equations: Equation[],
  mode: EquationType
): Solution {
  const steps = generateSteps(equations, mode);

  if (equations.length === 0) {
    return { hasSolution: false, steps };
  }

  try {
    if (mode === "LINEAR_1VAR") {
      const { a, b } = equations[0].coefficients;
      if (a === 0) {
        return {
          hasSolution: false,
          steps: [...steps, { label: "El coeficiente de x es 0; la ecuación no tiene solución única." }],
        };
      }
      const x = -b / a;
      return { hasSolution: true, x, steps };
    }

    if (mode === "LINEAR_2VAR") {
      const { a, b } = equations[0].coefficients;
      if (a === 0 && b === 0) {
        return { hasSolution: false, steps: [...steps, { label: "Ecuación inválida." }] };
      }
      return { hasSolution: true, steps };
    }

    if (mode === "SYSTEM" && equations.length === 2) {
      const eq1 = `${equations[0].coefficients.a}*x+${equations[0].coefficients.b}*y=${equations[0].coefficients.c}`;
      const eq2 = `${equations[1].coefficients.a}*x+${equations[1].coefficients.b}*y=${equations[1].coefficients.c}`;
      const det =
        equations[0].coefficients.a * equations[1].coefficients.b -
        equations[1].coefficients.a * equations[0].coefficients.b;
      if (Math.abs(det) < 1e-10) {
        return {
          hasSolution: false,
          steps: [...steps, { label: "Las rectas son paralelas o coincidentes; no hay solución única." }],
        };
      }
      const sol = nerdamer.solveEquations([eq1, eq2]);
      const solStr = sol.toString();
      const parts = solStr.split(",").map((s: string) => s.trim());
      let x: number | undefined;
      let y: number | undefined;
      for (let i = 0; i < parts.length - 1; i += 2) {
        const val = Number(parts[i + 1]);
        if (parts[i] === "x") x = val;
        if (parts[i] === "y") y = val;
      }
      if (x !== undefined && y !== undefined && Number.isFinite(x) && Number.isFinite(y)) {
        return { hasSolution: true, x, y, steps };
      }
      return { hasSolution: false, steps };
    }
  } catch {
    return { hasSolution: false, steps };
  }

  return { hasSolution: false, steps };
}

/** Convierte un coeficiente en forma display (fracción o decimal) a LaTeX. */
function displayToLatex(display: string): string {
  const i = display.indexOf("/");
  if (i === -1) return display;
  const num = display.slice(0, i).trim();
  const den = display.slice(i + 1).trim();
  return `\\frac{${num}}{${den}}`;
}

/** Construye LaTeX para ecuación lineal en x: ax + b = 0 (usa displays si existen). */
function latex1Var(
  a: number,
  b: number,
  aDisplay?: string,
  bDisplay?: string
): string {
  const aStr = aDisplay != null ? displayToLatex(aDisplay) : String(a);
  const bStr = bDisplay != null ? displayToLatex(bDisplay) : String(b);
  const sign = b >= 0 ? "+" : "";
  return `${aStr}x${sign}${bStr}=0`;
}

/** Construye LaTeX para ecuación en x,y: ax + by = c (usa displays si existen). */
function latex2Var(
  a: number,
  b: number,
  c: number,
  aDisplay?: string,
  bDisplay?: string,
  cDisplay?: string
): string {
  const aStr = aDisplay != null ? displayToLatex(aDisplay) : String(a);
  const bStr = bDisplay != null ? displayToLatex(bDisplay) : String(b);
  const cStr = cDisplay != null ? displayToLatex(cDisplay) : String(c);
  const sb = b >= 0 ? "+" : "";
  return `${aStr}x${sb}${bStr}y=${cStr}`;
}

/**
 * Genera los pasos explicativos (pedagogía) para 1 var o sistema 2x2.
 * Cada paso tiene texto (label) y opcionalmente LaTeX (latex) para mostrar centrado.
 */
export function generateSteps(
  equations: Equation[],
  mode: EquationType
): StepItem[] {
  if (mode === "LINEAR_1VAR" && equations.length >= 1) {
    const eq = equations[0];
    const { a, b } = eq.coefficients;
    const d = eq.coefficientDisplays;
    const aD = d?.a ?? String(a);
    const bD = d?.b ?? String(b);
    const minusBD = b >= 0 ? `-${bD}` : bD;
    const steps: StepItem[] = [];
    steps.push({ label: "Ecuación:", latex: latex1Var(a, b, d?.a, d?.b) });
    if (b !== 0) {
      steps.push({
        label: "Paso 1: Mover el término independiente al otro lado:",
        latex: `${displayToLatex(aD)}x=${displayToLatex(minusBD)}`,
      });
    }
    const xVal = -b / a;
    steps.push({
      label: "Paso 2: Dividir por el coeficiente de x:",
      latex: `x=\\frac{${displayToLatex(minusBD)}}{${displayToLatex(aD)}}=${xVal}`,
    });
    return steps;
  }

  if (mode === "LINEAR_2VAR" && equations.length >= 1) {
    const eq = equations[0];
    const { a, b, c } = eq.coefficients;
    const d = eq.coefficientDisplays;
    const steps: StepItem[] = [];
    steps.push({
      label: "Ecuación de la recta:",
      latex: latex2Var(a, b, c, d?.a, d?.b, d?.c),
    });
    if (b !== 0) {
      const aStr = d?.a != null ? displayToLatex(d.a) : String(a);
      const bStr = d?.b != null ? displayToLatex(d.b) : String(b);
      const cStr = d?.c != null ? displayToLatex(d.c) : String(c);
      steps.push({
        label: "Despejando y:",
        latex: `y=\\frac{${cStr}-${aStr}x}{${bStr}}`,
      });
    }
    return steps;
  }

  if (mode === "SYSTEM" && equations.length === 2) {
    const [e1, e2] = equations;
    const { a: a1, b: b1, c: c1 } = e1.coefficients;
    const { a: a2, b: b2, c: c2 } = e2.coefficients;
    const d1 = e1.coefficientDisplays;
    const d2 = e2.coefficientDisplays;
    const steps: StepItem[] = [];
    steps.push({
      label: "Sistema:",
      latex: `\\begin{cases} ${latex2Var(a1, b1, c1, d1?.a, d1?.b, d1?.c)} \\\\ ${latex2Var(a2, b2, c2, d2?.a, d2?.b, d2?.c)} \\end{cases}`,
    });
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-10) {
      steps.push({
        label: "Las rectas son paralelas o coincidentes; no hay un único punto de intersección.",
      });
      return steps;
    }
    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;
    steps.push({
      label: "Método de reducción: multiplicar y restar para despejar x e y.",
    });
    steps.push({
      label: "Solución:",
      latex: `x=${round(x)},\\quad y=${round(y)}`,
    });
    return steps;
  }

  return [];
}

function round(n: number, decimals = 4): number {
  const d = 10 ** decimals;
  return Math.round(n * d) / d;
}
