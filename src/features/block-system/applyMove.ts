import type { Block, EquationState, Side } from "@/shared/types";

function getSide(equation: EquationState, side: Side): Block[] {
  return side === "left" ? equation.leftSide : equation.rightSide;
}

function findBlock(equation: EquationState, blockId: string): { block: Block; side: Side } | null {
  const inLeft = equation.leftSide.find((b) => b.id === blockId);
  if (inLeft) return { block: inLeft, side: "left" };
  const inRight = equation.rightSide.find((b) => b.id === blockId);
  if (inRight) return { block: inRight, side: "right" };
  return null;
}

function withoutBlock(blocks: Block[], blockId: string): Block[] {
  return blocks.filter((b) => b.id !== blockId);
}

/** Sum only CONSTANT blocks that are NOT followed by VARIABLE (standalone constants). */
function standaloneConstSum(blocks: Block[]): number {
  let sum = 0;
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    if (curr.type === "CONSTANT") {
      const next = blocks[i + 1];
      if (next?.type !== "VARIABLE") {
        sum += curr.sign * curr.value;
      }
    }
  }
  return sum;
}

/** True if side has at least one VARIABLE block. */
function sideHasVariable(blocks: Block[]): boolean {
  return blocks.some((b) => b.type === "VARIABLE");
}

/** CONSTANT immediately before VARIABLE = coefficient. */
function isCoefficientConstant(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx < 0 || idx >= blocks.length - 1) return false;
  const curr = blocks[idx];
  const next = blocks[idx + 1];
  return curr.type === "CONSTANT" && next.type === "VARIABLE";
}

/** VARIABLE immediately after CONSTANT = variable with coefficient. */
function isVariableWithCoefficient(blocks: Block[], blockId: string): boolean {
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx <= 0) return false;
  const prev = blocks[idx - 1];
  const curr = blocks[idx];
  return curr.type === "VARIABLE" && prev.type === "CONSTANT";
}

/** Get the coefficient CONSTANT before a VARIABLE. */
function getCoefficientBefore(blocks: Block[], varBlockId: string): Block | null {
  const idx = blocks.findIndex((b) => b.id === varBlockId);
  if (idx <= 0) return null;
  const prev = blocks[idx - 1];
  if (prev.type === "CONSTANT") return prev;
  return null;
}

export function applyMove(
  equation: EquationState,
  blockId: string,
  fromSide: Side,
  toSide: Side
): EquationState {
  const found = findBlock(equation, blockId);
  if (!found || found.side !== fromSide) return equation;

  const block = found.block;
  const fromBlocks = getSide(equation, fromSide);
  const targetSideBlocks = getSide(equation, toSide);
  const leftSide = equation.leftSide;
  const rightSide = equation.rightSide;

  if (fromSide === toSide) {
    const filtered = withoutBlock(fromBlocks, blockId);
    const newBlocks = [...filtered, { ...block }];
    return {
      leftSide: fromSide === "left" ? newBlocks : leftSide,
      rightSide: fromSide === "right" ? newBlocks : rightSide,
      solution: equation.solution,
    };
  }

  const targetHasVar = sideHasVariable(targetSideBlocks);

  // VARIABLE with coefficient: move term (coeff+var) when target has VARIABLE
  const isVarWithCoeff = block.type === "VARIABLE" && isVariableWithCoefficient(fromBlocks, blockId);
  if (isVarWithCoeff && targetHasVar) {
    const coeff = getCoefficientBefore(fromBlocks, blockId);
    if (coeff) {
      const sourceBlocks = withoutBlock(withoutBlock(fromBlocks, coeff.id), blockId);
      const flippedCoeff: Block = {
        ...coeff,
        id: `term-coeff-${toSide}-${coeff.id}`,
        sign: (coeff.sign === 1 ? -1 : 1) as 1 | -1,
      };
      const flippedVar: Block = {
        ...block,
        id: `term-var-${toSide}-${blockId}`,
        sign: (block.sign === 1 ? -1 : 1) as 1 | -1,
      };
      const newTargetBlocks = [...targetSideBlocks, flippedCoeff, flippedVar];
      return {
        leftSide: fromSide === "left" ? sourceBlocks : newTargetBlocks,
        rightSide: fromSide === "right" ? sourceBlocks : newTargetBlocks,
        solution: equation.solution,
      };
    }
  }

  // CONSTANT acting as coefficient: move to other side = divide target standalone constants by it
  const isCoeffConst = block.type === "CONSTANT" && isCoefficientConstant(fromBlocks, blockId);
  const targetHasStandaloneConst = standaloneConstSum(targetSideBlocks) !== 0 || targetSideBlocks.some((b) => b.type === "CONSTANT" && targetSideBlocks[targetSideBlocks.indexOf(b) + 1]?.type !== "VARIABLE");
  const k = isCoeffConst ? block.sign * block.value : null;

  if (isCoeffConst && !targetHasVar && targetHasStandaloneConst && k !== null && k !== 0) {
    const sourceBlocks = withoutBlock(fromBlocks, blockId);
    const targetConstSum = standaloneConstSum(targetSideBlocks);
    const divided = targetConstSum / k;
    const newTargetBlocks: Block[] = [
      {
        id: `div-${toSide}-${blockId}`,
        type: "CONSTANT",
        value: Math.abs(divided),
        sign: (divided >= 0 ? 1 : -1) as 1 | -1,
      },
    ];

    return {
      leftSide: fromSide === "left" ? sourceBlocks : newTargetBlocks,
      rightSide: fromSide === "right" ? sourceBlocks : newTargetBlocks,
      solution: equation.solution,
    };
  }

  const flippedBlock: Block = {
    ...block,
    sign: (block.sign === 1 ? -1 : 1) as 1 | -1,
  };
  const newFromBlocks = withoutBlock(fromBlocks, blockId);
  const newToBlocks = [...targetSideBlocks, flippedBlock];

  return {
    leftSide: fromSide === "left" ? newFromBlocks : newToBlocks,
    rightSide: fromSide === "right" ? newFromBlocks : newToBlocks,
    solution: equation.solution,
  };
}
