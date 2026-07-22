import { formatNumber, type Cell } from "@/lib/matrix-math";
import { cn } from "@/lib/utils";

interface MatrixGridProps {
  matrix: (number | null)[][];
  label?: string;
  highlightCells?: Cell[];
  pulseCell?: Cell | null;
  dividerAfterCol?: number;
  tone?: "default" | "muted";
}

function isCellIn(cells: Cell[] | undefined, row: number, col: number): boolean {
  return Boolean(cells?.some((cell) => cell.row === row && cell.col === col));
}

export function MatrixGrid({
  matrix,
  label,
  highlightCells,
  pulseCell,
  dividerAfterCol,
  tone = "default",
}: MatrixGridProps) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      {label ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p> : null}
      <div
        className={cn(
          "grid gap-1 rounded-lg border border-border p-2",
          tone === "muted" ? "bg-muted/40" : "bg-card"
        )}
        style={{ gridTemplateColumns: `repeat(${matrix[0]?.length ?? 1}, minmax(0, 1fr))` }}
      >
        {matrix.map((row, i) =>
          row.map((value, j) => {
            const isHighlighted = isCellIn(highlightCells, i, j);
            const isPulsing = pulseCell?.row === i && pulseCell?.col === j;
            return (
              <div
                key={`${i}-${j}`}
                className={cn(
                  "flex h-10 w-14 items-center justify-center rounded-md border font-mono text-sm transition-all duration-300 sm:h-11 sm:w-16",
                  dividerAfterCol !== undefined && j === dividerAfterCol ? "mr-1.5 border-r-2 border-r-border" : "",
                  isPulsing
                    ? "scale-105 border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300"
                    : isHighlighted
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background",
                  value === null ? "text-muted-foreground/50" : "text-foreground"
                )}
              >
                {formatNumber(value)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
