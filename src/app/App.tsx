import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/shared/store/gameStore";
import { RoleSelector } from "@/features/role-selector";
import { StudentMode } from "@/features/student-mode";
import { TeacherMode } from "@/features/teacher-mode";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

function App() {
  const role = useGameStore((s) => s.role);
  const setRole = useGameStore((s) => s.setRole);
  const persistToLocalStorage = useGameStore((s) => s.persistToLocalStorage);

  function handleBackToOnboarding() {
    setRole(null);
    persistToLocalStorage();
  }

  useEffect(() => {
    useGameStore.getState().hydrateFromLocalStorage();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Background depth: gradient base + soft radial blob (atmosphere) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#09090b_0%,#0c0c0e_40%,#18181b_100%)]" />
        <div className="absolute -top-1/2 right-0 h-[80vh] w-[70vw] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[50vh] w-[50vw] rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>

      <div className={cn(
        "relative z-10 flex flex-1 flex-col",
        role === "STUDENT" ? "h-screen overflow-hidden" : "min-h-screen overflow-y-auto"
      )}>
        <header className="shrink-0 border-b border-border/50 bg-zinc-950/80 px-4 py-4 backdrop-blur-sm md:px-8 md:py-5">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {role !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={handleBackToOnboarding}
                  aria-label="Volver al inicio"
                >
                  <ArrowLeft className="size-4 md:size-[18px]" aria-hidden />
                  <span className="ml-1.5 hidden sm:inline">Volver</span>
                </Button>
              )}
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Equis<span className="text-primary">Math</span>
              </h1>
            </div>
            <p className="hidden shrink-0 text-right font-mono text-xs text-muted-foreground md:block md:text-sm">
              Resuelve ecuaciones lineales
            </p>
          </div>
        </header>

        <motion.main
          className={cn(
            "flex flex-1 flex-col min-h-0",
            role === "STUDENT" ? "p-2 md:p-3" : "px-4 py-4 md:px-6 md:py-6"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className={cn(
            "flex w-full min-w-0",
            role === "STUDENT" ? "flex-1 min-h-0" : "flex-1"
          )}>
            {role === null && <RoleSelector />}
            {role === "STUDENT" && <StudentMode />}
            {role === "TEACHER" && <TeacherMode />}
          </div>
        </motion.main>

        <footer className="shrink-0 border-t border-border/50 px-4 py-4 md:px-8">
          <div className="flex w-full justify-center md:justify-start">
            <p className="font-mono text-xs text-muted-foreground">
              <span className="text-primary/80">f(x)</span> = conocimiento × práctica
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
