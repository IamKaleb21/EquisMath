import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { StepItem } from "@/types";

interface StepSolverProps {
  steps: StepItem[];
  hasError?: boolean;
}

function StepBlock({ step, index }: { step: StepItem; index: number }) {
  const html =
    step.latex != null
      ? katex.renderToString(step.latex, {
          throwOnError: false,
          displayMode: true,
        })
      : null;

  return (
    <li className="step-item list-none py-3" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex items-start gap-3">
        {/* Step number */}
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-chalk-yellow/20 font-mono text-sm font-semibold text-chalk-yellow">
          {index + 1}
        </span>
        
        <div className="flex-1">
          {/* Step label */}
          <p className="text-sm text-chalk-white/80">{step.label}</p>
          
          {/* LaTeX formula */}
          {html != null && (
            <div
              className="mt-2 overflow-x-auto rounded-lg bg-white/5 px-4 py-3 [&_.katex]:text-lg"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </li>
  );
}

export function StepSolver({ steps, hasError }: StepSolverProps) {
  const [open, setOpen] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        type="button"
        className="group flex w-full items-center justify-between rounded-lg border-2 border-chalk-white/20 bg-white/5 px-5 py-4 text-left transition-all duration-200 hover:border-chalk-blue/40 hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-chalk-blue/20 transition-colors group-hover:bg-chalk-blue/30">
            <svg className="size-5 text-chalk-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="font-display font-medium text-chalk-white">
            Mostrar pasos
          </span>
          <span className="rounded-full bg-chalk-blue/20 px-2 py-0.5 font-mono text-xs text-chalk-blue">
            {steps.length}
          </span>
        </div>
        
        {open ? (
          <ChevronDown className="size-5 text-chalk-white/60 transition-transform" />
        ) : (
          <ChevronRight className="size-5 text-chalk-white/60 transition-transform" />
        )}
      </button>

      {/* Steps list */}
      {open && (
        <div
          className={`rounded-lg border-2 p-4 ${
            hasError 
              ? "border-red-500/30 bg-red-500/5" 
              : "border-chalk-white/10 bg-white/5"
          }`}
        >
          <ol className="space-y-1 divide-y divide-chalk-white/10">
            {steps.map((step, i) => (
              <StepBlock key={i} step={step} index={i} />
            ))}
          </ol>
          
          {/* Final result highlight */}
          {steps.length > 0 && steps[steps.length - 1].latex && !hasError && (
            <div className="mt-4 rounded-lg border-2 border-chalk-yellow/30 bg-chalk-yellow/10 p-4 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-chalk-yellow/70">
                Resultado
              </p>
              <div
                className="[&_.katex]:text-xl [&_.katex]:text-chalk-yellow"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(steps[steps.length - 1].latex!, {
                    throwOnError: false,
                    displayMode: true,
                  }),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
