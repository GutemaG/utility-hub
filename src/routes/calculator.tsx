import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Delete, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip, Panel, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { evaluate, formatResult, type AngleMode } from "@/lib/expression";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calculator")({
  component: RouteComponent,
});

type HistoryItem = { expr: string; result: string };
const HISTORY_KEY = "utility-hub:calculator-history:v1";

type Key = { label: string; insert?: string; action?: "clear" | "back" | "equals" | "ans"; kind?: "num" | "op" | "fn" | "eq" };

const BASIC: Key[] = [
  { label: "AC", action: "clear", kind: "op" },
  { label: "(", insert: "(", kind: "op" },
  { label: ")", insert: ")", kind: "op" },
  { label: "÷", insert: "÷", kind: "op" },
  { label: "7", insert: "7", kind: "num" },
  { label: "8", insert: "8", kind: "num" },
  { label: "9", insert: "9", kind: "num" },
  { label: "×", insert: "×", kind: "op" },
  { label: "4", insert: "4", kind: "num" },
  { label: "5", insert: "5", kind: "num" },
  { label: "6", insert: "6", kind: "num" },
  { label: "−", insert: "-", kind: "op" },
  { label: "1", insert: "1", kind: "num" },
  { label: "2", insert: "2", kind: "num" },
  { label: "3", insert: "3", kind: "num" },
  { label: "+", insert: "+", kind: "op" },
  { label: "0", insert: "0", kind: "num" },
  { label: ".", insert: ".", kind: "num" },
  { label: "⌫", action: "back", kind: "op" },
  { label: "=", action: "equals", kind: "eq" },
];

