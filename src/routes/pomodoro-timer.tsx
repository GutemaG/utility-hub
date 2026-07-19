import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/pomodoro-timer")({
  component: RouteComponent,
});

type Phase = "focus" | "short-break" | "long-break";
type MiniWindowAction = "toggle-run" | "skip";
type FloatingWindowError = "mobile-unsupported" | "permission-denied" | "popup-blocked";

interface FloatingWindowResult {
  windowRef: Window | null;
  error: FloatingWindowError | null;
}

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartNext: boolean;
  fullscreenOnBreak: boolean;
}

const SETTINGS_KEY = "utility-hub:pomodoro-settings:v1";

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartNext: false,
  fullscreenOnBreak: true,
};

function RouteComponent() {
  const [settings, setSettings] = useState<PomodoroSettings>(() => loadSettings());
  const [phase, setPhase] = useState<Phase>("focus");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SETTINGS.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isMiniWindowOpen, setIsMiniWindowOpen] = useState(false);
  const [isBreakFullscreenMode, setIsBreakFullscreenMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const miniWindowRef = useRef<Window | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  useSEO({
    title: "Pomodoro Timer | Utility Hub",
    description:
      "Customizable Pomodoro timer with focus sessions, short and long breaks, break fullscreen mode, and experimental floating mini window support.",
    path: "/pomodoro-timer",
    keywords:
      "pomodoro timer, focus timer, productivity timer, break timer, fullscreen break timer",
    applicationCategory: "ProductivityApplication",
    featureList: [
      "Custom focus and break durations",
      "Long break interval control",
      "Auto-start next phase",
      "Fullscreen break mode",
      "Experimental floating mini timer",
    ],
  });

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!isRunning || !endAt) {
      return;
    }

    const timerId = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds(next);

      if (next === 0) {
        window.clearInterval(timerId);
        advancePhase();
      }
    }, 250);

    return () => window.clearInterval(timerId);
  }, [isRunning, endAt]);

  useEffect(() => {
    if (!isMiniWindowOpen || !miniWindowRef.current || miniWindowRef.current.closed) {
      return;
    }

    renderMiniWindowContent(miniWindowRef.current.document, {
      phase,
      isRunning,
      remainingSeconds,
      onAction: handleMiniWindowAction,
    });
  }, [isMiniWindowOpen, phase, isRunning, remainingSeconds]);

  useEffect(() => {
    if (!isMiniWindowOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!miniWindowRef.current || miniWindowRef.current.closed) {
        handleMiniWindowClosed();
      }
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isMiniWindowOpen]);

  useEffect(() => {
    return () => {
      if (miniWindowRef.current && !miniWindowRef.current.closed) {
        miniWindowRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsBreakFullscreenMode(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isBreakFullscreenMode) {
      return;
    }

    const target = fullscreenContainerRef.current;
    if (!target) {
      return;
    }

    if (document.fullscreenElement === target) {
      return;
    }

    void target.requestFullscreen().catch(() => {
      setMessage(
        "Fullscreen was blocked by the browser. You can still use the clean break overlay without fullscreen."
      );
    });
  }, [isBreakFullscreenMode]);

  const phaseLabel = getPhaseLabel(phase);
  const [isDesktopDevice, setIsDesktopDevice] = useState(() => detectDesktopDevice());

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(any-pointer: coarse)"),
      window.matchMedia("(hover: none)"),
      window.matchMedia("(any-hover: none)"),
    ];

    const updateDesktopSupport = () => {
      setIsDesktopDevice(detectDesktopDevice());
    };

    for (const query of mediaQueries) {
      query.addEventListener("change", updateDesktopSupport);
    }

    window.addEventListener("resize", updateDesktopSupport);
    window.addEventListener("orientationchange", updateDesktopSupport);
    window.addEventListener("focus", updateDesktopSupport);

    return () => {
      for (const query of mediaQueries) {
        query.removeEventListener("change", updateDesktopSupport);
      }

      window.removeEventListener("resize", updateDesktopSupport);
      window.removeEventListener("orientationchange", updateDesktopSupport);
      window.removeEventListener("focus", updateDesktopSupport);
    };
  }, []);

  const startTimer = () => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(getPhaseSeconds(phase, settings));
    }

    const base = remainingSeconds <= 0 ? getPhaseSeconds(phase, settings) : remainingSeconds;
    setEndAt(Date.now() + base * 1000);
    setIsRunning(true);
    setMessage("");
  };

  const pauseTimer = () => {
    if (endAt) {
      setRemainingSeconds(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
    }
    setEndAt(null);
    setIsRunning(false);
  };

  const resetCurrentPhase = () => {
    setEndAt(null);
    setIsRunning(false);
    setRemainingSeconds(getPhaseSeconds(phase, settings));
    setMessage("Current phase has been reset.");
  };

  const skipPhase = () => {
    setEndAt(null);
    setIsRunning(false);
    advancePhase();
  };

  const advancePhase = () => {
    let nextPhase: Phase = "focus";
    let nextSessionsCompleted = sessionsCompleted;

    if (phase === "focus") {
      nextSessionsCompleted = sessionsCompleted + 1;
      const shouldTakeLongBreak = nextSessionsCompleted % settings.longBreakEvery === 0;
      nextPhase = shouldTakeLongBreak ? "long-break" : "short-break";
      setSessionsCompleted(nextSessionsCompleted);
    } else {
      nextPhase = "focus";
    }

    setPhase(nextPhase);

    const nextSeconds = getPhaseSeconds(nextPhase, settings);
    setRemainingSeconds(nextSeconds);

    if (nextPhase === "focus") {
      void exitBreakFullscreen();
    } else if (settings.fullscreenOnBreak) {
      enterBreakFullscreen();
    }

    const shouldAutoStart = nextPhase !== "focus" || settings.autoStartNext;
    if (shouldAutoStart) {
      setIsRunning(true);
      setEndAt(Date.now() + nextSeconds * 1000);
    } else {
      setIsRunning(false);
      setEndAt(null);
    }
  };

  const toggleMiniWindow = async () => {
    if (isMiniWindowOpen) {
      if (miniWindowRef.current && !miniWindowRef.current.closed) {
        miniWindowRef.current.close();
      }
      handleMiniWindowClosed();
      return;
    }

    const floatingResult = await openFloatingTimerWindow();
    if (!floatingResult.windowRef) {
      if (floatingResult.error === "mobile-unsupported") {
        setMessage(
          "Floating mini timer is currently supported on desktop browsers only. On mobile, use the main timer or fullscreen break mode."
        );
      } else if (floatingResult.error === "permission-denied") {
        setMessage(
          "Picture-in-Picture permission was denied. Allow Picture-in-Picture for this site in browser settings, then try again."
        );
      } else {
        setMessage(
          "Mini window could not be opened. Allow popups for this site or use a Chromium browser for Document Picture-in-Picture."
        );
      }
      return;
    }

    const miniWindow = floatingResult.windowRef;

    miniWindowRef.current = miniWindow;
    miniWindow.addEventListener("beforeunload", handleMiniWindowClosed);
    miniWindow.addEventListener("pagehide", handleMiniWindowClosed);
    miniWindow.addEventListener("unload", handleMiniWindowClosed);

    renderMiniWindowContent(miniWindow.document, {
      phase,
      isRunning,
      remainingSeconds,
      onAction: handleMiniWindowAction,
    });
    setIsMiniWindowOpen(true);
  };

  const handleMiniWindowClosed = () => {
    miniWindowRef.current = null;
    setIsMiniWindowOpen(false);
  };

  const handleMiniWindowAction = (action: MiniWindowAction) => {
    if (action === "toggle-run") {
      if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
      return;
    }

    if (action === "skip") {
      skipPhase();
    }
  };

  const enterBreakFullscreen = () => {
    setIsBreakFullscreenMode(true);
  };

  const exitBreakFullscreen = async () => {
    setIsBreakFullscreenMode(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore browser-level fullscreen exit race conditions.
      }
    }
  };

  const isFloatingMiniSupported = isDesktopDevice;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pomodoro Timer</h1>
            <p className="mt-1 text-sm text-muted-foreground">Minimal focus mode for deep work sessions.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowSettings((current) => !current)}>
            {showSettings ? "Hide Settings" : "Edit Settings"}
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background px-6 py-10 text-center sm:py-14">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{phaseLabel}</p>
          <p className="mt-3 font-mono text-7xl font-bold tracking-tight sm:text-8xl lg:text-[10rem]">
            {formatSeconds(remainingSeconds)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
            {isRunning ? "Running" : "Paused"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Sessions done: {sessionsCompleted}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={isRunning ? pauseTimer : startTimer}>
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetCurrentPhase}>
            Reset Phase
          </Button>
          <Button type="button" variant="outline" onClick={skipPhase}>
            Skip to Next
          </Button>
          <Button type="button" variant="outline" onClick={enterBreakFullscreen}>
            Enter Fullscreen
          </Button>
          {isBreakFullscreenMode ? (
            <Button type="button" variant="outline" onClick={() => void exitBreakFullscreen()}>
              Exit Fullscreen
            </Button>
          ) : null}
          {isFloatingMiniSupported ? (
            <Button type="button" variant="outline" onClick={() => void toggleMiniWindow()}>
              {isMiniWindowOpen ? "Close Floating Mini Timer" : "Open Floating Mini Timer"}
            </Button>
          ) : null}
        </div>
      </section>

      {showSettings ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Customize Timer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your focus and break timings. Break phases start automatically.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumberSetting
              label="Focus (minutes)"
              value={settings.focusMinutes}
              min={1}
              max={180}
              onChange={(value) => setSettings((current) => ({ ...current, focusMinutes: value }))}
            />
            <NumberSetting
              label="Short break (minutes)"
              value={settings.shortBreakMinutes}
              min={1}
              max={60}
              onChange={(value) => setSettings((current) => ({ ...current, shortBreakMinutes: value }))}
            />
            <NumberSetting
              label="Long break (minutes)"
              value={settings.longBreakMinutes}
              min={1}
              max={120}
              onChange={(value) => setSettings((current) => ({ ...current, longBreakMinutes: value }))}
            />
            <NumberSetting
              label="Long break every"
              value={settings.longBreakEvery}
              min={2}
              max={10}
              suffix="focus sessions"
              onChange={(value) => setSettings((current) => ({ ...current, longBreakEvery: value }))}
            />
          </div>

          <div className="mt-5 space-y-3">
            <ToggleSetting
              label="Auto-start focus after a break"
              description="If off, focus phase waits for manual start after each break."
              checked={settings.autoStartNext}
              onCheckedChange={(checked) => setSettings((current) => ({ ...current, autoStartNext: checked }))}
            />
            <ToggleSetting
              label="Enter fullscreen on breaks"
              description="Open clean fullscreen mode automatically for short and long breaks."
              checked={settings.fullscreenOnBreak}
              onCheckedChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  fullscreenOnBreak: checked,
                }))
              }
            />
          </div>
        </section>
      ) : null}

      <section className="mt-14 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">About Pomodoro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pomodoro is a focus technique that alternates work sessions with breaks to sustain concentration
          and reduce burnout.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This timer keeps the top section intentionally simple. Use Edit Settings when you want to tune
          durations or fullscreen behavior.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Floating Mini Window (Experimental)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          On compatible browsers, this opens a tiny floating timer window you can keep visible while
          working. In other browsers it falls back to a popup window.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Note: true always-on-top desktop widgets are not guaranteed by standard web APIs.
        </p>
      </section>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      {isBreakFullscreenMode ? (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4"
        >
          <div className="w-full max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{phaseLabel}</p>
            <p className="mt-4 font-mono text-[6rem] font-bold leading-none tracking-tight sm:text-[8rem]">
              {formatSeconds(remainingSeconds)}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" size="lg" onClick={isRunning ? pauseTimer : startTimer}>
                {isRunning ? "Pause" : "Resume"}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={skipPhase}>
                Skip
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => void exitBreakFullscreen()}>
                Exit
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberSetting({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="space-y-1">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const raw = Number(event.target.value);
            if (!Number.isFinite(raw)) {
              return;
            }
            onChange(Math.max(min, Math.min(max, Math.round(raw))));
          }}
        />
        <p className="text-xs text-muted-foreground">
          {min} to {max}
          {suffix ? ` ${suffix}` : ""}
        </p>
      </div>
    </label>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function loadSettings(): PomodoroSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      focusMinutes: clampNumber(parsed.focusMinutes, 1, 180, DEFAULT_SETTINGS.focusMinutes),
      shortBreakMinutes: clampNumber(parsed.shortBreakMinutes, 1, 60, DEFAULT_SETTINGS.shortBreakMinutes),
      longBreakMinutes: clampNumber(parsed.longBreakMinutes, 1, 120, DEFAULT_SETTINGS.longBreakMinutes),
      longBreakEvery: clampNumber(parsed.longBreakEvery, 2, 10, DEFAULT_SETTINGS.longBreakEvery),
      autoStartNext: Boolean(parsed.autoStartNext),
      fullscreenOnBreak:
        parsed.fullscreenOnBreak === undefined
          ? DEFAULT_SETTINGS.fullscreenOnBreak
          : Boolean(parsed.fullscreenOnBreak),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(n)));
}

