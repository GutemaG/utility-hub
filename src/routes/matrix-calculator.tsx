import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pause,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { MatrixEditor } from "@/components/matrix-calculator/matrix-editor";
import { MatrixGrid } from "@/components/matrix-calculator/matrix-grid";
import { copyText } from "@/lib/clipboard";
import {
  addSubtractSteps,
  determinantSteps,
  formatNumber,
  inverseSteps,
  multiplySteps,
  resizeMatrix,
  rrefSteps,
  transposeSteps,
  validateOperation,
  type Cell,
  type EliminationStep,
  type ElementwiseStep,
  type Matrix,
  type MatrixOperation,
} from "@/lib/matrix-math";

export const Route = createFileRoute("/matrix-calculator")({
  component: RouteComponent,
});

const OPERATIONS: { key: MatrixOperation; label: string; needsB: boolean; symbol?: string }[] = [
  { key: "add", label: "A + B", needsB: true, symbol: "+" },
  { key: "subtract", label: "A − B", needsB: true, symbol: "−" },
  { key: "multiply", label: "A × B", needsB: true, symbol: "×" },
  { key: "transpose", label: "Aᵀ", needsB: false },
  { key: "determinant", label: "det(A)", needsB: false },
  { key: "inverse", label: "A⁻¹", needsB: false },
  { key: "rref", label: "RREF(A)", needsB: false },
];

const STEP_INTERVAL_MS = 1100;

type StepsState =
  | { kind: "elementwise"; steps: ElementwiseStep[] }
  | { kind: "elimination"; steps: EliminationStep[]; augmentedAt?: number };

interface ResultSummary {
  operation: MatrixOperation;
  matrix?: Matrix | null;
  determinant?: number;
  singular?: boolean;
  rank?: number;
}

function expandRowsToCells(rows: number[], cols: number): Cell[] {
  return rows.flatMap((row) => Array.from({ length: cols }, (_, col) => ({ row, col })));
}

function formatMatrixForCopy(matrix: Matrix): string {
  return matrix.map((row) => row.map((v) => formatNumber(v)).join("\t")).join("\n");
}

