import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, RotateCcw, Shuffle, SortAsc, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Chip, Field, Panel, Stat, Tabs, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { randomBelow, randomFloat, randomInt, shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/random-tools")({
  component: RouteComponent,
});

type Tab = "wheel" | "coin" | "dice" | "number" | "list";

const TABS: { value: Tab; label: string }[] = [
  { value: "wheel", label: "Spin the Wheel" },
  { value: "coin", label: "Flip a Coin" },
  { value: "dice", label: "Roll Dice" },
  { value: "number", label: "Random Number" },
  { value: "list", label: "Shuffle & Teams" },
];

function RouteComponent() {
  const [tab, setTab] = useState<Tab>("wheel");

  useSEO({
    title: "Random Picker: Spin the Wheel, Flip a Coin, Roll Dice, Random Number | Utility Hub",
    description:
      "Free random tools: spin a wheel of names, flip a coin, roll dice (d4–d100), generate random numbers, shuffle a list or split people into teams. Uses your browser's secure random generator.",
    path: "/random-tools",
    keywords:
      "spin the wheel, wheel of names, random name picker, flip a coin, coin toss, dice roller, roll a die, random number generator, team generator, shuffle list",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Wheel of names with remove-winner mode",
      "Coin flip with running tally",
      "Dice roller for d4, d6, d8, d10, d12, d20 and d100",
      "Random numbers with ranges, no-repeat and decimals",
      "List shuffler, winner picker and team generator",
    ],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader
        title="Random Picker"
        subtitle="Spin a wheel, flip a coin, roll dice, pick numbers or split a list into teams. Fair and private: every pick uses your device's secure random generator."
      />
      <Tabs value={tab} onChange={setTab} options={TABS} />
      {tab === "wheel" && <WheelTool />}
      {tab === "coin" && <CoinTool />}
      {tab === "dice" && <DiceTool />}
      {tab === "number" && <NumberTool />}
      {tab === "list" && <ListTool />}
    </div>
  );
}

/* ---------------------------------------------------------------- Wheel -- */

const WHEEL_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6"];
const WHEEL_KEY = "utility-hub:wheel-entries:v1";
const DEFAULT_ENTRIES = "Abebe\nSara\nDawit\nHana\nYonas\nMeron\nSamuel\nLiya";
const SPIN_MS = 5200;

function loadEntries(): string {
  try {
    return localStorage.getItem(WHEEL_KEY) ?? DEFAULT_ENTRIES;
  } catch {
    return DEFAULT_ENTRIES;
  }
}

function point(angleDeg: number, r = 1) {
  const rad = (angleDeg * Math.PI) / 180;
  return [Math.sin(rad) * r, -Math.cos(rad) * r] as const;
}

