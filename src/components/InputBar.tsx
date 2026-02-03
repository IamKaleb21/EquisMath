import "mathlive/static.css";
import { useRef, useEffect } from "react";
import { useEquationStore } from "@/store/equationStore";

/** Convierte salida de MathLive (plain-text o LaTeX) a formato que nuestro parser acepta. */
function normalizeForParser(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Layout del teclado virtual: solo teclas necesarias para ecuaciones lineales
 * (1 var, 2 var, sistema 2x2). Operadores, números, variables y edición.
 */
const EQUATION_KEYBOARD_LAYOUT = {
  label: "Ecuación",
  rows: [
    ["[+]", "[-]", "[=]", "[.]", ",", { latex: "\\frac{#@}{#?}", class: "small" }],
    ["[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]", "[0]"],
    ["x", "y", "[backspace]", "[left]", "[right]", "[hide-keyboard]"],
  ],
};

function getVirtualKeyboard(): { layouts: unknown; show: (opts?: { animate?: boolean }) => void } | undefined {
  return typeof window !== "undefined"
    ? (window as unknown as { mathVirtualKeyboard?: { layouts: unknown; show: (opts?: { animate?: boolean }) => void } }).mathVirtualKeyboard
    : undefined;
}

export function InputBar() {
  const setInput = useEquationStore((s) => s.setInput);
  const rawInput = useEquationStore((s) => s.rawInput);
  const mfRef = useRef<HTMLElement & { getValue: (format?: string) => string; value: string }>(null);
  const submitRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = mfRef.current;
    if (el && rawInput === "") el.value = "";
  }, [rawInput]);

  const handleSubmit = () => {
    const el = mfRef.current;
    if (!el) return;
    const plain = el.getValue("plain-text") ?? el.value ?? "";
    const normalized = normalizeForParser(plain);
    setInput(normalized);
  };
  submitRef.current = handleSubmit;

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    const applyLayout = () => {
      const kbd = getVirtualKeyboard();
      if (kbd) {
        kbd.layouts = [EQUATION_KEYBOARD_LAYOUT];
        kbd.show({ animate: true });
      }
    };
    mf.addEventListener("focusin", applyLayout);
    return () => mf.removeEventListener("focusin", applyLayout);
  }, []);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitRef.current();
        return;
      }
      e.preventDefault();
    };
    mf.addEventListener("keydown", onKeyDown, { capture: true });
    return () => mf.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      <math-field
        ref={mfRef as React.RefObject<HTMLElement>}
        math-virtual-keyboard-policy="manual"
        className="chalk-input min-h-[56px] w-full rounded-lg px-4 py-3 text-lg"
        style={{ display: "block" }}
      />
      <button
        onClick={handleSubmit}
        type="button"
        className="chalk-button glow-hover w-full rounded-lg px-8 py-3 text-base"
      >
        Calcular
      </button>
    </div>
  );
}
