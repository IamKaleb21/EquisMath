import type { Block, EquationState, Side } from "@/shared/types";
import type { ValidateMoveResult } from "./types";

/** VARIABLE immediately after CONSTANT = variable with coefficient. */
function isVariableWithCoefficient(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx <= 0 || idx >= blocks.length) return false;
  const prev = blocks[idx - 1];
  const curr = blocks[idx];
  return curr.type === "VARIABLE" && prev.type === "CONSTANT";
}

/** CONSTANT immediately before VARIABLE = coefficient. */
function isCoefficientConstant(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx < 0 || idx >= blocks.length - 1) return false;
  const curr = blocks[idx];
  const next = blocks[idx + 1];
  return curr.type === "CONSTANT" && next.type === "VARIABLE";
}

/** True if any CONSTANT with value != 0 is not followed by VARIABLE (standalone constant). */
function hasStandaloneConstant(blocks: Block[]): boolean {
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT" && curr.value !== 0) {
      const next = blocks[i + 1];
      if (next?.type !== "VARIABLE") return true;
    }
  }
  return false;
}

/** True if side has at least one VARIABLE block. */
function sideHasVariable(blocks: Block[]): boolean {
  return blocks.some((b) => b.type === "VARIABLE");
}

export function validateMove(
  block: Block,
  fromSide: Side,
  toSide: Side,
  equation: EquationState
): ValidateMoveResult {
  const sideBlocks = fromSide === "left" ? equation.leftSide : equation.rightSide;
  const targetBlocks = toSide === "left" ? equation.leftSide : equation.rightSide;
  const targetHasVar = sideHasVariable(targetBlocks);

  // Check: VARIABLE with coefficient (term variable)
  const isVarWithCoeff = block.type === "VARIABLE" && isVariableWithCoefficient(sideBlocks, block.id);
  if (isVarWithCoeff) {
    // Same-side reorder would change semantics (mergeSide interprets position: coeff vs standalone)
    if (fromSide === toSide) {
      return {
        valid: false,
        reason: "No reordenes el término variable en el mismo lado",
      };
    }
    // Moving term variable removes 2 blocks (coeff + var)
    if (sideBlocks.length <= 2) {
      return {
        valid: false,
        reason: "No se puede dejar un lado vacío",
      };
    }
    // Allow only if target has VARIABLE (reunir términos)
    if (targetHasVar) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: "Mueve el coeficiente primero",
    };
  }

  // Check: simple block (const or var without coeff) would leave side empty
  if (sideBlocks.length <= 1) {
    return {
      valid: false,
      reason: "No se puede dejar un lado vacío",
    };
  }

  // Check: CONSTANT acting as coefficient
  const isCoeffConst = block.type === "CONSTANT" && isCoefficientConstant(sideBlocks, block.id);
  if (isCoeffConst) {
    // Same-side reorder would break coeff+var pairing (mergeSide uses position)
    if (fromSide === toSide) {
      return {
        valid: false,
        reason: "No reordenes el coeficiente en el mismo lado",
      };
    }
    // Coefficient 0 would cause division by zero
    if (block.value === 0) {
      return {
        valid: false,
        reason: "División por cero",
      };
    }
    // Must move standalone constants first
    if (hasStandaloneConstant(sideBlocks)) {
      return {
        valid: false,
        reason: "Mueve los términos constantes primero",
      };
    }
    // Cannot divide when target has VARIABLE (use term variable instead)
    if (targetHasVar) {
      return {
        valid: false,
        reason: "Usa el término variable para reunir términos",
      };
    }
    return { valid: true };
  }

  // Standalone constant or variable without coefficient: always valid
  return { valid: true };
}

/** True if the coefficient block can be moved to at least one side (used for visual grouping). */
export function canCoefficientBeMoved(
  coeff: Block,
  fromSide: Side,
  equation: EquationState
): boolean {
  return (
    validateMove(coeff, fromSide, "left", equation).valid ||
    validateMove(coeff, fromSide, "right", equation).valid
  );
}