const SCIENTIFIC: Key[] = [
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "π", insert: "π" },
  { label: "sin⁻¹", insert: "asin(" },
  { label: "cos⁻¹", insert: "acos(" },
  { label: "tan⁻¹", insert: "atan(" },
  { label: "e", insert: "e" },
  { label: "ln", insert: "ln(" },
  { label: "log", insert: "log(" },
  { label: "√", insert: "√(" },
  { label: "∛", insert: "cbrt(" },
  { label: "x²", insert: "^2" },
  { label: "xʸ", insert: "^" },
  { label: "10ˣ", insert: "10^" },
  { label: "eˣ", insert: "exp(" },
  { label: "x!", insert: "!" },
  { label: "%", insert: "%" },
  { label: "1/x", insert: "^(-1)" },
  { label: "|x|", insert: "abs(" },
  { label: "mod", insert: " mod " },
  { label: "nCr", insert: "nCr(" },
  { label: ",", insert: "," },
  { label: "Ans", action: "ans" },
];

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function RouteComponent() {
  const [expr, setExpr] = useState("");
  const [angle, setAngle] = useState<AngleMode>("deg");
  const [ans, setAns] = useState(0);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [showSci, setShowSci] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: "Online Calculator: Scientific Calculator with History | Utility Hub",
    description:
      "Free online scientific calculator with trig, logs, powers, roots, factorials, percentages and calculation history. Type with your keyboard or tap the keys.",
    path: "/calculator",
    keywords: "calculator, online calculator, scientific calculator, free calculator, calculator with history, math calculator",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Basic and scientific keypads",
      "Degrees and radians",
      "Live result preview while typing",
      "Calculation history saved on your device",
      "Full keyboard support",
    ],
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    } catch {
      /* storage unavailable */
    }
  }, [history]);

  const preview = useMemo(() => {
    if (!expr.trim()) return "";
    try {
      return formatResult(evaluate(expr, { angle, ans }));
    } catch {
      return "";
    }
  }, [expr, angle, ans]);

  const focus = () => inputRef.current?.focus({ preventScroll: true });

  const insert = (text: string) => {
    setError("");
    const el = inputRef.current;
    // After "=", typing a number starts fresh; typing an operator continues from the result.
    const base = justEvaluated && /^[0-9.(√πa-z]/i.test(text) && !text.startsWith(" mod") ? "" : expr;
    const start = justEvaluated || !el ? base.length : (el.selectionStart ?? base.length);
    const end = justEvaluated || !el ? base.length : (el.selectionEnd ?? base.length);
    const next = base.slice(0, start) + text + base.slice(end);
    setExpr(next);
    setJustEvaluated(false);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus({ preventScroll: true });
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const equals = () => {
    if (!expr.trim()) return;
    try {
      const value = evaluate(expr, { angle, ans });
      const shown = formatResult(value);
      setHistory((h) => [{ expr, result: shown }, ...h].slice(0, 100));
      setAns(value);
      setExpr(Number.isFinite(value) ? shown : "");
      setJustEvaluated(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid expression");
    }
    focus();
  };

  const press = (key: Key) => {
    if (key.action === "clear") {
      setExpr("");
      setError("");
      setJustEvaluated(false);
      focus();
    } else if (key.action === "back") {
      setExpr((e) => e.slice(0, -1));
      setJustEvaluated(false);
      focus();
    } else if (key.action === "equals") equals();
    else if (key.action === "ans") insert("Ans");
    else if (key.insert) insert(key.insert);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Calculator" subtitle="A scientific calculator with live results and history. Type with your keyboard or use the keys." />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Panel className="space-y-3">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{angle === "deg" ? "DEG" : "RAD"}</span>
              <span className="truncate pl-2">Ans = {formatResult(ans)}</span>
            </div>
            <input
              ref={inputRef}
              value={expr}
              onChange={(e) => {
                setExpr(e.target.value);
                setJustEvaluated(false);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "=") {
                  e.preventDefault();
                  equals();
                } else if (e.key === "Escape") {
                  setExpr("");
                  setError("");
                }
              }}
              inputMode="none"
              aria-label="Expression"
              placeholder="0"
              className="w-full bg-transparent text-right font-mono text-3xl outline-none placeholder:text-muted-foreground sm:text-4xl"
              autoFocus
            />
            <div className="h-6 text-right font-mono text-lg text-muted-foreground" data-testid="calc-preview">
              {error ? <span className="text-sm text-red-600">{error}</span> : preview && preview !== expr ? `= ${preview}` : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Chip active={angle === "deg"} onClick={() => setAngle("deg")}>
                Deg
              </Chip>
              <Chip active={angle === "rad"} onClick={() => setAngle("rad")}>
                Rad
              </Chip>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSci((s) => !s)}>
              {showSci ? "Basic" : "Scientific"}
            </Button>
          </div>
          <div className={cn("grid gap-3", showSci && "md:grid-cols-[1.2fr_1fr]")}>
            {showSci ? (
              <div className="grid grid-cols-4 content-start gap-1.5">
                {SCIENTIFIC.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => press(k)}
                    className="h-11 rounded-md bg-muted text-sm font-medium transition hover:bg-accent active:scale-95"
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-4 gap-1.5">
              {BASIC.map((k) => (
                <button
                  key={k.label}
                  onClick={() => press(k)}
                  aria-label={k.label === "⌫" ? "Backspace" : k.label}
                  className={cn(
                    "h-12 rounded-md text-lg font-semibold transition active:scale-95 sm:h-14",
                    k.kind === "num" && "border border-border bg-background hover:bg-accent",
                    k.kind === "op" && "bg-muted text-blue-700 hover:bg-accent dark:text-blue-300",
                    k.kind === "eq" && "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {k.label === "⌫" ? <Delete className="mx-auto size-5" /> : k.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>
        <Panel className="flex max-h-[560px] flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">History</h2>
            {history.length ? (
              <Button variant="ghost" size="sm" onClick={() => setHistory([])} aria-label="Clear history">
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
          {history.length ? (
            <ul className="-mx-2 flex-1 space-y-1 overflow-auto">
              {history.map((h, i) => (
                <li key={i}>
                  <button
                    className="w-full rounded-md px-2 py-1.5 text-right hover:bg-accent/60"
                    onClick={() => {
                      setExpr(h.expr);
                      setJustEvaluated(false);
                      focus();
                    }}
                    title="Use this expression"
                  >
                    <div className="truncate font-mono text-xs text-muted-foreground">{h.expr}</div>
                    <div className="truncate font-mono font-semibold">= {h.result}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Your calculations will appear here.</p>
          )}
        </Panel>
      </div>
      <Panel>
        <h2 className="text-sm font-semibold">Tips</h2>
        <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>
            <code>2π</code>, <code>3(4+1)</code>: multiplication can be implied
          </li>
          <li>
            <code>2^10</code> powers, <code>5!</code> factorial, <code>√(16)</code> roots
          </li>
          <li>
            <code>log(100)</code> base 10, <code>ln(e)</code> natural log, <code>log(8, 2)</code> any base
          </li>
          <li>
            <code>15%</code> means 0.15, so <code>200×15%</code> = 30
          </li>
          <li>Enter evaluates, Esc clears, click a history entry to reuse it</li>
        </ul>
        <h2 className="pt-2 text-sm font-semibold">How some keys work</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium">mod: remainder after division</dt>
            <dd className="text-muted-foreground">
              <code>17 mod 5</code> = 2, because 17 ÷ 5 = 3 with 2 left over (5 × 3 = 15, 17 − 15 = 2). Handy for checking even/odd
              (<code>n mod 2</code>) or leftovers when splitting items into groups.
            </dd>
          </div>
          <div>
            <dt className="font-medium">nCr: combinations (order doesn't matter)</dt>
            <dd className="text-muted-foreground">
              <code>nCr(5,2)</code> = 10: the number of ways to choose 2 people from 5 for a team. Formula n! ÷ (r! × (n − r)!). Type{" "}
              <code>nCr(</code>, then n, a comma, then r. For ordered arrangements use <code>nPr(5,2)</code> = 20.
            </dd>
          </div>
          <div>
            <dt className="font-medium">sin⁻¹, cos⁻¹, tan⁻¹: inverse trig (find the angle)</dt>
            <dd className="text-muted-foreground">
              They undo sin, cos and tan: <code>sin⁻¹(0.5)</code> = 30 in Deg mode (0.5236 in Rad), because sin(30°) = 0.5. sin⁻¹ and
              cos⁻¹ only accept values from −1 to 1. Typed as <code>asin(</code>, <code>acos(</code>, <code>atan(</code>.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Deg / Rad: angle unit</dt>
            <dd className="text-muted-foreground">
              Deg uses degrees (a full turn is 360), Rad uses radians (a full turn is 2π). <code>sin(90)</code> = 1 in Deg, but in Rad
              you'd write <code>sin(π/2)</code>.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Ans: last answer</dt>
            <dd className="text-muted-foreground">
              Reuses the previous result, e.g. after 12 × 3 = 36, <code>Ans ÷ 4</code> = 9.
            </dd>
          </div>
          <div>
            <dt className="font-medium">x!: factorial</dt>
            <dd className="text-muted-foreground">
              <code>5!</code> = 5 × 4 × 3 × 2 × 1 = 120. The number of ways to arrange 5 different things in a row.
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
