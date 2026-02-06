import type { Block } from "@/shared/types";
import type { EquationResult } from "./types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick non-zero integer in [min, max] excluding 0. */
function randomNonZero(min: number, max: number): number {
  const n = randomInt(min, max);
  return n === 0 ? (Math.random() > 0.5 ? 1 : -1) : n;
}

/** Pick non-zero integer in [min, max] excluding 0 and ±1. */
function randomNonZeroExceptOne(min: number, max: number): number {
  let n = randomNonZero(min, max);
  while (Math.abs(n) === 1) n = randomNonZero(min, max);
  return n;
}

function blockId(side: "left" | "right", index: number): string {
  return `gen-${side}-${index}`;
}

/** Level 1: ax + b = c. x = (c - b) / a integer. Choose x, a, b; then c = b + a*x. */
function generateLevel1(): EquationResult {
  const x = randomInt(-10, 10);
  const a = randomNonZero(-6, 6);
  const b = randomInt(-12, 12);
  const c = b + a * x;

  const leftSide: Block[] = [];
  leftSide.push({
    id: blockId("left", 0),
    type: "CONSTANT",
    value: Math.abs(a),
    sign: a >= 0 ? 1 : -1,
  });
  leftSide.push({
    id: blockId("left", leftSide.length),
    type: "VARIABLE",
    value: 1,
    sign: 1,
    coefficient: 1,
  });
  leftSide.push({
    id: blockId("left", leftSide.length),
    type: "CONSTANT",
    value: Math.abs(b),
    sign: b >= 0 ? 1 : -1,
  });
  const rightSide: Block[] = [
    { id: blockId("right", 0), type: "CONSTANT", value: Math.abs(c), sign: c >= 0 ? 1 : -1 },
  ];
  return { leftSide, rightSide, solution: x };
}

/** Level 2: ax = b. x = b / a integer. Choose a, x; b = a * x. Coefficient a ≠ ±1. */
function generateLevel2(): EquationResult {
  const a = randomNonZeroExceptOne(-8, 8);
  const x = randomInt(-10, 10);
  const b = a * x;

  const leftSide: Block[] = [];
  leftSide.push({
    id: blockId("left", 0),
    type: "CONSTANT",
    value: Math.abs(a),
    sign: a >= 0 ? 1 : -1,
  });
  leftSide.push({
    id: blockId("left", leftSide.length),
    type: "VARIABLE",
    value: 1,
    sign: 1,
    coefficient: 1,
  });
  const rightSide: Block[] = [
    { id: blockId("right", 0), type: "CONSTANT", value: Math.abs(b), sign: b >= 0 ? 1 : -1 },
  ];
  return { leftSide, rightSide, solution: x };
}

/** Level 3: ax + b = cx + d. x = (d - b) / (a - c) integer, a !== c. Choose x, a, c, b; d = b + (a - c)*x. */
function generateLevel3(): EquationResult {
  const x = randomInt(-8, 8);
  let a = randomNonZero(-5, 5);
  let c = randomNonZero(-5, 5);
  if (a === c) c = c + 1;
  if (c === 0) c = 1;
  const b = randomInt(-10, 10);
  const d = b + (a - c) * x;

  const leftSide: Block[] = [];
  leftSide.push({
    id: blockId("left", 0),
    type: "CONSTANT",
    value: Math.abs(a),
    sign: a >= 0 ? 1 : -1,
  });
  leftSide.push({
    id: blockId("left", leftSide.length),
    type: "VARIABLE",
    value: 1,
    sign: 1,
    coefficient: 1,
  });
  leftSide.push({
    id: blockId("left", leftSide.length),
    type: "CONSTANT",
    value: Math.abs(b),
    sign: b >= 0 ? 1 : -1,
  });

  const rightSide: Block[] = [];
  rightSide.push({
    id: blockId("right", 0),
    type: "CONSTANT",
    value: Math.abs(c),
    sign: c >= 0 ? 1 : -1,
  });
  rightSide.push({
    id: blockId("right", rightSide.length),
    type: "VARIABLE",
    value: 1,
    sign: 1,
    coefficient: 1,
  });
  rightSide.push({
    id: blockId("right", rightSide.length),
    type: "CONSTANT",
    value: Math.abs(d),
    sign: d >= 0 ? 1 : -1,
  });
  return { leftSide, rightSide, solution: x };
}

export function generateEquation(level: 1 | 2 | 3): EquationResult {
  switch (level) {
    case 1:
      return generateLevel1();
    case 2:
      return generateLevel2();
    case 3:
      return generateLevel3();
    default:
      return generateLevel1();
  }
}
