import type { Equation, ParserOutput } from "@/types";

const EQUATION_COLORS = ["#3b82f6", "#ef4444", "#22c55e"];

/** Patrón para un coeficiente: decimal opcional o fracción num/den. */
const COEFF_PATTERN = "-?(?:\\d+\\.?\\d*|\\d*\\.\\d+)(?:\\/(?:\\d+\\.?\\d*|\\d*\\.\\d+))?";

/** Mapa de caracteres Unicode de fracción a "num/den" ASCII. */
const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "¼": "1/4",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

/**
 * Normaliza la entrada para que el parser la entienda: reemplaza fracciones
 * Unicode (½, ¼, etc.) y slashes de división no ASCII por "num/den" y "/".
 */
function normalizeFractionInput(s: string): string {
  let out = s;
  for (const [unicode, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    out = out.split(unicode).join(ascii);
  }
  out = out.replace(/\u2215/g, "/"); // DIVISION SLASH
  out = out.replace(/\u2044/g, "/"); // FRACTION SLASH
  out = out.replace(/\u2212/g, "-"); // MINUS SIGN (U+2212) -> HYPHEN-MINUS (MathLive/Unicode)
  out = out.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, "$1/$2"); // (1)/(2) -> 1/2
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2"); // \frac{1}{2} -> 1/2
  return out;
}

/**
 * Parsea un coeficiente que puede ser entero, decimal o fracción (num/den).
 * Acepta "", "+" -> 1; "-" -> -1; "1/2" -> 0.5; "-3/4" -> -0.75.
 */
function parseNumberOrFraction(s: string): number {
  const t = s.replace(/\s/g, "").replace(/\+\s*$/, "");
  if (!t || t === "+") return 1;
  if (t === "-") return -1;
  const slash = t.indexOf("/");
  if (slash === -1) {
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  }
  const num = Number(t.slice(0, slash).trim());
  const den = Number(t.slice(slash + 1).trim());
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return NaN;
  return num / den;
}

/** Resultado de parse1Var con valores numéricos y strings para mostrar. */
interface Parse1VarResult {
  a: number;
  b: number;
  c: number;
  aDisplay: string;
  bDisplay: string;
}

/**
 * Parsea una ecuación lineal en una variable: Ax + B = 0
 * A y B pueden ser enteros, decimales o fracciones (ej: 1/2 x + 3/4 = 0).
 */
function parse1Var(expr: string): Parse1VarResult | null {
  const trimmed = expr.trim();
  const re = new RegExp(`^\\s*(${COEFF_PATTERN})x\\s*([+-]\\s*(${COEFF_PATTERN}))?\\s*=\\s*0\\s*$`);
  const match = trimmed.match(re);
  if (!match) return null;
  const a = parseNumberOrFraction(match[1] || "1");
  // match[2] incluye el signo (ej: "- 4" o "+ 4"); match[3] solo el número. Usar match[2] para conservar el signo.
  const b = match[2] ? parseNumberOrFraction(match[2].trim().replace(/\s/g, "")) : 0;
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const aDisplay = match[1]?.trim() || "1";
  const bDisplay = match[2]
    ? (match[2].trim().replace(/\s/g, "").replace(/^\+/, "") || (match[2].trim().startsWith("-") ? "-1" : "1"))
    : "0";
  return { a, b, c: 0, aDisplay, bDisplay };
}

/** Resultado de parse2Var con valores numéricos y strings para mostrar. */
interface Parse2VarResult {
  a: number;
  b: number;
  c: number;
  aDisplay: string;
  bDisplay: string;
  cDisplay: string;
}

/**
 * Parsea una ecuación lineal en dos variables: Ax + By = C
 * A, B y C pueden ser enteros, decimales o fracciones (ej: 1/2 x + 2/3 y = 5/6).
 */
function parse2Var(expr: string): Parse2VarResult | null {
  const trimmed = expr.trim();
  const re = new RegExp(
    `^\\s*(${COEFF_PATTERN})x\\s*([+-]\\s*(${COEFF_PATTERN}))?y\\s*=\\s*(${COEFF_PATTERN})\\s*$`
  );
  const match = trimmed.match(re);
  if (!match) return null;
  const a = parseNumberOrFraction(match[1] || "1");
  // match[2] incluye el signo (ej: "- 2" o "+ 3"); usarlo para conservar el signo del coeficiente de y
  const bRaw = match[2] ? match[2].trim().replace(/\s/g, "") : "";
  const b = match[2]
    ? parseNumberOrFraction(bRaw || (match[2].trim().startsWith("-") ? "-1" : "1"))
    : 1;
  const c = parseNumberOrFraction(match[4] ?? "0");
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) return null;
  const aDisplay = match[1]?.trim() || "1";
  const bDisplay = match[2]
    ? (bRaw.replace(/^\+/, "") || (match[2].trim().startsWith("-") ? "-1" : "1"))
    : "1";
  const cDisplay = match[4]?.trim() ?? "0";
  return { a, b, c, aDisplay, bDisplay, cDisplay };
}

