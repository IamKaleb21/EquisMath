import type { Equation } from "@/types";

/**
 * Convierte una ecuación lineal Ax + By = C en una función y = f(x).
 * Para B = 0 la recta es vertical (no es función de x); se devuelve NaN en ese caso.
 */
export function lineToFunction(eq: Equation): (x: number) => number {
  const { a, b, c } = eq.coefficients;
  if (b === 0) {
    return () => Number.NaN;
  }
  return (x: number) => (c - a * x) / b;
}

/**
 * Calcula la intersección de dos rectas Ax+By=C.
 * Devuelve null si son paralelas (determinante ≈ 0).
 */
export function findIntersection(
  eq1: Equation,
  eq2: Equation
): { x: number; y: number } | null {
  const { a: a1, b: b1, c: c1 } = eq1.coefficients;
  const { a: a2, b: b2, c: c2 } = eq2.coefficients;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-10) return null;
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return { x, y };
}
