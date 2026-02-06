import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import type { Block, EquationState, Side } from "@/shared/types";
import { useGameStore } from "@/shared/store/gameStore";
import { BlockItem } from "./BlockItem";
import { blockLabel, termLabel } from "./blockLabel";
import { canCoefficientBeMoved } from "./validateMove";
import { cn } from "@/shared/lib/utils";

const DROP_LEFT: Side = "left";
const DROP_RIGHT: Side = "right";

function StaticBlock({
  block,
  isFirst,
  isPrecededByCoefficient,
}: {
  block: Block;
  isFirst?: boolean;
  isPrecededByCoefficient?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-primary bg-primary/10 px-3 py-1.5 font-mono text-sm font-medium text-primary">
      {blockLabel(block, { isFirst, isPrecededByCoefficient })}
    </div>
  );
}

function DragOverlayBlock({
  block,
  equation,
  fromSide,
}: {
  block: Block;
  equation: EquationState;
  fromSide: Side;
}) {
  const leftIdx = equation.leftSide.findIndex((b) => b.id === block.id);
  const rightIdx = equation.rightSide.findIndex((b) => b.id === block.id);
  const blocks = leftIdx >= 0 ? equation.leftSide : equation.rightSide;
  const index = leftIdx >= 0 ? leftIdx : rightIdx;
  const prev = blocks[index - 1];
  const isFirst = index === 0;
  const isPrecededByCoefficient =
    block.type === "VARIABLE" && prev?.type === "CONSTANT";

  const isCollapsedTerm =
    block.type === "VARIABLE" &&
    prev?.type === "CONSTANT" &&
    !canCoefficientBeMoved(prev, fromSide, equation);

  const label = isCollapsedTerm && prev ? termLabel(prev, block) : blockLabel(block, { isFirst, isPrecededByCoefficient });

  return (
    <div className="inline-flex cursor-grabbing items-center justify-center rounded-lg border border-primary bg-primary/10 px-3 py-1.5 font-mono text-sm font-medium text-primary shadow-lg">
      {label}
    </div>
  );
}

function isCoefficientBeforeVariable(blocks: Block[], index: number): boolean {
  if (index < 0 || index >= blocks.length - 1) return false;
  const curr = blocks[index];
  const next = blocks[index + 1];
  return curr.type === "CONSTANT" && next.type === "VARIABLE";
}

type RenderItem =
  | { kind: "single"; block: Block; isFirst: boolean; isPrecededByCoefficient: boolean }
  | { kind: "term"; coeff: Block; variable: Block; isFirst: boolean };

function getRenderItems(
  blocks: Block[],
  side: Side,
  equation: EquationState
): RenderItem[] {
  const items: RenderItem[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i];
    const next = blocks[i + 1];
    const prev = blocks[i - 1];
    const isFirst = items.length === 0;

    if (curr.type === "CONSTANT" && next?.type === "VARIABLE") {
      const coeffCanBeMoved = canCoefficientBeMoved(curr, side, equation);
      if (!coeffCanBeMoved) {
        items.push({ kind: "term", coeff: curr, variable: next, isFirst });
        i++;
        continue;
      }
    }
    if (curr.type === "VARIABLE" && prev?.type === "CONSTANT") {
      const coeffCanBeMoved = canCoefficientBeMoved(prev, side, equation);
      if (!coeffCanBeMoved) continue;
    }
    items.push({
      kind: "single",
      block: curr,
      isFirst,
      isPrecededByCoefficient: curr.type === "VARIABLE" && prev?.type === "CONSTANT",
    });
  }
  return items;
}

function TermBlockItem({
  coeff,
  variable,
  side,
}: {
  coeff: Block;
  variable: Block;
  side: Side;
}) {
  const lastFailedMove = useGameStore((s) => s.lastFailedMove);
  const clearLastFailedMove = useGameStore((s) => s.clearLastFailedMove);
  const isFailed = lastFailedMove?.blockId === variable.id;
  const failedTs = lastFailedMove?.timestamp ?? 0;
  const prevFailedTs = useRef(0);

  const { setNodeRef, transform, isDragging, listeners, attributes } = useDraggable({
    id: variable.id,
    data: { blockId: variable.id, fromSide: side },
  });

  useEffect(() => {
    if (isFailed && failedTs !== prevFailedTs.current) {
      prevFailedTs.current = failedTs;
      const t = setTimeout(clearLastFailedMove, 400);
      return () => clearTimeout(t);
    }
  }, [isFailed, failedTs, clearLastFailedMove]);

  const style =
    transform && !isDragging
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={variable.id}
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
      {termLabel(coeff, variable)}
    </motion.div>
  );
}