function WheelTool() {
  const [text, setText] = useState(loadEntries);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [removeWinner, setRemoveWinner] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const entries = useMemo(
    () =>
      text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 500),
    [text]
  );

  useEffect(() => {
    try {
      localStorage.setItem(WHEEL_KEY, text);
    } catch {
      /* storage unavailable */
    }
  }, [text]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const spin = () => {
    if (spinning || entries.length < 2) return;
    const n = entries.length;
    const seg = 360 / n;
    const index = randomBelow(n);
    const target = index * seg + seg * (0.15 + 0.7 * randomFloat());
    const current = rotation - (rotation % 360);
    const next = current + 360 * (6 + randomBelow(3)) + ((360 - target) % 360);
    setWinner(null);
    setSpinning(true);
    setRotation(next);
    const picked = entries[index];
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setWinner(picked);
      setHistory((h) => [picked, ...h].slice(0, 50));
    }, SPIN_MS);
  };

  const dropWinner = () => {
    if (!winner) return;
    const lines = text.split("\n");
    const i = lines.findIndex((l) => l.trim() === winner);
    if (i >= 0) lines.splice(i, 1);
    setText(lines.join("\n"));
    setWinner(null);
  };

  useEffect(() => {
    if (winner && removeWinner) {
      const id = window.setTimeout(dropWinner, 1800);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, removeWinner]);

  const n = entries.length;
  const seg = 360 / Math.max(n, 1);
  const fontSize = n <= 8 ? 0.09 : n <= 16 ? 0.07 : n <= 32 ? 0.05 : 0.035;
  const maxChars = n <= 8 ? 14 : n <= 16 ? 16 : 20;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel className="flex flex-col items-center">
        <div className="relative w-full max-w-[520px]">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
            <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden>
              <path d="M17 40 L2 6 Q17 -4 32 6 Z" fill="#111827" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <button
            onClick={spin}
            disabled={spinning || n < 2}
            className="block w-full rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
            aria-label="Spin the wheel"
          >
            <svg
              viewBox="-1.05 -1.05 2.1 2.1"
              className="w-full drop-shadow-lg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.6, 0.08, 1)` : "none",
              }}
            >
              <circle r="1.04" fill="#111827" />
              {n === 0 ? <circle r="1" fill="#e5e7eb" /> : null}
              {n === 1 ? <circle r="1" fill={WHEEL_COLORS[0]} /> : null}
              {n > 1 &&
                entries.map((_, i) => {
                  const [x1, y1] = point(i * seg);
                  const [x2, y2] = point((i + 1) * seg);
                  // Avoid the last slice sharing a colour with the first one.
                  const ci = i === n - 1 && i % WHEEL_COLORS.length === 0 ? 2 : i % WHEEL_COLORS.length;
                  const color = WHEEL_COLORS[ci];
                  return (
                    <path
                      key={i}
                      d={`M0 0 L${x1} ${y1} A1 1 0 ${seg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                      fill={color}
                      stroke="white"
                      strokeWidth="0.006"
                    />
                  );
                })}
              {entries.map((entry, i) => (
                <g key={i} transform={`rotate(${n === 1 ? 0 : i * seg + seg / 2 - 90})`}>
                  <text
                    x="0.92"
                    y="0"
                    textAnchor="end"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="600"
                    style={{ fontFamily: "system-ui, 'Noto Sans Ethiopic', sans-serif" }}
                  >
                    {entry.length > maxChars ? entry.slice(0, maxChars - 1) + "…" : entry}
                  </text>
                </g>
              ))}
              <circle r="0.12" fill="white" stroke="#111827" strokeWidth="0.02" />
            </svg>
          </button>
        </div>
        <Button size="lg" className="mt-4 min-w-40" onClick={spin} disabled={spinning || n < 2}>
          {spinning ? "Spinning…" : "Spin"}
        </Button>
        <div className="mt-4 h-16 text-center" aria-live="polite">
          {winner ? (
            <div>
              <div className="text-sm text-muted-foreground">We have a winner!</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{winner}</div>
            </div>
          ) : n < 2 ? (
            <div className="text-sm text-muted-foreground">Add at least two entries.</div>
          ) : null}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <Field label={`Entries (${n})`} hint="One per line. Duplicates get a bigger share of the wheel.">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} disabled={spinning} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={spinning} onClick={() => setText(shuffle(entries).join("\n"))}>
              <Shuffle className="size-4" /> Shuffle
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={spinning}
              onClick={() => setText([...entries].sort((a, b) => a.localeCompare(b)).join("\n"))}
            >
              <SortAsc className="size-4" /> Sort
            </Button>
            <Button variant="outline" size="sm" disabled={spinning} onClick={() => setText("")}>
              <Trash2 className="size-4" /> Clear
            </Button>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            Remove the winner after each spin
            <Switch checked={removeWinner} onCheckedChange={setRemoveWinner} />
          </label>
          {winner && !removeWinner ? (
            <Button variant="secondary" size="sm" onClick={dropWinner}>
              Remove “{winner}” from the wheel
            </Button>
          ) : null}
        </Panel>
        {history.length ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Results</h2>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                Clear
              </Button>
            </div>
            <ol className="max-h-56 space-y-1 overflow-auto text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-6 text-right text-muted-foreground">{history.length - i}.</span>
                  {h}
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Coin -- */

type Side = "H" | "T";

function CoinTool() {
  const [rotation, setRotation] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [last, setLast] = useState<Side | null>(null);
  const [tally, setTally] = useState({ H: 0, T: 0 });
  const [streak, setStreak] = useState<Side[]>([]);
  const [bulk, setBulk] = useState("10");
  const [bulkResult, setBulkResult] = useState<Side[] | null>(null);

  const flip = () => {
    if (flipping) return;
    const side: Side = randomBelow(2) === 0 ? "H" : "T";
    const base = rotation - (rotation % 360);
    setRotation(base + 360 * 5 + (side === "T" ? 180 : 0));
    setFlipping(true);
    setLast(null);
    window.setTimeout(() => {
      setFlipping(false);
      setLast(side);
      setTally((t) => ({ ...t, [side]: t[side] + 1 }));
      setStreak((s) => [side, ...s].slice(0, 30));
    }, 1600);
  };

  const flipMany = () => {
    const count = Math.min(Math.max(parseInt(bulk) || 1, 1), 10000);
    setBulkResult(Array.from({ length: count }, () => (randomBelow(2) === 0 ? "H" : "T")));
  };

  const total = tally.H + tally.T;
  const bulkHeads = bulkResult?.filter((s) => s === "H").length ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel className="flex flex-col items-center py-10">
        <div className="[perspective:1000px]">
          <button
            onClick={flip}
            aria-label="Flip the coin"
            className="relative block size-48 rounded-full focus:outline-none sm:size-56"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${rotation}deg)`,
              transition: flipping ? "transform 1.6s cubic-bezier(0.2, 0.7, 0.2, 1)" : "none",
            }}
          >
            <CoinFace label="HEADS" sub="ራስ" className="from-amber-300 to-amber-500" />
            <CoinFace label="TAILS" sub="ጅራት" className="from-slate-300 to-slate-500" back />
          </button>
        </div>
        <Button size="lg" className="mt-8 min-w-40" onClick={flip} disabled={flipping}>
          {flipping ? "Flipping…" : "Flip coin"}
        </Button>
        <div className="mt-4 h-10 text-2xl font-bold" aria-live="polite">
          {last ? (last === "H" ? "Heads!" : "Tails!") : null}
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Heads" value={tally.H} sub={total ? `${((tally.H / total) * 100).toFixed(1)}%` : undefined} />
            <Stat label="Tails" value={tally.T} sub={total ? `${((tally.T / total) * 100).toFixed(1)}%` : undefined} />
          </div>
          {streak.length ? (
            <div className="flex flex-wrap gap-1">
              {streak.map((s, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-bold",
                    s === "H" ? "bg-amber-400 text-amber-950" : "bg-slate-400 text-slate-950"
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTally({ H: 0, T: 0 });
              setStreak([]);
              setLast(null);
            }}
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
        </Panel>
        <Panel>
          <Field label="Flip many coins at once">
            <div className="flex gap-2">
              <Input type="number" min={1} max={10000} value={bulk} onChange={(e) => setBulk(e.target.value)} />
              <Button onClick={flipMany}>Flip</Button>
            </div>
          </Field>
          {bulkResult ? (
            <div className="space-y-2 text-sm">
              <div>
                <b>{bulkHeads}</b> heads · <b>{bulkResult.length - bulkHeads}</b> tails
              </div>
              {bulkResult.length <= 200 ? (
                <div className="break-all font-mono text-xs text-muted-foreground">{bulkResult.join(" ")}</div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function CoinFace({ label, sub, className, back }: { label: string; sub: string; className: string; back?: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-0 grid place-items-center rounded-full border-8 border-white/40 bg-gradient-to-br shadow-xl",
        className
      )}
      style={{ backfaceVisibility: "hidden", transform: back ? "rotateY(180deg)" : undefined }}
    >
      <span className="text-center">
        <span className="block text-3xl font-black tracking-widest text-black/70">{label}</span>
        <span className="block text-lg font-semibold text-black/50">{sub}</span>
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- Dice -- */

const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100];

function DiceTool() {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [values, setValues] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{ sides: number; values: number[] }[]>([]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    const final = Array.from({ length: count }, () => randomInt(1, sides));
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks++;
      setValues(Array.from({ length: count }, () => randomInt(1, sides)));
      if (ticks >= 8) {
        window.clearInterval(id);
        setValues(final);
        setRolling(false);
        setHistory((h) => [{ sides, values: final }, ...h].slice(0, 20));
      }
    }, 70);
  };

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Panel className="flex flex-col items-center py-8">
        <div className="flex min-h-36 flex-wrap items-center justify-center gap-4">
          {(values.length ? values : Array.from({ length: count }, () => 0)).map((v, i) =>
            sides === 6 ? <D6 key={i} value={v} rolling={rolling} /> : <DieN key={i} value={v} sides={sides} rolling={rolling} />
          )}
        </div>
        <Button size="lg" className="mt-6 min-w-40" onClick={roll} disabled={rolling}>
          {rolling ? "Rolling…" : `Roll ${count}d${sides}`}
        </Button>
        <div className="mt-4 h-10 text-2xl font-bold" aria-live="polite">
          {values.length && !rolling ? (count > 1 ? `Total: ${total}` : `You rolled ${values[0]}`) : null}
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel>
          <Field label="Number of dice">
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 8, 10].map((c) => (
                <Chip
                  key={c}
                  active={count === c}
                  onClick={() => {
                    setCount(c);
                    setValues([]);
                  }}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Sides">
            <div className="flex flex-wrap gap-1.5">
              {DIE_SIDES.map((s) => (
                <Chip
                  key={s}
                  active={sides === s}
                  onClick={() => {
                    setSides(s);
                    setValues([]);
                  }}
                >
                  d{s}
                </Chip>
              ))}
            </div>
          </Field>
        </Panel>
        {history.length ? (
          <Panel>
            <h2 className="text-sm font-semibold">History</h2>
            <ul className="max-h-56 space-y-1 overflow-auto text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {h.values.length}d{h.sides}: {h.values.join(", ")}
                  </span>
                  <b>{h.values.reduce((a, b) => a + b, 0)}</b>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function D6({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div
      className={cn(
        "grid size-20 grid-cols-3 grid-rows-3 gap-1 rounded-xl border-2 border-slate-300 bg-white p-2.5 shadow-md transition sm:size-24",
        rolling && "rotate-12 scale-95"
      )}
      aria-label={value ? `Die showing ${value}` : "Die"}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={cn("rounded-full", (PIPS[value] ?? []).includes(i) ? "bg-slate-900" : "")} />
      ))}
    </div>
  );
}

function DieN({ value, sides, rolling }: { value: number; sides: number; rolling: boolean }) {
  return (
    <div
      className={cn(
        "grid size-20 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-3xl font-black text-white shadow-md transition sm:size-24",
        rolling && "rotate-12 scale-95",
        sides === 4 && "[clip-path:polygon(50%_0,100%_100%,0_100%)] pt-6",
        sides === 20 && "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]"
      )}
    >
      {value || "?"}
    </div>
  );
}

/* --------------------------------------------------------------- Number -- */

function NumberTool() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(true);
  const [sorted, setSorted] = useState(false);
  const [decimals, setDecimals] = useState(0);
  const [result, setResult] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const lo = Number(min);
    const hi = Number(max);
    const n = Math.floor(Number(count));
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return setError("Enter a valid minimum and maximum.");
    if (lo > hi) return setError("The minimum must not be larger than the maximum.");
    if (!(n >= 1 && n <= 10000)) return setError("Choose between 1 and 10,000 numbers.");
    const scale = 10 ** decimals;
    const loI = Math.ceil(lo * scale);
    const hiI = Math.floor(hi * scale);
    const span = hiI - loI + 1;
    if (span < 1) return setError("No numbers fit in that range at this precision.");
    if (unique && n > span) return setError(`Only ${span.toLocaleString()} different numbers exist in that range.`);
    setError("");
    let out: number[];
    if (unique && n > span / 2 && span <= 1_000_000) {
      out = shuffle(Array.from({ length: span }, (_, i) => loI + i)).slice(0, n);
    } else if (unique) {
      const seen = new Set<number>();
      while (seen.size < n) seen.add(loI + randomBelow(span));
      out = [...seen];
    } else {
      out = Array.from({ length: n }, () => loI + randomBelow(span));
    }
    out = out.map((v) => v / scale);
    if (sorted) out.sort((a, b) => a - b);
    setResult(out);
    setCopied(false);
  };

  const formatted = result.map((v) => v.toFixed(decimals));

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Minimum">
          <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
        </Field>
        <Field label="Maximum">
          <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
        </Field>
        <Field label="How many numbers">
          <Input type="number" min={1} max={10000} value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <label className="flex items-center gap-2">
          <Switch checked={unique} onCheckedChange={setUnique} /> No repeats
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={sorted} onCheckedChange={setSorted} /> Sort results
        </label>
        <div className="flex items-center gap-2">
          Decimal places
          {[0, 1, 2, 3].map((d) => (
            <Chip key={d} active={decimals === d} onClick={() => setDecimals(d)} className="px-2 py-1">
              {d}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["1–10", "1", "10"],
          ["1–100", "1", "100"],
          ["1–1000", "1", "1000"],
          ["Lottery 1–49", "1", "49"],
        ].map(([label, a, b]) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            onClick={() => {
              setMin(a);
              setMax(b);
              if (label.startsWith("Lottery")) {
                setCount("6");
                setUnique(true);
                setSorted(true);
              }
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <Button size="lg" onClick={generate}>
        Generate
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result.length ? (
        <div className="space-y-3">
          {result.length === 1 ? (
            <div className="py-4 text-center text-6xl font-black tabular-nums text-blue-600 dark:text-blue-400" data-testid="random-result">
              {formatted[0]}
            </div>
          ) : (
            <div className="flex max-h-80 flex-wrap gap-1.5 overflow-auto" data-testid="random-result">
              {formatted.map((v, i) => (
                <span key={i} className="rounded-md bg-muted px-2 py-1 font-mono text-sm tabular-nums">
                  {v}
                </span>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => setCopied(await copyText(formatted.join(result.length > 1 ? ", " : "")))}
          >
            <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}

/* ----------------------------------------------------------------- List -- */

type ListMode = "pick" | "shuffle" | "teams";

function ListTool() {
  const [text, setText] = useState("Abebe\nSara\nDawit\nHana\nYonas\nMeron\nSamuel\nLiya\nBethel\nKaleb");
  const [mode, setMode] = useState<ListMode>("teams");
  const [pickCount, setPickCount] = useState("1");
  const [teamBy, setTeamBy] = useState<"count" | "size">("count");
  const [teamValue, setTeamValue] = useState("2");
  const [result, setResult] = useState<string[][] | null>(null);
  const [copied, setCopied] = useState(false);

  const items = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const run = () => {
    const mixed = shuffle(items);
    if (mode === "pick") {
      setResult([mixed.slice(0, Math.min(Math.max(parseInt(pickCount) || 1, 1), items.length))]);
    } else if (mode === "shuffle") {
      setResult([mixed]);
    } else {
      const v = Math.max(parseInt(teamValue) || 1, 1);
      const teams = teamBy === "count" ? Math.min(v, items.length) : Math.ceil(items.length / v);
      const out: string[][] = Array.from({ length: Math.max(teams, 1) }, () => []);
      mixed.forEach((item, i) => out[i % out.length].push(item));
      setResult(out);
    }
    setCopied(false);
  };

  const asText = (result ?? [])
    .map((group, i) => (mode === "teams" ? `Team ${i + 1}: ${group.join(", ")}` : group.join("\n")))
    .join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <Field label={`Names or items (${items.length})`} hint="One per line.">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} />
        </Field>
      </Panel>
      <Panel>
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m);
            setResult(null);
          }}
          options={[
            { value: "teams", label: "Make teams" },
            { value: "pick", label: "Pick winners" },
            { value: "shuffle", label: "Shuffle" },
          ]}
        />
        {mode === "pick" ? (
          <Field label="How many to pick">
            <Input type="number" min={1} value={pickCount} onChange={(e) => setPickCount(e.target.value)} />
          </Field>
        ) : null}
        {mode === "teams" ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1.5">
              <Chip active={teamBy === "count"} onClick={() => setTeamBy("count")}>
                Number of teams
              </Chip>
              <Chip active={teamBy === "size"} onClick={() => setTeamBy("size")}>
                People per team
              </Chip>
            </div>
            <Input
              type="number"
              min={1}
              className="w-24"
              value={teamValue}
              onChange={(e) => setTeamValue(e.target.value)}
              aria-label={teamBy === "count" ? "Number of teams" : "People per team"}
            />
          </div>
        ) : null}
        <Button onClick={run} disabled={!items.length}>
          {mode === "teams" ? "Generate teams" : mode === "pick" ? "Pick" : "Shuffle"}
        </Button>
        {result ? (
          <div className="space-y-3">
            {mode === "teams" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {result.map((team, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="mb-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Team {i + 1} <span className="font-normal text-muted-foreground">({team.length})</span>
                    </div>
                    <ul className="text-sm">
                      {team.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ol className="list-inside list-decimal space-y-1 text-lg font-medium">
                {result[0].map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            )}
            <Button variant="outline" size="sm" onClick={async () => setCopied(await copyText(asText))}>
              <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
