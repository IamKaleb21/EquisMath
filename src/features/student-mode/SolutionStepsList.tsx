import katex from "katex";
import "katex/dist/katex.min.css";
import { useGameStore } from "@/shared/store/gameStore";
import { equationToLatex } from "@/features/equation-engine";

export function SolutionStepsList() {
  const solutionSteps = useGameStore((s) => s.solutionSteps);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Pasos de solución</p>
      {solutionSteps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
          Aún no hay pasos. Arrastra bloques para ver tu progreso.
        </p>
      ) : (
        <div className="flex flex-col-reverse gap-2 overflow-y-auto">
          {solutionSteps.map((step) => {
            const latex = equationToLatex(step.equationAfter);
            const equationHtml = katex.renderToString(latex, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <div
                key={step.stepNumber}
                className="rounded-lg border-2 border-primary/40 bg-card/80 px-3 py-2.5 shadow-sm"
              >
                <p className="text-sm font-medium text-foreground">
                  <span className="font-semibold text-primary">Paso {step.stepNumber}:</span>{" "}
                  {step.description}
                </p>
                <div
                  className="mt-1.5 text-center text-sm text-muted-foreground [&_.katex]:text-sm"
                  dangerouslySetInnerHTML={{ __html: equationHtml }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