function getPhaseSeconds(phase: Phase, settings: PomodoroSettings) {
  if (phase === "focus") {
    return settings.focusMinutes * 60;
  }

  if (phase === "short-break") {
    return settings.shortBreakMinutes * 60;
  }

  return settings.longBreakMinutes * 60;
}

function getPhaseLabel(phase: Phase) {
  if (phase === "focus") {
    return "Focus Session";
  }

  if (phase === "short-break") {
    return "Short Break";
  }

  return "Long Break";
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function openFloatingTimerWindow(): Promise<FloatingWindowResult> {
  const anyWindow = window as Window & {
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
  };

  if (anyWindow.documentPictureInPicture?.requestWindow) {
    try {
      const pipWindow = await anyWindow.documentPictureInPicture.requestWindow({
        width: 340,
        height: 220,
      });
      return { windowRef: pipWindow, error: null };
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        return { windowRef: null, error: "permission-denied" };
      }

      // Continue to popup fallback.
    }
  }

  const popup = window.open(
    "",
    "utility-hub-pomodoro-mini",
    "width=340,height=240,resizable=yes,scrollbars=no,noopener"
  );

  if (!popup) {
    return { windowRef: null, error: "popup-blocked" };
  }

  return { windowRef: popup, error: null };
}

function detectDesktopDevice() {
  const navigatorWithUserAgentData = window.navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  const mobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
  const touchMacLikeIpad =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  const userAgentSaysMobile = Boolean(navigatorWithUserAgentData.userAgentData?.mobile);
  const coarsePointer =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;
  const noHover =
    window.matchMedia("(hover: none)").matches &&
    window.matchMedia("(any-hover: none)").matches;
  const likelyTouchOnlyInput = coarsePointer && (noHover || window.navigator.maxTouchPoints > 0);
  const isMobile = mobileUserAgent || touchMacLikeIpad || userAgentSaysMobile || likelyTouchOnlyInput;

  return !isMobile;
}

