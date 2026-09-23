/**
 * Fase 5 — Role Selector (PRD §2)
 * Tests para verificar la implementación correcta de:
 * - RoleSelector component: muestra opciones STUDENT/TEACHER
 * - Integración con store: llama setRole y persistToLocalStorage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { createElement, act } from "react";
import { RoleSelector } from "./RoleSelector";
import { useGameStore } from "@/shared/store/gameStore";

describe("features/role-selector (Fase 5)", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    useGameStore.setState({ role: null });
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    vi.restoreAllMocks();
  });

  function renderRoleSelector() {
    root = createRoot(container);
    act(() => {
      root.render(createElement(RoleSelector));
    });
  }

  describe("RoleSelector component", () => {
    it("renders three options: STUDENT, TEACHER, and TUI", () => {
      renderRoleSelector();
      expect(container.textContent).toContain("Soy Estudiante");
      expect(container.textContent).toContain("Soy Docente");
      expect(container.textContent).toContain("Modo Físico");
    });

    it("displays user-friendly labels (e.g., 'Estudiante' and 'Docente')", () => {
      renderRoleSelector();
      expect(container.textContent).toMatch(/Estudiante/i);
      expect(container.textContent).toMatch(/Docente/i);
    });

    it("buttons/cards are clickable and accessible", () => {
      renderRoleSelector();
      const buttons = container.querySelectorAll('[role="button"]');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      const ariaLabels = Array.from(buttons).map((el) => el.getAttribute("aria-label"));
      expect(ariaLabels.some((l) => l?.includes("Estudiante"))).toBe(true);
      expect(ariaLabels.some((l) => l?.includes("Docente"))).toBe(true);
      expect(ariaLabels.some((l) => l?.includes("Físico"))).toBe(true);
    });

    it("has visually distinct styling for each role option", () => {
      renderRoleSelector();
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards.length).toBe(3);
    });
  });

  describe("store integration", () => {
    it("calls setRole('STUDENT') when student option is clicked", () => {
      const setRoleSpy = vi.spyOn(useGameStore.getState(), "setRole");
      renderRoleSelector();
      const studentCard = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent?.includes("Soy Estudiante")
      );
      expect(studentCard).toBeTruthy();
      act(() => {
        (studentCard as HTMLElement).click();
      });
      expect(setRoleSpy).toHaveBeenCalledWith("STUDENT");
    });

    it("calls setRole('TEACHER') when teacher option is clicked", () => {
      const setRoleSpy = vi.spyOn(useGameStore.getState(), "setRole");
      renderRoleSelector();
      const teacherCard = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent?.includes("Soy Docente")
      );
      expect(teacherCard).toBeTruthy();
      act(() => {
        (teacherCard as HTMLElement).click();
      });
      expect(setRoleSpy).toHaveBeenCalledWith("TEACHER");
    });

    it("calls setRole('TUI') when the physical mode option is clicked", () => {
      const setRoleSpy = vi.spyOn(useGameStore.getState(), "setRole");
      renderRoleSelector();
      const tuiCard = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent?.includes("Modo Físico")
      );
      expect(tuiCard).toBeTruthy();
      act(() => {
        (tuiCard as HTMLElement).click();
      });
      expect(setRoleSpy).toHaveBeenCalledWith("TUI");
    });

    it("calls persistToLocalStorage after setRole", () => {
      const persistSpy = vi.spyOn(useGameStore.getState(), "persistToLocalStorage");
      renderRoleSelector();
      const studentCard = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent?.includes("Soy Estudiante")
      );
      act(() => {
        (studentCard as HTMLElement).click();
      });
      expect(persistSpy).toHaveBeenCalled();
    });

    it("does not call setRole if already selected (prevents duplicate calls)", () => {
      useGameStore.setState({ role: "STUDENT" });
      const setRoleSpy = vi.spyOn(useGameStore.getState(), "setRole");
      renderRoleSelector();
      const studentCard = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.textContent?.includes("Soy Estudiante")
      );
      act(() => {
        (studentCard as HTMLElement).click();
      });
      expect(setRoleSpy).toHaveBeenCalledWith("STUDENT");
    });
  });

  describe("accessibility", () => {
    it("role options have appropriate aria labels", () => {
      renderRoleSelector();
      const studentButton = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.getAttribute("aria-label")?.includes("Estudiante")
      );
      const teacherButton = Array.from(container.querySelectorAll('[role="button"]')).find(
        (el) => el.getAttribute("aria-label")?.includes("Docente")
      );
      expect(studentButton).toBeTruthy();
      expect(teacherButton).toBeTruthy();
    });
  });

  describe("visual design (dark theme)", () => {
    it("uses theme colors (primary, card, border)", () => {
      renderRoleSelector();
      const html = container.innerHTML;
      expect(html).toMatch(/text-primary|bg-card|border-border|text-emerald-400/);
    });
  });
});
