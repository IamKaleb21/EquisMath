/**
 * Level selector (1–3). Calls setLevel and requestNewEquation({ isFirstOfLevel: true }) on click.
 */
import type { Level } from "@/shared/types";
import { useGameStore } from "@/shared/store/gameStore";
import { cn } from "@/shared/lib/utils";

const LEVELS: { level: Level; label: string; description: string }[] = [
  { level: 1, label: "Nivel 1", description: "Básico: ax + b = c" },
  { level: 2, label: "Nivel 2", description: "Intermedio: ax = b" },
  { level: 3, label: "Nivel 3", description: "Avanzado: ax + b = cx + d" },
];

export function LevelSelect() {
  const currentLevel = useGameStore((s) => s.currentLevel);
  const setLevel = useGameStore((s) => s.setLevel);
  const requestNewEquation = useGameStore((s) => s.requestNewEquation);
  const persistToLocalStorage = useGameStore((s) => s.persistToLocalStorage);

  function handleSelect(level: Level) {
    setLevel(level);
    requestNewEquation({ isFirstOfLevel: true });
    persistToLocalStorage();
  }

  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1 sm:flex-nowrap"
      role="group"
      aria-label="Seleccionar nivel"
    >
      {LEVELS.map(({ level, label, description }) => (
        <button
          key={level}
          type="button"
          onClick={() => handleSelect(level)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2.5 text-left transition-all duration-200 sm:flex-none sm:px-4 min-w-0 sm:first:rounded-l-lg sm:last:rounded-r-lg",
            currentLevel === level
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-muted/50"
          )}
          aria-pressed={currentLevel === level ? "true" : "false"}
          aria-label={`Seleccionar ${label}`}
        >
          <span className="block font-semibold">{label}</span>
          <span className="block text-xs opacity-80">{description}</span>
        </button>
      ))}
    </div>
  );
}
