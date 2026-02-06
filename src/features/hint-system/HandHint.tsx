/**
 * FR5: Hand-Hint overlay. Shows when hint.showHint is true; animated hand icon and "Entendido" button.
 */
import { Hand } from "lucide-react";
import { useGameStore } from "@/shared/store/gameStore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function HandHint() {
  const showHint = useGameStore((s) => s.hint.showHint);
  const clearHint = useGameStore((s) => s.clearHint);

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          key="hand-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-label="Pista: arrastra un bloque"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-lg"
          >
            <motion.div
              animate={{
                x: [0, 8, 0],
                transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
              }}
              className="text-primary"
            >
              <Hand className="h-16 w-16" strokeWidth={1.5} />
            </motion.div>
            <p className="max-w-xs text-center text-sm text-foreground">
              Arrastra un bloque al otro lado del igual para despejar.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => clearHint()}
            >
            Entendido
          </Button>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
