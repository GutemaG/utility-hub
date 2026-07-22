import { useEffect, useState } from "react";
import { Minus, Plus, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Matrix } from "@/lib/matrix-math";

const MIN_SIZE = 1;
const MAX_SIZE = 6;

interface MatrixEditorProps {
  label: string;
  values: Matrix;
  resetSignal: number;
  onChange: (matrix: Matrix) => void;
  onResize: (rows: number, cols: number) => void;
}

export function MatrixEditor({ label, values, resetSignal, onChange, onResize }: MatrixEditorProps) {
  const rows = values.length;
  const cols = values[0]?.length ?? 0;

  const [text, setText] = useState<string[][]>(() => values.map((row) => row.map((v) => String(v))));

  useEffect(() => {
    setText(values.map((row) => row.map((v) => String(v))));
    // Resync only on structural changes (dimensions) or explicit reset actions, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, resetSignal]);

  const handleCellChange = (i: number, j: number, raw: string) => {
    const nextText = text.map((row) => [...row]);
    nextText[i][j] = raw;
    setText(nextText);

    const parsed = Number(raw);
    const nextValues = values.map((row) => [...row]);
    nextValues[i][j] = raw.trim() === "" || !Number.isFinite(parsed) ? 0 : parsed;
    onChange(nextValues);
  };

  const randomize = () => {
    const next = values.map((row) => row.map(() => Math.floor(Math.random() * 19) - 9));
    setText(next.map((row) => row.map((v) => String(v))));
    onChange(next);
  };

  const clear = () => {
    const next = values.map((row) => row.map(() => 0));
    setText(next.map((row) => row.map((v) => String(v))));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={randomize} title="Randomize values">
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clear} title="Clear values">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <DimensionStepper
          label="Rows"
          value={rows}
          onChange={(nextRows) => onResize(nextRows, cols)}
        />
        <DimensionStepper
          label="Cols"
          value={cols}
          onChange={(nextCols) => onResize(rows, nextCols)}
        />
      </div>

      <div className="inline-grid overflow-hidden rounded-md border border-input bg-background">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {text.map((row, i) =>
            row.map((cellText, j) => (
              <input
                key={`${i}-${j}`}
                type="number"
                value={cellText}
                onChange={(e) => handleCellChange(i, j, e.target.value)}
                className={`h-10 w-14 border-input bg-background text-center font-mono text-sm text-foreground focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring sm:h-11 sm:w-16 ${
                  j < cols - 1 ? "border-r" : ""
                } ${i < rows - 1 ? "border-b" : ""}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DimensionStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => onChange(Math.max(MIN_SIZE, value - 1))}
        disabled={value <= MIN_SIZE}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-4 text-center font-mono text-foreground">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => onChange(Math.min(MAX_SIZE, value + 1))}
        disabled={value >= MAX_SIZE}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
