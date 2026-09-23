import type { EquationState, Block } from "@/shared/types";
import { blockLabel, termLabel } from "@/features/block-system/blockLabel";

function isCoefficientBeforeVariable(blocks: Block[], index: number): boolean {
  if (index < 0 || index >= blocks.length - 1) return false;
  return blocks[index].type === "CONSTANT" && blocks[index + 1].type === "VARIABLE";
}

function sideToLatex(blocks: Block[]): string {
  if (blocks.length === 0) return "0";
  const parts: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    if (isCoefficientBeforeVariable(blocks, i)) {
      parts.push(termLabel(blocks[i], blocks[i + 1]));
      i++;
    } else {
      const isFirst = i === 0;
      const isPrecededByCoefficient =
        blocks[i].type === "VARIABLE" && blocks[i - 1]?.type === "CONSTANT";
      parts.push(blockLabel(blocks[i], { isFirst, isPrecededByCoefficient }));
    }
  }
  return parts.join("");
}

/**
 * Converts an equation state to a LaTeX string suitable for KaTeX rendering.
 * Produces linear expressions like "-5x+5=-x+17" or "x=5".
 */
export function equationToLatex(equation: EquationState): string {
  const left = sideToLatex(equation.leftSide);
  const right = sideToLatex(equation.rightSide);
  return `${left}=${right}`;
}