function RouteComponent() {
  useSEO({
    title: "Matrix Calculator | Utility Hub",
    description:
      "Add, subtract, multiply, transpose, and invert matrices with an animated, step-by-step walkthrough and live dimension validation.",
    path: "/matrix-calculator",
    keywords:
      "matrix calculator, matrix addition, matrix multiplication, determinant calculator, matrix inverse, rref, gauss jordan elimination",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Dynamic matrix sizing",
      "Animated step-by-step explanations",
      "Live dimension validation",
      "Determinant, inverse, and RREF via Gaussian elimination",
    ],
  });

  const [operation, setOperation] = useState<MatrixOperation>("add");
  const [matrixA, setMatrixA] = useState<Matrix>([
    [2, 1],
    [1, 3],
  ]);
  const [matrixB, setMatrixB] = useState<Matrix>([
    [1, 4],
    [2, 0],
  ]);
  const [resetSignalA, setResetSignalA] = useState(0);
  const [resetSignalB, setResetSignalB] = useState(0);

  const [stepsState, setStepsState] = useState<StepsState | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resultSummary, setResultSummary] = useState<ResultSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const currentOp = OPERATIONS.find((o) => o.key === operation)!;

  const validationError = useMemo(
    () =>
      validateOperation(
        operation,
        matrixA.length,
        matrixA[0]?.length ?? 0,
        matrixB.length,
        matrixB[0]?.length ?? 0
      ),
    [operation, matrixA, matrixB]
  );

  useEffect(() => {
    setStepsState(null);
    setStepIndex(0);
    setIsPlaying(false);
    setResultSummary(null);
    setCopied(false);
  }, [operation, matrixA, matrixB]);

  useEffect(() => {
    if (!isPlaying || !stepsState) return;
    if (stepIndex >= stepsState.steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, stepsState]);

  const handleCalculate = () => {
    if (validationError) return;

    switch (operation) {
      case "add":
      case "subtract": {
        const { steps, result } = addSubtractSteps(matrixA, matrixB, operation);
        setStepsState({ kind: "elementwise", steps });
        setResultSummary({ operation, matrix: result });
        break;
      }
      case "multiply": {
        const { steps, result } = multiplySteps(matrixA, matrixB);
        setStepsState({ kind: "elementwise", steps });
        setResultSummary({ operation, matrix: result });
        break;
      }
      case "transpose": {
        const { steps, result } = transposeSteps(matrixA);
        setStepsState({ kind: "elementwise", steps });
        setResultSummary({ operation, matrix: result });
        break;
      }
      case "determinant": {
        const { steps, determinant, singular } = determinantSteps(matrixA);
        setStepsState({ kind: "elimination", steps });
        setResultSummary({ operation, determinant, singular });
        break;
      }
      case "inverse": {
        const { steps, inverse, singular } = inverseSteps(matrixA);
        setStepsState({ kind: "elimination", steps, augmentedAt: matrixA.length });
        setResultSummary({ operation, matrix: inverse, singular });
        break;
      }
      case "rref": {
        const { steps, result, rank } = rrefSteps(matrixA);
        setStepsState({ kind: "elimination", steps });
        setResultSummary({ operation, matrix: result, rank });
        break;
      }
    }

    setStepIndex(0);
    setIsPlaying(true);
  };

  const handleSwap = () => {
    const nextA = matrixB;
    const nextB = matrixA;
    setMatrixA(nextA);
    setMatrixB(nextB);
    setResetSignalA((v) => v + 1);
    setResetSignalB((v) => v + 1);
  };

  const handleCopyResult = async () => {
    if (!resultSummary?.matrix) return;
    const didCopy = await copyText(formatMatrixForCopy(resultSummary.matrix));
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const totalSteps = stepsState?.steps.length ?? 0;
  const isAtStart = stepIndex <= 0;
  const isAtEnd = stepIndex >= totalSteps - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Matrix Calculator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Resize your matrices, pick an operation, and watch each step animate with a plain-language explanation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-2">
          {OPERATIONS.map((op) => (
            <Button
              key={op.key}
              type="button"
              size="sm"
              variant={operation === op.key ? "default" : "outline"}
              onClick={() => setOperation(op.key)}
            >
              {op.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-center gap-6">
          <MatrixEditor
            label="Matrix A"
            values={matrixA}
            resetSignal={resetSignalA}
            onChange={setMatrixA}
            onResize={(r, c) => setMatrixA((prev) => resizeMatrix(prev, r, c))}
          />

          {currentOp.needsB ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-8 shrink-0"
                onClick={handleSwap}
                title="Swap A and B"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              <MatrixEditor
                label="Matrix B"
                values={matrixB}
                resetSignal={resetSignalB}
                onChange={setMatrixB}
                onResize={(r, c) => setMatrixB((prev) => resizeMatrix(prev, r, c))}
              />
            </>
          ) : null}
        </div>

        {validationError ? (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-700 dark:text-amber-300">
            {validationError}
          </p>
        ) : (
          <div className="mt-4 flex justify-center">
            <Button type="button" onClick={handleCalculate}>
              Calculate & Animate
            </Button>
          </div>
        )}
      </div>

      {stepsState ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Step {stepIndex + 1} of {totalSteps}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex(0);
                  }}
                  title="Restart"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={isAtStart}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  onClick={() => setIsPlaying((p) => !p)}
                  disabled={isAtEnd && !isPlaying}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex((i) => Math.min(totalSteps - 1, i + 1));
                  }}
                  disabled={isAtEnd}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>

            <p
              key={stepIndex}
              className="animate-in fade-in slide-in-from-bottom-1 min-h-10 py-3 text-center text-sm font-medium text-foreground duration-300 sm:text-base"
            >
              {stepsState.steps[stepIndex].description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              {stepsState.kind === "elementwise" ? (
                <ElementwiseStepView
                  step={stepsState.steps[stepIndex] as ElementwiseStep}
                  matrixA={matrixA}
                  matrixB={matrixB}
                  showB={currentOp.needsB}
                  symbol={currentOp.symbol}
                />
              ) : (
                <EliminationStepView
                  step={stepsState.steps[stepIndex] as EliminationStep}
                  augmentedAt={stepsState.augmentedAt}
                />
              )}
            </div>
          </div>

          {resultSummary ? (
            <ResultCard summary={resultSummary} onCopy={handleCopyResult} copied={copied} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ElementwiseStepView({
  step,
  matrixA,
  matrixB,
  showB,
  symbol,
}: {
  step: ElementwiseStep;
  matrixA: Matrix;
  matrixB: Matrix;
  showB: boolean;
  symbol?: string;
}) {
  return (
    <>
      <MatrixGrid matrix={matrixA} label="A" highlightCells={step.highlightA} />
      {showB ? (
        <>
          <span className="text-xl font-semibold text-muted-foreground">{symbol}</span>
          <MatrixGrid matrix={matrixB} label="B" highlightCells={step.highlightB} />
        </>
      ) : null}
      <span className="text-xl font-semibold text-muted-foreground">=</span>
      <MatrixGrid matrix={step.result} label="Result" pulseCell={step.resultCell} tone="muted" />
    </>
  );
}

function EliminationStepView({ step, augmentedAt }: { step: EliminationStep; augmentedAt?: number }) {
  const cols = step.matrix[0]?.length ?? 0;
  const highlightCells = expandRowsToCells(step.highlightRows, cols);
  return (
    <MatrixGrid
      matrix={step.matrix}
      highlightCells={highlightCells}
      dividerAfterCol={augmentedAt !== undefined ? augmentedAt - 1 : undefined}
    />
  );
}

function ResultCard({
  summary,
  onCopy,
  copied,
}: {
  summary: ResultSummary;
  onCopy: () => void;
  copied: boolean;
}) {
  const isFailure = summary.operation === "inverse" && summary.singular;

  const gradient = isFailure
    ? "from-rose-500 to-orange-600 border-rose-600/30"
    : "from-emerald-500 to-teal-600 border-emerald-600/30";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-8 text-center text-white shadow-lg ${gradient}`}>
      {isFailure ? <XCircle className="mx-auto h-10 w-10" /> : <CheckCircle2 className="mx-auto h-10 w-10" />}

      {summary.operation === "determinant" ? (
        <>
          <p className="mt-3 text-4xl font-bold tracking-tight">det(A) = {formatNumber(summary.determinant ?? null)}</p>
          <p className="mt-2 text-sm opacity-90">
            {summary.singular
              ? "The determinant is 0, so this matrix is singular and has no inverse."
              : "Nonzero determinant — this matrix is invertible."}
          </p>
        </>
      ) : summary.operation === "inverse" && summary.singular ? (
        <p className="mt-3 text-lg font-semibold">Matrix A is singular — no inverse exists.</p>
      ) : (
        <>
          <p className="mt-2 text-lg font-semibold">
            {summary.operation === "rref" ? `Reduced Row Echelon Form (rank ${summary.rank})` : "Final Result"}
          </p>
          <div className="mt-4 flex justify-center">
            {summary.matrix ? <MatrixGrid matrix={summary.matrix} /> : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onCopy}
            className="mt-4 bg-white/15 text-white hover:bg-white/25"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy result"}
          </Button>
        </>
      )}
    </div>
  );
}