function isPermissionDeniedError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return error.name === "NotAllowedError" || error.name === "SecurityError";
}

function renderMiniWindowContent(
  doc: Document,
  state: {
    phase: Phase;
    isRunning: boolean;
    remainingSeconds: number;
    onAction: (action: MiniWindowAction) => void;
  }
) {
  const root = ensureMiniWindowMarkup(doc);
  const phaseEl = root.querySelector<HTMLElement>("[data-pomodoro-mini='phase']");
  const timerEl = root.querySelector<HTMLElement>("[data-pomodoro-mini='timer']");
  const statusEl = root.querySelector<HTMLElement>("[data-pomodoro-mini='status']");
  const toggleEl = root.querySelector<HTMLButtonElement>("[data-pomodoro-mini='toggle']");
  const skipEl = root.querySelector<HTMLButtonElement>("[data-pomodoro-mini='skip']");

  if (phaseEl) {
    phaseEl.textContent = getPhaseLabel(state.phase);
  }
  if (timerEl) {
    timerEl.textContent = formatSeconds(state.remainingSeconds);
  }
  if (statusEl) {
    statusEl.textContent = state.isRunning ? "Running" : "Paused";
  }
  if (toggleEl) {
    toggleEl.textContent = state.isRunning ? "Pause" : "Start";
    toggleEl.onclick = () => state.onAction("toggle-run");
  }
  if (skipEl) {
    skipEl.onclick = () => state.onAction("skip");
  }
}

