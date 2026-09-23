import type { Block, EquationState, Side } from "@/shared/types";
import { blockLabel, termLabel } from "./blockLabel";

function getSide(equation: EquationState, side: Side): Block[] {
  return side === "left" ? equation.leftSide : equation.rightSide;
}

function isCoefficientConstant(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx < 0 || idx >= blocks.length - 1) return false;
  const curr = blocks[idx];
  const next = blocks[idx + 1];
  return curr.type === "CONSTANT" && next.type === "VARIABLE";
}

function isVariableWithCoefficient(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx <= 0) return false;
  const prev = blocks[idx - 1];
  const curr = blocks[idx];
  return curr.type === "VARIABLE" && prev.type === "CONSTANT";
}

function getCoefficientBefore(blocks: Block[], varBlockId: string): Block | null {
  const idx = blocks.findIndex((b) => b.id === varBlockId);
  if (idx <= 0) return null;
  const prev = blocks[idx - 1];
  if (prev.type === "CONSTANT") return prev;
  return null;
}

/**
 * Returns a short human-readable description of the move for solution steps.
 * Used when the move has already been validated.
 */
export function describeMove(
  block: Block,
  fromSide: Side,
  toSide: Side,
  equation: EquationState
): string {
  const fromBlocks = getSide(equation, fromSide);
  const crossing = fromSide !== toSide;

  if (block.type === "CONSTANT" && isCoefficientConstant(fromBlocks, block.id)) {
    const value = block.sign * block.value;
    return `Pasar ${value} como divisor al otro lado`;
  }

  if (block.type === "VARIABLE" && isVariableWithCoefficient(fromBlocks, block.id)) {
    const coeff = getCoefficientBefore(fromBlocks, block.id);
    if (coeff) {
      const term = termLabel(coeff, block);
      return crossing ? `Mover ${term} al otro lado` : `Reordenar ${term}`;
    }
  }

  const label = blockLabel(block, { isFirst: true });
  return crossing ? `Mover ${label} al otro lado` : `Reordenar ${label}`;
}
