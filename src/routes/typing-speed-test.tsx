import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip, Panel, Stat, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { randomBelow } from "@/lib/random";
import { AMHARIC_WORDS, ENGLISH_WORDS, buildWords } from "@/lib/typing-words";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/typing-speed-test")({
  component: RouteComponent,
});

type Lang = "en" | "am";
type Result = { date: number; wpm: number; raw: number; accuracy: number; duration: number; lang: Lang };

const DURATIONS = [15, 30, 60, 120];
const HISTORY_KEY = "utility-hub:typing-history:v1";
const BATCH = 200;

function loadHistory(): Result[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function wordStats(typed: string[], words: string[]) {
  let correctChars = 0; // chars in correctly typed words, plus their spaces
  let allChars = 0;
  let matched = 0;
  let compared = 0;
  let correctWords = 0;
  typed.forEach((t, i) => {
    const target = words[i] ?? "";
    const a = [...t];
    const b = [...target];
    allChars += a.length + 1;
    if (t === target) {
      correctWords++;
      correctChars += b.length + 1;
    }
    const len = Math.max(a.length, b.length);
    compared += len;
    for (let k = 0; k < len; k++) if (a[k] !== undefined && a[k] === b[k]) matched++;
  });
  return { correctChars, allChars, matched, compared, correctWords };
}

function RouteComponent() {
  const [lang, setLang] = useState<Lang>("en");
  const [duration, setDuration] = useState(60);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [typed, setTyped] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>(loadHistory);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const composing = useRef(false);
  const [offset, setOffset] = useState(0);

  useSEO({
    title: "Typing Speed Test (English & Amharic) | Utility Hub",
    description:
      "Test your typing speed in words per minute (WPM) and accuracy. 15, 30, 60 or 120 second tests in English or Amharic, with punctuation and numbers modes and your personal best.",
    path: "/typing-speed-test",
    keywords: "typing test, typing speed test, wpm test, words per minute, amharic typing test, typing practice, keyboard speed test",
    applicationCategory: "EducationalApplication",
    featureList: [
      "Words per minute, raw speed and accuracy",
      "15, 30, 60 and 120 second tests",
      "English and Amharic word lists",
      "Punctuation and numbers modes",
      "Personal best and recent results",
    ],
  });

  const source = lang === "am" ? AMHARIC_WORDS : ENGLISH_WORDS;
  const opts = useMemo(() => ({ punctuation: punctuation && lang === "en", numbers: numbers && lang === "en" }), [punctuation, numbers, lang]);

  const restart = useCallback(() => {
    setWords(buildWords(source, BATCH, opts, randomBelow));
    setTyped([]);
    setCurrent("");
    setStartedAt(null);
    setResult(null);
    setOffset(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [source, opts]);

  useEffect(() => {
    restart();
  }, [restart, duration]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {
      /* storage unavailable */
    }
  }, [history]);

  const running = startedAt !== null && !result;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsed = startedAt ? Math.min((now - startedAt) / 1000, duration) : 0;
  const remaining = Math.max(0, Math.ceil(duration - elapsed));

  const finish = useCallback(() => {
    if (!startedAt) return;
    // Count the word in progress if it is already correct, so the last second isn't lost.
    const all = current && words[typed.length]?.startsWith(current) ? [...typed, current] : typed;
    const stats = wordStats(all, words);
    const minutes = duration / 60;
    const r: Result = {
      date: Date.now(),
      wpm: Math.round(stats.correctChars / 5 / minutes),
      raw: Math.round(stats.allChars / 5 / minutes),
      accuracy: stats.compared ? Math.round((stats.matched / stats.compared) * 1000) / 10 : 0,
      duration,
      lang,
    };
    setResult(r);
    setHistory((h) => [r, ...h]);
    inputRef.current?.blur();
  }, [startedAt, current, typed, words, duration, lang]);

  useEffect(() => {
    if (running && elapsed >= duration) finish();
  }, [running, elapsed, duration, finish]);

  const commit = (value: string) => {
    const word = value.trim();
    if (!word) return;
    setTyped((t) => [...t, word]);
    setCurrent("");
    if (typed.length + 20 > words.length) setWords((w) => [...w, ...buildWords(source, BATCH, opts, randomBelow)]);
  };

  const onChange = (value: string) => {
    if (result) return;
    if (!startedAt && value.trim()) {
      setStartedAt(Date.now());
      setNow(Date.now());
    }
    if (!composing.current && /\s$/.test(value)) {
      commit(value);
      return;
    }
    setCurrent(value.replace(/^\s+/, ""));
  };

  // Keep the active word on the second visible line.
  useLayoutEffect(() => {
    const el = currentRef.current;
    if (!el) return;
    const line = el.offsetHeight;
    setOffset(Math.max(0, el.offsetTop - line));
  }, [typed.length, words]);

  // Typing anywhere on the page focuses the test.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  const live = useMemo(() => {
    if (!startedAt || elapsed < 1) return null;
    const s = wordStats(typed, words);
    return Math.round(s.correctChars / 5 / (elapsed / 60));
  }, [typed, words, startedAt, elapsed]);

  const best = history.filter((h) => h.lang === lang && h.duration === duration).reduce((m, h) => Math.max(m, h.wpm), 0);
  const target = words[typed.length] ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Typing Speed Test" subtitle="How fast can you type? Start typing to begin the test." />

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <div className="flex gap-1.5">
          <Chip active={lang === "en"} onClick={() => setLang("en")}>
            English
          </Chip>
          <Chip active={lang === "am"} onClick={() => setLang("am")}>
            አማርኛ
          </Chip>
        </div>
        <div className="flex gap-1.5">
          {DURATIONS.map((d) => (
            <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
              {d}s
            </Chip>
          ))}
        </div>
        {lang === "en" ? (
          <div className="flex gap-1.5">
            <Chip active={punctuation} onClick={() => setPunctuation((p) => !p)}>
              Punctuation
            </Chip>
            <Chip active={numbers} onClick={() => setNumbers((n) => !n)}>
              Numbers
            </Chip>
          </div>
        ) : null}
      </div>

      {result ? (
        <Panel className="space-y-4 text-center">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Words per minute" value={<span data-testid="wpm">{result.wpm}</span>} highlight />
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
            <Stat label="Raw speed" value={`${result.raw} wpm`} sub="including mistakes" />
            <Stat label="Personal best" value={`${Math.max(best, result.wpm)} wpm`} sub={`${duration}s ${lang === "am" ? "Amharic" : "English"}`} />
          </div>
          <p className="text-sm text-muted-foreground">{verdict(result.wpm, lang)}</p>
          <Button onClick={restart} size="lg">
            <RotateCcw className="size-4" /> Try again
          </Button>
        </Panel>
      ) : (
        <Panel className="relative space-y-3">
          <div className="flex items-center justify-between text-lg font-semibold tabular-nums">
            <span className="text-blue-600 dark:text-blue-400" data-testid="time-left">
              {remaining}s
            </span>
            <span className="text-muted-foreground">{live !== null ? `${live} wpm` : best ? `Best ${best} wpm` : ""}</span>
          </div>
          <div
            ref={boxRef}
            onClick={() => inputRef.current?.focus()}
            className={cn(
              "relative h-[7.5rem] cursor-text overflow-hidden text-2xl leading-10",
              lang === "en" ? "font-mono" : "font-sans"
            )}
          >
            <div className="flex flex-wrap gap-x-3 transition-transform duration-150" style={{ transform: `translateY(-${offset}px)` }} data-testid="words">
              {words.map((w, i) => {
                if (i < typed.length) {
                  return (
                    <span key={i} className={typed[i] === w ? "text-foreground/70" : "text-red-500 underline decoration-red-500/60"}>
                      {w}
                    </span>
                  );
                }
                if (i === typed.length) {
                  return (
                    <span key={i} ref={currentRef} className="relative">
                      <ActiveWord target={w} typed={current} showCaret={focused} />
                    </span>
                  );
                }
                return (
                  <span key={i} className="text-muted-foreground/60">
                    {w}
                  </span>
                );
              })}
            </div>
            {!focused ? (
              <div className="absolute inset-0 grid place-items-center bg-card/70 text-base font-medium text-muted-foreground backdrop-blur-[2px]">
                Click here or press any key to focus
              </div>
            ) : null}
          </div>
          <input
            ref={inputRef}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            onCompositionStart={() => (composing.current = true)}
            onCompositionEnd={(e) => {
              composing.current = false;
              onChange((e.target as HTMLInputElement).value);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || (e.key === "Tab" && !e.shiftKey)) {
                e.preventDefault();
                restart();
              }
            }}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label={`Type the word ${target}`}
            className="absolute size-px opacity-0"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tab or Esc restarts. {lang === "am" ? "Use an Amharic keyboard (e.g. Keyman or Google Input Tools)." : ""}</span>
            <Button variant="ghost" size="sm" onClick={restart}>
              <RotateCcw className="size-4" /> Restart
            </Button>
          </div>
        </Panel>
      )}

      {history.length ? (
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent results</h2>
            <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
              Clear
            </Button>
          </div>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-medium">When</th>
                <th className="py-1 font-medium">Test</th>
                <th className="py-1 text-right font-medium">WPM</th>
                <th className="py-1 text-right font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((h) => (
                <tr key={h.date} className="border-t border-border">
                  <td className="py-1.5">{new Date(h.date).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="py-1.5">
                    {h.duration}s {h.lang === "am" ? "Amharic" : "English"}
                  </td>
                  <td className="py-1.5 text-right font-semibold">{h.wpm}</td>
                  <td className="py-1.5 text-right">{h.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="text-sm font-semibold">How the score is calculated</h2>
        <p className="text-sm text-muted-foreground">
          A “word” is any 5 characters, including spaces. WPM counts only words you typed correctly; raw speed counts everything you
          typed. Accuracy compares each character you typed with the expected text. The average typist manages about 40 wpm; 60+ is
          fast and 90+ is excellent.
        </p>
      </Panel>
    </div>
  );
}

function ActiveWord({ target, typed, showCaret }: { target: string; typed: string; showCaret: boolean }) {
  const t = [...target];
  const a = [...typed];
  const caret = showCaret ? <span className="absolute -ml-px inline-block h-8 w-0.5 translate-y-1 animate-pulse bg-blue-600" /> : null;
  return (
    <>
      {t.map((ch, k) => (
        <span key={k} className={k < a.length ? (a[k] === ch ? "text-foreground" : "text-red-500") : "text-muted-foreground/60"}>
          {k === a.length ? caret : null}
          {ch}
        </span>
      ))}
      {a.slice(t.length).map((ch, k) => (
        <span key={`x${k}`} className="text-red-700/80">
          {ch}
        </span>
      ))}
      {a.length >= t.length ? caret : null}
    </>
  );
}

function verdict(wpm: number, lang: Lang) {
  if (lang === "am") return wpm >= 30 ? "Excellent Amharic typing speed!" : wpm >= 15 ? "Good speed. Keep practising!" : "Keep practising and you'll get faster.";
  if (wpm >= 90) return "Excellent! That's faster than almost everyone.";
  if (wpm >= 60) return "Fast! Well above the average typist.";
  if (wpm >= 40) return "Good. That's around the average typing speed.";
  return "Keep practising: most people reach 40 wpm with a little practice.";
}
