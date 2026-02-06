/**
 * FR4: Progress bar for session score.
 */
export interface ProgressBarProps {
  score: number;
  max?: number;
  /** Optional label, e.g. "3 / 10" */
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  score,
  max = 10,
  showLabel = true,
  className = "",
}: ProgressBarProps) {
  const value = Math.min(Math.max(0, score), max);
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={`flex w-full flex-col gap-1 ${className}`.trim()}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="Progreso de la sesión"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {value} / {max}
        </span>
      )}
    </div>
  );
}
