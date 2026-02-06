import { useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Block, Side } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { useGameStore } from "@/shared/store/gameStore";
import { blockLabel } from "./blockLabel";

export interface BlockItemProps {
  block: Block;
  side: Side;
  isFirst?: boolean;
  isPrecededByCoefficient?: boolean;
}

export function BlockItem({ block, side, isFirst, isPrecededByCoefficient }: BlockItemProps) {
  const lastFailedMove = useGameStore((s) => s.lastFailedMove);
  const clearLastFailedMove = useGameStore((s) => s.clearLastFailedMove);
  const isFailed = lastFailedMove?.blockId === block.id;
  const failedTs = lastFailedMove?.timestamp ?? 0;
  const prevFailedTs = useRef(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: block.id,
    data: { blockId: block.id, fromSide: side },
  });

  useEffect(() => {
    if (isFailed && failedTs !== prevFailedTs.current) {
      prevFailedTs.current = failedTs;
      const t = setTimeout(clearLastFailedMove, 400);
      return () => clearTimeout(t);
    }
  }, [isFailed, failedTs, clearLastFailedMove]);

  // When using DragOverlay, the overlay follows the cursor; do not transform the original.
  const style = transform && !isDragging
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={block.id}
      className={cn(
        "flex min-w-0 flex-1 cursor-grab items-center justify-center rounded-lg border border-primary bg-primary/10 px-3 py-1.5 font-mono text-sm font-medium text-primary transition-colors active:cursor-grabbing"
      )}
      style={{
        ...style,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
      animate={
        isFailed
          ? {
              x: [0, -8, 8, -4, 4, 0],
              transition: { duration: 0.4, ease: "easeOut" },
            }
          : undefined
      }
      {...listeners}
      {...attributes}
    >
      {blockLabel(block, { isFirst, isPrecededByCoefficient })}
    </motion.div>
  );
}
