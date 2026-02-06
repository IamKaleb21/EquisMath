import type { Block } from "@/shared/types";
import type { EquationResult, ParseError } from "./types";
import nerdamer from "nerdamer/all.min.js";

type NerdamerAPI = {
  solve?: (equation: string, variable: string) => unknown;
  solveEquations?: (eqs: string[]) => { toString: () => string };
};

const nerdamerApi = nerdamer as NerdamerAPI;

/** Normalize LaTeX to a string nerdamer can parse: \frac{a}{b} -> a/b, \cdot -> *, etc. */
function normalizeLatex(latex: string): string {
  let s = latex.trim();
  s = s.replace(/\\cdot/g, "*");
  s = s.replace(/\\times/g, "*");
  s = s.replace(/\\left\s*\(/g, "(");
  s = s.replace(/\\right\s*\)/g, ")");
  s = s.replace(/\\frac\s*\{\s*([^{}]*)\s*\}\s*\{\s*([^{}]*)\s*\}/g, "($1)/($2)");
  s = s.replace(/\s+/g, "");
  s = s.replace(/(\d)x/g, "$1*x");
  s = s.replace(/^x\b/, "1*x");
  s = s.replace(/([=+\-])x\b/g, "$1*1*x");
  return s;
}

/** Parse one side (e.g. "2*x+5" or "-3*x-4") into coefficient of x and constant. */
function parseSide(side: string): { xCoef: number; constant: number } {
  let xCoef = 0;
  let constant = 0;
  const tokens = side.split(/([+-])/);
  let sign = 1;
  for (const t of tokens) {
    const tok = t.trim();
    if (tok === "") continue;
    if (tok === "+") {
      sign = 1;
      continue;
    }
    if (tok === "-") {
      sign = -1;
      continue;
    }
    const mult = sign;
    sign = 1;
    if (tok.includes("x")) {
      const coefPart = tok.replace(/\*?\s*x\s*$/, "").trim() || "1";
      const coef = Number(coefPart);
      xCoef += mult * (Number.isFinite(coef) ? coef : 1);
    } else {
      const n = Number(tok);
      constant += mult * (Number.isFinite(n) ? n : 0);
    }
  }
  return { xCoef, constant };
}

/** Build blocks from left/right coefficients. Always emit coefficient as separate block: k*x → [CONST(k), VAR]. */
function sidesToBlocks(
  leftX: number,
  leftC: number,
  rightX: number,
  rightC: number,
  idPrefix: string
): { leftSide: Block[]; rightSide: Block[] } {
  const leftSide: Block[] = [];
  const rightSide: Block[] = [];
  let idx = 0;
  if (leftX !== 0) {
    const absLeftX = Math.abs(leftX);
    const signLeftX = leftX >= 0 ? 1 : -1;
    leftSide.push({
      id: `${idPrefix}-left-${idx++}`,
      type: "CONSTANT",
      value: absLeftX,
      sign: signLeftX as 1 | -1,
    });
    leftSide.push({
      id: `${idPrefix}-left-${idx++}`,
      type: "VARIABLE",
      value: 1,
      sign: 1,
      coefficient: 1,
    });
  }
  if (leftC !== 0) {
    leftSide.push({
      id: `${idPrefix}-left-${idx++}`,
      type: "CONSTANT",
      value: Math.abs(leftC),
      sign: (leftC >= 0 ? 1 : -1) as 1 | -1,
    });
  }
  idx = 0;
  if (rightX !== 0) {
    const absRightX = Math.abs(rightX);
    const signRightX = rightX >= 0 ? 1 : -1;
    rightSide.push({
      id: `${idPrefix}-right-${idx++}`,
      type: "CONSTANT",
      value: absRightX,
      sign: signRightX as 1 | -1,
    });
    rightSide.push({
      id: `${idPrefix}-right-${idx++}`,
      type: "VARIABLE",
      value: 1,
      sign: 1,
      coefficient: 1,
    });
  }
  if (rightC !== 0) {
    rightSide.push({
      id: `${idPrefix}-right-${idx++}`,
      type: "CONSTANT",
      value: Math.abs(rightC),
      sign: (rightC >= 0 ? 1 : -1) as 1 | -1,
    });
  }
  if (leftSide.length === 0) leftSide.push({ id: `${idPrefix}-left-0`, type: "CONSTANT", value: 0, sign: 1 });
  if (rightSide.length === 0) rightSide.push({ id: `${idPrefix}-right-0`, type: "CONSTANT", value: 0, sign: 1 });
  return { leftSide, rightSide };
}