/**
 * Detecta si la expresión tiene solo x (1 var) o x e y (2 var)
 */
function detectVarCount(expr: string): "1var" | "2var" | "none" {
  const lower = expr.toLowerCase().replace(/\s/g, "");
  const hasX = /\bx\b/.test(expr) || /x/.test(lower);
  const hasY = /\by\b/.test(expr) || /y/.test(lower);
  if (hasX && hasY) return "2var";
  if (hasX && !hasY) return "1var";
  return "none";
}

function coeffsToLatex1Var(a: number, b: number): string {
  const ax = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  if (b === 0) return `${ax} = 0`;
  const op = b > 0 ? "+" : "";
  return `${ax} ${op} ${b} = 0`;
}

function coeffsToLatex2Var(a: number, b: number, c: number): string {
  const ax = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  const by = b === 1 ? "y" : b === -1 ? "-y" : `${b}y`;
  const bSign = b >= 0 ? "+" : "";
  return `${ax} ${bSign} ${by} = ${c}`;
}

/**
 * Parsea la entrada del usuario y devuelve ecuaciones normalizadas o error.
 * Formato: 1 var "Ax+B=0", 2 var/sistema "Ax+By=C". Sistema: dos ecuaciones separadas por coma o Enter.
 */
export function parseInput(rawInput: string): ParserOutput {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, message: "Escribe una ecuación." };
  }
  const normalized = normalizeFractionInput(trimmed);
  const parts = normalized.split(/[,\n]+/).map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    return { valid: false, message: "Escribe una ecuación." };
  }

  if (parts.length === 1) {
    const expr = parts[0];
    const kind = detectVarCount(expr);
    if (kind === "1var") {
      const coeffs = parse1Var(expr);
      if (!coeffs) {
        return { valid: false, message: "No se pudo interpretar la ecuación. Usa la forma: Ax + B = 0" };
      }
      if (coeffs.a === 0) {
        return { valid: false, message: "El coeficiente de x no puede ser 0." };
      }
      const equation: Equation = {
        id: 0,
        latex: coeffsToLatex1Var(coeffs.a, coeffs.b),
        coefficients: { a: coeffs.a, b: coeffs.b, c: 0 },
        coefficientDisplays: { a: coeffs.aDisplay, b: coeffs.bDisplay },
        color: EQUATION_COLORS[0],
      };
      return {
        valid: true,
        mode: "LINEAR_1VAR",
        equations: [equation],
      };
    }
    if (kind === "2var") {
      const coeffs = parse2Var(expr);
      if (!coeffs) {
        return { valid: false, message: "No se pudo interpretar la ecuación. Usa la forma: Ax + By = C" };
      }
      if (coeffs.a === 0 && coeffs.b === 0) {
        return { valid: false, message: "Al menos uno de los coeficientes de x o y debe ser distinto de 0." };
      }
      const equation: Equation = {
        id: 0,
        latex: coeffsToLatex2Var(coeffs.a, coeffs.b, coeffs.c),
        coefficients: { a: coeffs.a, b: coeffs.b, c: coeffs.c },
        coefficientDisplays: { a: coeffs.aDisplay, b: coeffs.bDisplay, c: coeffs.cDisplay },
        color: EQUATION_COLORS[0],
      };
      return {
        valid: true,
        mode: "LINEAR_2VAR",
        equations: [equation],
      };
    }
    return { valid: false, message: "Formato no reconocido. Usa Ax + B = 0 (1 variable) o Ax + By = C (2 variables)." };
  }

  if (parts.length === 2) {
    const equations: Equation[] = [];
    for (let i = 0; i < parts.length; i++) {
      const coeffs = parse2Var(parts[i]);
      if (!coeffs) {
        return {
          valid: false,
          message: `Ecuación ${i + 1} no válida. Usa la forma: Ax + By = C`,
        };
      }
      if (coeffs.a === 0 && coeffs.b === 0) {
        return { valid: false, message: `Ecuación ${i + 1}: al menos uno de los coeficientes de x o y debe ser distinto de 0.` };
      }
      equations.push({
        id: i,
        latex: coeffsToLatex2Var(coeffs.a, coeffs.b, coeffs.c),
        coefficients: { a: coeffs.a, b: coeffs.b, c: coeffs.c },
        coefficientDisplays: { a: coeffs.aDisplay, b: coeffs.bDisplay, c: coeffs.cDisplay },
        color: EQUATION_COLORS[i % EQUATION_COLORS.length],
      });
    }
    return {
      valid: true,
      mode: "SYSTEM",
      equations,
    };
  }

  return {
    valid: false,
    message: "Solo se permite una ecuación o un sistema de dos ecuaciones (separadas por coma o Enter).",
  };
}
