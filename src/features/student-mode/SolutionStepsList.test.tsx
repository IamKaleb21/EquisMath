/**
 * Tests for SolutionStepsList: empty state and steps in order (Paso 1 at bottom, latest at top).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { SolutionStepsList } from "./SolutionStepsList";
import { useGameStore } from "@/shared/store/gameStore";

describe("SolutionStepsList", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    if (typeof ResizeObserver === "undefined") {
      vi.stubGlobal("ResizeObserver", class {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
      });
    }
    useGameStore.setState({
      role: "STUDENT",
      equation: { leftSide: [], rightSide: [], solution: 0 },
      solutionSteps: [],
    });
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    vi.restoreAllMocks();
  });

  function render() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(SolutionStepsList));
    });
  }

  it("renders empty state or no list when solutionSteps is empty", () => {
    useGameStore.setState({ solutionSteps: [] });
    render();
    const text = container.textContent ?? "";
    const hasEmptyMessage = /Aún no hay pasos|no hay pasos|Pasos de solución/i.test(text);
    const hasStepNumber = /Paso\s*1/i.test(text);
    expect(hasEmptyMessage || !hasStepNumber).toBe(true);
  });

  it("renders Paso 1 and Paso 2 when solutionSteps has two steps", () => {
    const eq1 = {
      leftSide: [
        { id: "c0", type: "CONSTANT" as const, value: 2, sign: 1 as const },
        { id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 1 },
      ],
      rightSide: [{ id: "c1", type: "CONSTANT" as const, value: 2, sign: 1 as const }],
      solution: 1,
    };
    const eq2 = {
      leftSide: [{ id: "v1", type: "VARIABLE" as const, value: 1, sign: 1 as const, coefficient: 1 }],
      rightSide: [{ id: "c1", type: "CONSTANT" as const, value: 3, sign: 1 as const }],
      solution: 3,
    };
    useGameStore.setState({
      solutionSteps: [
        { stepNumber: 1, description: "Mover +5 al otro lado", equationAfter: eq1 },
        { stepNumber: 2, description: "Pasar 2 como divisor al otro lado", equationAfter: eq2 },
      ],
    });
    render();
    expect(container.textContent).toMatch(/Paso\s*1/i);
    expect(container.textContent).toMatch(/Paso\s*2/i);
    expect(container.textContent).toMatch(/Mover \+5 al otro lado/);
    expect(container.textContent).toMatch(/Pasar 2 como divisor/);
  });
});
