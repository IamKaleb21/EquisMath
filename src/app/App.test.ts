/**
 * Fase 5 — App Entry (specs: app/App.tsx)
 * Tests para verificar la implementación correcta de:
 * - Routing por rol (role === null → RoleSelector, STUDENT → StudentMode, TEACHER → TeacherMode)
 * - Hydration desde localStorage en mount
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import App from "./App.tsx";
import { useGameStore } from "@/shared/store/gameStore";

describe("app/App (Fase 5)", () => {
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
    container = document.createElement("div");
    document.body.appendChild(container);
    useGameStore.setState({ role: null });
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    vi.restoreAllMocks();
  });

  function renderApp() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(App));
    });
  }

  describe("role-based routing", () => {
    it("renders RoleSelector when role is null", () => {
      useGameStore.setState({ role: null });
      renderApp();
      expect(container.textContent).toContain("Soy Estudiante");
      expect(container.textContent).toContain("Soy Docente");
      expect(container.textContent).toMatch(/¿Cómo quieres usar EquisMath/);
    });

    it("renders StudentMode when role is 'STUDENT'", () => {
      useGameStore.setState({ role: "STUDENT" });
      renderApp();
      expect(container.textContent).toMatch(/Nivel 1|Elige el nivel|Progreso/);
    });

    it("renders TeacherMode when role is 'TEACHER'", () => {
      useGameStore.setState({ role: "TEACHER" });
      renderApp();
      expect(container.textContent).toContain("Escribe tu ecuación");
      expect(container.textContent).toMatch(/Aplicar|math-field|Escribe tu ecuación/);
    });

    it("updates view when role changes in store", () => {
      useGameStore.setState({ role: null });
      renderApp();
      expect(container.textContent).toContain("Soy Estudiante");

      act(() => {
        useGameStore.setState({ role: "STUDENT" });
      });
      expect(container.textContent).toMatch(/Nivel 1|Elige el nivel|Progreso/);

      act(() => {
        useGameStore.setState({ role: "TEACHER" });
      });
      expect(container.textContent).toContain("Escribe tu ecuación");
    });
  });

  describe("hydration on mount", () => {
    it("calls hydrateFromLocalStorage on initial mount", () => {
      const hydrateSpy = vi.spyOn(useGameStore.getState(), "hydrateFromLocalStorage");
      renderApp();
      expect(hydrateSpy).toHaveBeenCalled();
    });
  });

  describe("layout and structure", () => {
    it("wraps content in appropriate layout container", () => {
      renderApp();
      const main = container.querySelector("main");
      expect(main).toBeTruthy();
      const header = container.querySelector("header");
      expect(header).toBeTruthy();
    });

    it("applies layout classes to root element", () => {
      renderApp();
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toMatch(/relative|min-h-screen/);
    });

    it("renders without errors on initial load", () => {
      expect(() => renderApp()).not.toThrow();
      expect(container.textContent).toContain("EquisMath");
    });
  });
});
