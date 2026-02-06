import type { Block } from "@/shared/types";

export interface BlockLabelOptions {
  /** First block of side omits + for positive. */
  isFirst?: boolean;
  /** VARIABLE preceded by CONSTANT (coeff×var pair) omits +; coefficient carries the sign. */
  isPrecededByCoefficient?: boolean;
}

/**
 * Option D: First block omits +; variable in coeff×var pair omits + (coefficient carries sign).
 * Example: -2 × x + 1 = 9 (not -2 × +x + 1 = 9).
 */
export function blockLabel(block: Block, options?: BlockLabelOptions | boolean): string {
  const opts = typeof options === "boolean" ? { isFirst: options } : options ?? {};
  const { isFirst, isPrecededByCoefficient } = opts;
  const omitPlusConst = isFirst === true;
  const omitPlusVar = isFirst === true || isPrecededByCoefficient === true;

  if (block.type === "CONSTANT") {
    const v = block.sign === 1 ? block.value : -block.value;
    if (v >= 0) return omitPlusConst ? String(v) : `+${v}`;
    return String(v);
  }
  const c = block.sign * (block.coefficient ?? 1);
  if (c === 1) return omitPlusVar ? "x" : "+x";
  if (c === -1) return "-x";
  if (c >= 0) return omitPlusVar ? `${c}x` : `+${c}x`;
  return `${c}x`;
}

/** Label for a term block (coeff × variable) shown as one unit, e.g. "2x", "-3x". */
export function termLabel(coeff: Block, _variable: Block): string {
  const c = coeff.sign * coeff.value;
  if (c === 1) return "x";
  if (c === -1) return "-x";
  return `${c}x`;
}