/** Evaluate blocks at x: sum of (coef * x for var terms) + (value * sign for const terms). */
export function evaluateBlocksAt(blocks: Block[], x: number): number {
  let sum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT") {
      const next = blocks[i + 1];
      if (next?.type === "VARIABLE") sum += curr.sign * curr.value * x;
      else sum += curr.sign * curr.value;
    } else if (curr.type === "VARIABLE") {
      const prev = blocks[i - 1];
      if (prev?.type !== "CONSTANT") sum += curr.sign * (curr.coefficient ?? 1) * x;
    }
  }
  return sum;
}

function extractSolution(nerdamerResult: unknown): number | null {
  if (nerdamerResult == null) return null;
  if (Array.isArray(nerdamerResult) && nerdamerResult.length > 0) {
    const first = extractSolution(nerdamerResult[0]);
    if (first != null) return first;
  }
  const str = typeof (nerdamerResult as { toString?: () => string }).toString === "function"
    ? (nerdamerResult as { toString: () => string }).toString()
    : String(nerdamerResult);
  const trimmed = str.trim();
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  const fracMatch = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const n = Number(fracMatch[1]) / Number(fracMatch[2]);
    if (Number.isFinite(n)) return n;
  }
  const xEqMatch = trimmed.match(/x\s*=\s*([-\d.]+)/);
  if (xEqMatch) {
    const n = Number(xEqMatch[1]);
    if (Number.isFinite(n)) return n;
  }
  const xEqFrac = trimmed.match(/x\s*=\s*\(?(-?\d+)\s*\/\s*(\d+)\)?/);
  if (xEqFrac) {
    const n = Number(xEqFrac[1]) / Number(xEqFrac[2]);
    if (Number.isFinite(n)) return n;
  }
  const fracInline = trimmed.match(/^(-?\d+)\s*\/\s*(\d+)/);
  if (fracInline) {
    const n = Number(fracInline[1]) / Number(fracInline[2]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function parseEquation(latex: string): EquationResult | ParseError {
  const normalized = normalizeLatex(latex);
  const eqIndex = normalized.indexOf("=");
  if (eqIndex === -1) return { message: "Ecuación debe contener un signo igual." };

  const leftStr = normalized.slice(0, eqIndex).trim();
  const rightStr = normalized.slice(eqIndex + 1).trim();
  if (!leftStr || !rightStr) return { message: "Lados izquierdo o derecho vacíos." };

  const left = parseSide(leftStr);
  const right = parseSide(rightStr);
  const nerdamerEq = `${leftStr}=${rightStr}`;

  try {
    let solution: number | null = null;
    if (typeof nerdamerApi.solve === "function") {
      const sol = nerdamerApi.solve(nerdamerEq, "x");
      solution = extractSolution(sol);
      if (solution == null && Array.isArray(sol) && sol.length > 0) {
        solution = extractSolution(sol[0]);
      }
    }
    if (solution == null && typeof nerdamerApi.solveEquations === "function") {
      const sol = nerdamerApi.solveEquations([nerdamerEq]);
      const str = sol.toString();
      const parts = str.split(",").map((p: string) => p.trim());
      for (let i = 0; i < parts.length - 1; i += 2) {
        if (parts[i] === "x") {
          const val = parts[i + 1];
          let n = Number(val);
          if (!Number.isFinite(n) && val.includes("/")) {
            const [num, den] = val.split("/").map((s) => Number(s.trim()));
            if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) n = num / den;
          }
          if (Number.isFinite(n)) {
            solution = n;
            break;
          }
        }
      }
    }
    if (solution == null || !Number.isFinite(solution)) {
      return { message: "No se pudo resolver la ecuación o no tiene solución única en x." };
    }

    const { leftSide, rightSide } = sidesToBlocks(
      left.xCoef,
      left.constant,
      right.xCoef,
      right.constant,
      "parse"
    );
    return { leftSide, rightSide, solution };
  } catch {
    return { message: "Error al interpretar la ecuación." };
  }
}