function BlocksWithStaticContent({
  blocks,
  renderBlock,
}: {
  blocks: Block[];
  renderBlock: (block: Block, index: number, blocks: Block[]) => ReactNode;
}) {
  if (blocks.length === 0) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex w-full flex-1 items-center gap-2">
      {blocks.map((block, i) => (
        <span key={block.id} className="flex min-w-0 flex-1 items-center justify-center gap-1">
          {renderBlock(block, i, blocks)}
          {isCoefficientBeforeVariable(blocks, i) && (
            <span className="font-mono text-muted-foreground" aria-hidden>
              •
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ReadOnlyZones({ equation }: { equation: EquationState }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <div className="flex min-h-[52px] min-w-0 flex-1 flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-2">
        <BlocksWithStaticContent
          blocks={equation.leftSide}
          renderBlock={(b, i, blks) => (
            <StaticBlock
              key={b.id}
              block={b}
              isFirst={i === 0}
              isPrecededByCoefficient={b.type === "VARIABLE" && blks[i - 1]?.type === "CONSTANT"}
            />
          )}
        />
      </div>
      <span
        className="flex shrink-0 font-mono text-lg font-bold text-foreground"
        aria-hidden
      >
        =
      </span>
      <div className="flex min-h-[52px] min-w-0 flex-1 flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-2">
        <BlocksWithStaticContent
          blocks={equation.rightSide}
          renderBlock={(b, i, blks) => (
            <StaticBlock
              key={b.id}
              block={b}
              isFirst={i === 0}
              isPrecededByCoefficient={b.type === "VARIABLE" && blks[i - 1]?.type === "CONSTANT"}
            />
          )}
        />
      </div>
    </div>
  );
}

function DropZone({
  side,
  blocks,
  equation,
}: {
  side: Side;
  blocks: EquationState["leftSide"];
  equation: EquationState;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: side,
    data: { side },
  });

  const items = getRenderItems(blocks, side, equation);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[52px] min-w-0 flex-1 flex-wrap items-center gap-2 rounded-xl border border-dashed p-2 transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-border bg-muted/30"
      )}
    >
      {items.length === 0 ? (
        <span className="font-mono text-xs text-muted-foreground">—</span>
      ) : (
        items.map((item) => (
          <span
            key={item.kind === "term" ? item.variable.id : item.block.id}
            className="flex min-w-0 flex-1 items-center justify-center gap-1"
          >
            {item.kind === "term" ? (
              <TermBlockItem
                coeff={item.coeff}
                variable={item.variable}
                side={side}
              />
            ) : (
              <>
                <BlockItem
                  block={item.block}
                  side={side}
                  isFirst={item.isFirst}
                  isPrecededByCoefficient={item.isPrecededByCoefficient}
                />
                {item.kind === "single" &&
                  isCoefficientBeforeVariable(blocks, blocks.indexOf(item.block)) && (
                    <span className="font-mono text-muted-foreground" aria-hidden>
                      •
                    </span>
                  )}
              </>
            )}
          </span>
        ))
      )}
    </div>
  );
}

export interface EquationBarProps {
  equation: EquationState;
  readOnly?: boolean;
}

function findBlock(equation: EquationState, blockId: string): Block | null {
  const left = equation.leftSide.find((b) => b.id === blockId);
  if (left) return left;
  const right = equation.rightSide.find((b) => b.id === blockId);
  return right ?? null;
}

const DROP_ANIMATION_DURATION = 250;

export function EquationBar({ equation, readOnly = false }: EquationBarProps) {
  const applyMove = useGameStore((s) => s.applyMove);
  const [activeDrag, setActiveDrag] = useState<{
    block: Block;
    fromSide: Side;
  } | null>(null);
  const clearOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    return () => {
      if (clearOverlayTimeoutRef.current) {
        clearTimeout(clearOverlayTimeoutRef.current);
      }
    };
  }, []);

  function handleDragStart(event: DragStartEvent) {
    if (clearOverlayTimeoutRef.current) {
      clearTimeout(clearOverlayTimeoutRef.current);
      clearOverlayTimeoutRef.current = null;
    }
    const { active } = event;
    const blockId = String(active.id);
    const fromSide = active.data.current?.fromSide as Side | undefined;
    const block = findBlock(equation, blockId);
    if (block && fromSide) setActiveDrag({ block, fromSide });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const blockId = String(active.id);
    const fromSide = active.data.current?.fromSide as Side | undefined;

    if (!fromSide) {
      setActiveDrag(null);
      return;
    }
    let toSide: Side | null = null;
    if (over?.id === DROP_LEFT || over?.id === DROP_RIGHT) {
      toSide = over.id as Side;
    } else if (over?.id) {
      const overId = String(over.id);
      if (equation.leftSide.some((b) => b.id === overId)) toSide = "left";
      else if (equation.rightSide.some((b) => b.id === overId)) toSide = "right";
    }

    if (toSide === null) {
      setActiveDrag(null);
      return;
    }

    applyMove(blockId, fromSide, toSide);
    clearOverlayTimeoutRef.current = setTimeout(() => {
      setActiveDrag(null);
      clearOverlayTimeoutRef.current = null;
    }, DROP_ANIMATION_DURATION);
  }

  if (readOnly) {
    return <ReadOnlyZones equation={equation} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex w-full flex-wrap items-center gap-3">
        <DropZone side="left" blocks={equation.leftSide} equation={equation} />
        <span
          className="flex shrink-0 font-mono text-lg font-bold text-foreground"
          aria-hidden
        >
          =
        </span>
        <DropZone side="right" blocks={equation.rightSide} equation={equation} />
      </div>
      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeDrag ? (
          <DragOverlayBlock
            block={activeDrag.block}
            equation={equation}
            fromSide={activeDrag.fromSide}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
