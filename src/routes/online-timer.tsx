import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, Flag, Maximize, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip, Field, Panel, Tabs, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/online-timer")({
  component: RouteComponent,
});

type Tab = "timer" | "stopwatch" | "countdown";

function RouteComponent() {
  const [tab, setTab] = useState<Tab>("timer");

  useSEO({
    title: "Online Timer, Stopwatch & Countdown | Utility Hub",
    description:
      "Free online timer with alarm, a stopwatch with laps, and a countdown to any date. Works full screen and keeps time correctly in background tabs.",
    path: "/online-timer",
    keywords:
      "timer, online timer, set a timer, 5 minute timer, 10 minute timer, stopwatch, online stopwatch, countdown timer, countdown to date, days until",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Countdown timer with presets and alarm sound",
      "Stopwatch with lap and split times",
      "Countdown to any date with saved events",
      "Full screen mode and remaining time in the tab title",
    ],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="Online Timer & Stopwatch" subtitle="Set a timer with an alarm, time laps with a stopwatch, or count down to a date." />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "timer", label: "Timer" },
          { value: "stopwatch", label: "Stopwatch" },
          { value: "countdown", label: "Countdown to date" },
        ]}
      />
      {tab === "timer" && <TimerTool />}
      {tab === "stopwatch" && <StopwatchTool />}
      {tab === "countdown" && <CountdownTool />}
    </div>
  );
}

function pad(n: number, len = 2) {
  return String(Math.floor(n)).padStart(len, "0");
}

function formatClock(ms: number, showHours = ms >= 3_600_000) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return showHours ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatStopwatch(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${h ? `${h}:` : ""}${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function useNow(active: boolean, interval = 100) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [active, interval]);
  return now;
}

function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  else void el.requestFullscreen?.();
}

/** Repeating alarm beeps through Web Audio until stopped. */
function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null);
  const loopRef = useRef<number | undefined>(undefined);

  const unlock = useCallback(() => {
    // Create (or resume) the audio context on a user gesture so the alarm can play later.
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    void ctxRef.current.resume();
  }, []);

  const stop = useCallback(() => {
    window.clearInterval(loopRef.current);
    loopRef.current = undefined;
  }, []);

  const start = useCallback(() => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    const burst = () => {
      const t = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.2, t + i * 0.18 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.18);
        osc.stop(t + i * 0.18 + 0.13);
      }
    };
    stop();
    burst();
    loopRef.current = window.setInterval(burst, 1400);
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { start, stop, unlock };
}

/* ---------------------------------------------------------------- Timer -- */

const PRESETS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