function ensureMiniWindowMarkup(doc: Document) {
  let root = doc.getElementById("pomodoro-mini-root");
  if (root) {
    return root;
  }

  doc.title = "Pomodoro Mini Timer";
  doc.head.innerHTML = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
      body { margin: 0; background: #0f172a; color: #e2e8f0; }
      #pomodoro-mini-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 12px; box-sizing: border-box; }
      .card { width: min(100%, 460px); border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.35); background: rgba(15, 23, 42, 0.95); padding: clamp(10px, 2.5vw, 16px); text-align: center; box-sizing: border-box; }
      .phase { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
      .timer { margin-top: 6px; font-size: clamp(2rem, 20vw, 3.1rem); line-height: 1; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .status { margin-top: 6px; font-size: 12px; color: #cbd5e1; }
      .actions { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .btn {
        border: 1px solid rgba(148, 163, 184, 0.45);
        background: rgba(15, 23, 42, 0.85);
        color: #e2e8f0;
        border-radius: 10px;
        min-width: 80px;
        padding: 7px 12px;
        font-size: 12px;
        cursor: pointer;
      }
      .btn:hover { background: rgba(30, 41, 59, 0.95); }
    </style>
  `;

  doc.body.innerHTML = `
    <div id="pomodoro-mini-root">
      <div class="card">
        <div class="phase" data-pomodoro-mini="phase">Focus Session</div>
        <div class="timer" data-pomodoro-mini="timer">00:00</div>
        <div class="status" data-pomodoro-mini="status">Paused</div>
        <div class="actions">
          <button class="btn" type="button" data-pomodoro-mini="toggle">Start</button>
          <button class="btn" type="button" data-pomodoro-mini="skip">Skip</button>
        </div>
      </div>
    </div>
  `;

  root = doc.getElementById("pomodoro-mini-root");
  if (!root) {
    throw new Error("Failed to initialize mini timer window.");
  }

  return root;
}