import type { Role } from "@/shared/types";
import { BookOpen, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { useGameStore } from "@/shared/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

function handleSelect(role: Role) {
  useGameStore.getState().setRole(role);
  useGameStore.getState().persistToLocalStorage();
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function RoleSelector() {
  return (
    <motion.div
      className="flex min-h-[60vh] flex-col justify-center py-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p
        className="mb-10 text-center font-display text-xl text-foreground md:text-2xl"
        variants={item}
      >
        ¿Cómo quieres usar EquisMath?
      </motion.p>
      {/* Asymmetric: two cards with different visual weight; second offset for overlap feel */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        <motion.div variants={item} className="sm:mt-0">
          <Card
            className={cn(
              "cursor-pointer rounded-2xl border border-border bg-card/90 shadow-lg transition-all duration-300",
              "hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            )}
            onClick={() => handleSelect("STUDENT")}
            role="button"
            aria-label="Elegir modo Estudiante"
          >
            <CardHeader className="pb-2">
              <span className="mb-2 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                Practicar
              </span>
              <CardTitle className="flex items-center gap-2 font-display text-xl text-primary">
                <BookOpen className="size-5" aria-hidden />
                Soy Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Niveles y bloques arrastrables para despejar.
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item} className="sm:translate-y-4">
          <Card
            className={cn(
              "cursor-pointer rounded-2xl border border-border bg-card/90 shadow-lg transition-all duration-300",
              "hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            )}
            onClick={() => handleSelect("TEACHER")}
            role="button"
            aria-label="Elegir modo Docente"
          >
            <CardHeader className="pb-2">
              <span className="mb-2 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                Crear
              </span>
              <CardTitle className="flex items-center gap-2 font-display text-xl text-primary">
                <PenLine className="size-5" aria-hidden />
                Soy Docente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Escribe una ecuación y mira la gráfica.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
