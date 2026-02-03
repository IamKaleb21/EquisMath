import { InputBar } from "@/components/InputBar";
import { EquationDisplay } from "@/components/EquationDisplay";
import { Graph } from "@/components/Graph";
import { StepSolver } from "@/components/StepSolver";
import { useEquationStore } from "@/store/equationStore";

function App() {
  const rawInput = useEquationStore((s) => s.rawInput);
  const activeMode = useEquationStore((s) => s.activeMode);
  const equations = useEquationStore((s) => s.equations);
  const solution = useEquationStore((s) => s.solution);
  const updateCoefficient = useEquationStore((s) => s.updateCoefficient);

  const isError =
    rawInput.length > 0 &&
    equations.length === 0 &&
    solution.steps.length === 1 &&
    !solution.hasSolution;

  const isSystemNoSolution =
    activeMode === "SYSTEM" &&
    equations.length === 2 &&
    !solution.hasSolution &&
    solution.steps.length > 0;

  return (
    <div className="chalkboard-bg relative min-h-screen overflow-x-hidden">
      {/* Floating math decorations */}
      <div className="math-decorations" />
      
      {/* Main container with wood frame effect on larger screens */}
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 md:px-8 md:py-10">
        
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col items-start gap-2">            
            {/* Main title */}
            <h1 className="chalk-title text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Equis<span className="chalk-yellow">Math</span>
            </h1>
          </div>
        </header>

        {/* Main content grid */}
        <main className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
          
          {/* Left: Graph section */}
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="slate-card flex min-h-0 flex-1 flex-col rounded-xl">
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-chalk-blue/20">
                  <svg className="size-5 text-chalk-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-chalk-white">
                    Gráfica
                  </h2>
                  <p className="text-xs text-chalk-white/50">Visualización en tiempo real</p>
                </div>
              </div>
              
              {/* Graph area */}
              <div className="relative min-h-0 flex-1">
                <Graph
                  equations={equations}
                  mode={activeMode}
                  solution={solution}
                />
              </div>
            </div>
          </section>

          {/* Right: Controls & Solution */}
          <aside className="flex w-full flex-col gap-6 lg:w-[420px]">
            
            {/* Input section */}
            <div className="slate-card rounded-xl">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-chalk-yellow/20">
                    <svg className="size-5 text-chalk-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-chalk-white">
                      Escribe tu ecuación
                    </h2>
                    <p className="text-xs text-chalk-white/50">
                      Ej: 2x − 4 = 0 &nbsp;·&nbsp; x + y = 5, x − y = 1
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <InputBar />
                
                {/* Error messages */}
                {isError && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <span className="mr-2">⚠</span>
                    {solution.steps[0].label}
                  </div>
                )}
                {isSystemNoSolution && !isError && (
                  <div className="mt-4 rounded-lg border border-chalk-yellow/30 bg-chalk-yellow/10 px-4 py-3 text-sm text-chalk-yellow">
                    <span className="mr-2">⚠</span>
                    Sistema sin solución única (rectas paralelas o coincidentes).
                  </div>
                )}
              </div>
            </div>

            {/* Solution section */}
            <div className="slate-card flex min-h-0 flex-1 flex-col rounded-xl">
              <div className="shrink-0 border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-chalk-pink/20">
                    <svg className="size-5 text-chalk-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-chalk-white">
                      Resolución
                    </h2>
                    <p className="text-xs text-chalk-white/50">Paso a paso</p>
                  </div>
                </div>
              </div>
              
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-5">
                <EquationDisplay
                  equations={equations}
                  mode={activeMode}
                  onCoefficientChange={updateCoefficient}
                />
                <StepSolver
                  steps={solution.steps}
                  hasError={isError}
                />
              </div>
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-chalk-white/40 md:flex-row md:text-left">
            <p className="font-mono">
              <span className="text-chalk-yellow/60">f(x)</span> = conocimiento × práctica
            </p>
            <p className="font-display italic">
              "Las matemáticas son el lenguaje con el que Dios escribió el universo"
              <span className="ml-2 text-chalk-white/30">— Galileo</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