function TimerTool() {
  const [h, setH] = useState("0");
  const [m, setM] = useState("5");
  const [s, setS] = useState("0");
  const [duration, setDuration] = useState(5 * 60_000);
  const [remaining, setRemaining] = useState(5 * 60_000);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [ringing, setRinging] = useState(false);
  const [sound, setSound] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const alarm = useAlarm();
  const now = useNow(endAt !== null);

  const left = endAt !== null ? Math.max(0, endAt - now) : remaining;
  const running = endAt !== null;

  useEffect(() => {
    if (endAt !== null && now >= endAt) {
      setEndAt(null);
      setRemaining(0);
      setRinging(true);
      if (sound) alarm.start();
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification("Time's up!", { body: `Your ${formatClock(duration)} timer has finished.` });
      }
    }
  }, [now, endAt, sound, alarm, duration]);

  useDocumentTitle(running ? `⏱ ${formatClock(left)} | Timer` : ringing ? "⏰ Time's up!" : null);

  const setFromInputs = (hh: string, mm: string, ss: string) => {
    const ms = ((parseInt(hh) || 0) * 3600 + (parseInt(mm) || 0) * 60 + (parseInt(ss) || 0)) * 1000;
    setDuration(ms);
    setRemaining(ms);
    setEndAt(null);
    setRinging(false);
    alarm.stop();
  };

  const startPause = () => {
    alarm.unlock();
    if (running) {
      setRemaining(left);
      setEndAt(null);
    } else if (left > 0) {
      setEndAt(Date.now() + left);
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    }
  };

  const reset = () => {
    setEndAt(null);
    setRemaining(duration);
    setRinging(false);
    alarm.stop();
  };

  const addMinute = () => {
    if (running) setEndAt((e) => (e ?? Date.now()) + 60_000);
    else setRemaining((r) => r + 60_000);
    setDuration((d) => d + 60_000);
    setRinging(false);
    alarm.stop();
  };

  const preset = (min: number) => {
    setH(String(Math.floor(min / 60)));
    setM(String(min % 60));
    setS("0");
    const ms = min * 60_000;
    setDuration(ms);
    setRemaining(ms);
    setRinging(false);
    alarm.stop();
    alarm.unlock();
    setEndAt(Date.now() + ms);
  };

  const progress = duration > 0 ? left / duration : 0;
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-4">
      <Panel>
        <div
          ref={boxRef}
          className={cn(
            "flex flex-col items-center justify-center gap-6 bg-card py-4",
            "[&:fullscreen]:bg-background",
            ringing && "animate-pulse"
          )}
        >
          <div className="relative w-full max-w-sm">
            <svg viewBox="0 0 100 100" className="w-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" strokeWidth="4" className="stroke-muted" />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={ringing ? "stroke-red-500" : "stroke-blue-600"}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: running ? "stroke-dashoffset 0.1s linear" : "none" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div
                  className={cn("font-mono text-5xl font-bold tabular-nums sm:text-6xl", ringing && "text-red-600")}
                  data-testid="timer-display"
                >
                  {formatClock(left, duration >= 3_600_000)}
                </div>
                {ringing ? <div className="mt-1 text-lg font-semibold text-red-600">Time's up!</div> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {ringing ? (
              <Button size="lg" variant="destructive" onClick={reset}>
                <BellOff className="size-4" /> Stop alarm
              </Button>
            ) : (
              <Button size="lg" onClick={startPause} disabled={!running && left <= 0} className="min-w-32">
                {running ? <Pause className="size-4" /> : <Play className="size-4" />}
                {running ? "Pause" : left < duration && left > 0 ? "Resume" : "Start"}
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={reset}>
              <RotateCcw className="size-4" /> Reset
            </Button>
            <Button size="lg" variant="outline" onClick={addMinute}>
              <Plus className="size-4" /> 1 min
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleFullscreen(boxRef.current)} aria-label="Full screen">
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          {(
            [
              ["Hours", h, setH],
              ["Minutes", m, setM],
              ["Seconds", s, setS],
            ] as const
          ).map(([label, value, set]) => (
            <Field key={label} label={label}>
              <Input
                type="number"
                min={0}
                className="w-24"
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  const next = { Hours: h, Minutes: m, Seconds: s, [label]: e.target.value };
                  setFromInputs(next.Hours, next.Minutes, next.Seconds);
                }}
              />
            </Field>
          ))}
          <Button variant="outline" onClick={() => setSound((v) => !v)} aria-pressed={sound}>
            {sound ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            Sound {sound ? "on" : "off"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Chip key={p} active={duration === p * 60_000} onClick={() => preset(p)}>
              {p >= 60 ? `${p / 60} hour` : `${p} min`}
            </Chip>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------ Stopwatch -- */

type Lap = { total: number; split: number };

function StopwatchTool() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [banked, setBanked] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const running = startedAt !== null;
  const now = useNow(running, 31);
  const elapsed = banked + (running ? now - startedAt : 0);

  useDocumentTitle(running ? `⏱ ${formatStopwatch(elapsed).slice(0, -3)} | Stopwatch` : null);

  const toggle = useCallback(() => {
    if (startedAt !== null) {
      setBanked((b) => b + Date.now() - startedAt);
      setStartedAt(null);
    } else {
      setStartedAt(Date.now());
    }
  }, [startedAt]);

  const lap = useCallback(() => {
    if (startedAt === null) return;
    const total = banked + Date.now() - startedAt;
    setLaps((l) => [{ total, split: total - (l[0]?.total ?? 0) }, ...l]);
  }, [startedAt, banked]);

  const reset = useCallback(() => {
    setStartedAt(null);
    setBanked(0);
    setLaps([]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "l" || e.key === "L") lap();
      else if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, lap, reset]);

  const splits = laps.map((l) => l.split);
  const best = laps.length > 1 ? Math.min(...splits) : -1;
  const worst = laps.length > 1 ? Math.max(...splits) : -1;

  return (
    <div className="space-y-4">
      <Panel>
        <div ref={boxRef} className="flex flex-col items-center gap-6 bg-card py-8 [&:fullscreen]:justify-center [&:fullscreen]:bg-background">
          <div className="font-mono text-6xl font-bold tabular-nums sm:text-7xl" data-testid="stopwatch-display">
            {formatStopwatch(elapsed)}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={toggle} className="min-w-32" variant={running ? "secondary" : "default"}>
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Stop" : elapsed ? "Resume" : "Start"}
            </Button>
            <Button size="lg" variant="outline" onClick={lap} disabled={!running}>
              <Flag className="size-4" /> Lap
            </Button>
            <Button size="lg" variant="outline" onClick={reset} disabled={!elapsed}>
              <RotateCcw className="size-4" /> Reset
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggleFullscreen(boxRef.current)} aria-label="Full screen">
              <Maximize className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Keyboard: Space start/stop · L lap · R reset</p>
        </div>
      </Panel>
      {laps.length ? (
        <Panel>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-medium">Lap</th>
                <th className="py-1 font-medium">Lap time</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((l, i) => (
                <tr
                  key={laps.length - i}
                  className={cn(
                    "border-t border-border",
                    l.split === best && "text-green-600 dark:text-green-400",
                    l.split === worst && "text-red-600 dark:text-red-400"
                  )}
                >
                  <td className="py-1.5">{laps.length - i}</td>
                  <td className="py-1.5 font-mono">{formatStopwatch(l.split)}</td>
                  <td className="py-1.5 text-right font-mono">{formatStopwatch(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Countdown -- */

type SavedEvent = { id: number; title: string; target: string };

const EVENTS_KEY = "utility-hub:countdown-events:v1";

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Next occurrence of a yearly date (month is 0-based). */
function nextYearly(month: number, day: (year: number) => number) {
  const now = new Date();
  let y = now.getFullYear();
  let d = new Date(y, month, day(y));
  if (d.getTime() <= now.getTime()) {
    y++;
    d = new Date(y, month, day(y));
  }
  return d;
}

const QUICK_EVENTS: { title: string; date: () => Date }[] = [
  { title: "New Year", date: () => nextYearly(0, () => 1) },
  // Enkutatash (Meskerem 1) is 12 September in the year before a Gregorian leap year, otherwise 11 September.
  { title: "Ethiopian New Year (Enkutatash)", date: () => nextYearly(8, (y) => (isLeap(y + 1) ? 12 : 11)) },
  { title: "Christmas", date: () => nextYearly(11, () => 25) },
];

function loadEvents(): SavedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function CountdownTool() {
  const [title, setTitle] = useState("New Year");
  const [target, setTarget] = useState(() => toLocalInput(QUICK_EVENTS[0].date()));
  const [events, setEvents] = useState<SavedEvent[]>(loadEvents);
  const now = useNow(true, 1000);

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch {
      /* storage unavailable */
    }
  }, [events]);

  const targetMs = target ? new Date(target).getTime() : NaN;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Event name">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Exam day" />
          </Field>
          <Field label="Date and time">
            <Input type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_EVENTS.map((q) => (
            <Chip
              key={q.title}
              active={title === q.title}
              onClick={() => {
                setTitle(q.title);
                setTarget(toLocalInput(q.date()));
              }}
            >
              {q.title}
            </Chip>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={!Number.isFinite(targetMs)}
            onClick={() => setEvents((ev) => [...ev, { id: Date.now(), title: title || "Event", target }])}
          >
            <Plus className="size-4" /> Save
          </Button>
        </div>
        <CountdownDisplay title={title} targetMs={targetMs} now={now} large />
      </Panel>
      {events.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((ev) => (
            <Panel key={ev.id} className="relative space-y-2 p-4 sm:p-4">
              <button
                className="absolute right-3 top-3 text-muted-foreground hover:text-red-600"
                aria-label={`Delete ${ev.title}`}
                onClick={() => setEvents((list) => list.filter((e) => e.id !== ev.id))}
              >
                <Trash2 className="size-4" />
              </button>
              <CountdownDisplay title={ev.title} targetMs={new Date(ev.target).getTime()} now={now} />
            </Panel>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CountdownDisplay({ title, targetMs, now, large }: { title: string; targetMs: number; now: number; large?: boolean }) {
  if (!Number.isFinite(targetMs)) return <p className="text-sm text-muted-foreground">Pick a date and time.</p>;
  const diff = targetMs - now;
  const past = diff < 0;
  const abs = Math.abs(diff);
  const parts = [
    ["days", Math.floor(abs / 86_400_000)],
    ["hours", Math.floor((abs % 86_400_000) / 3_600_000)],
    ["minutes", Math.floor((abs % 3_600_000) / 60_000)],
    ["seconds", Math.floor((abs % 60_000) / 1000)],
  ] as const;
  return (
    <div className="text-center">
      <div className={cn("font-semibold", large ? "text-lg" : "pr-6 text-sm")}>
        {past ? "Since" : "Until"} {title || "the event"}
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(targetMs).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
      </div>
      <div className={cn("mt-3 grid grid-cols-4 gap-2", large && "mx-auto max-w-xl")} data-testid={large ? "countdown" : undefined}>
        {parts.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-muted py-2">
            <div className={cn("font-mono font-bold tabular-nums", large ? "text-4xl sm:text-5xl" : "text-2xl")}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
