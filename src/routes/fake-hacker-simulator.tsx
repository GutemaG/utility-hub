import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/fake-hacker-simulator")({
  component: RouteComponent,
});

const MAX_LINES = 120;
const MATRIX_COLUMN_COUNT = 34;
const MATRIX_COLUMN_LENGTH = 34;
const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+-=?";
const MATRIX_WORDS = [
  "ROOT",
  "VOID",
  "BYTE",
  "NODE",
  "HEX",
  "TRACE",
  "AUTH",
  "STACK",
  "KERNEL",
  "ACCESS",
  "CIPHER",
  "ZERO",
  "VECTOR",
  "CACHE",
  "PROTO",
  "PING",
];

const FAKE_LINES = [
  "Initializing secure runtime...",
  "Loading encrypted modules...",
  "Compiling payload templates...",
  "Creating background workers...",
  "Scanning target architecture...",
  "Bypassing visual firewall layer...",
  "Injecting dev tools hooks...",
  "Generating access tokens...",
  "Decrypting synthetic cache blocks...",
  "Syncing distributed nodes...",
  "Creating mirror snapshots...",
  "Calibrating packet stream...",
  "Rebuilding dynamic route tree...",
  "Validating checksum matrix...",
  "Escalating local sandbox privileges...",
  "Patching runtime memory maps...",
  "Streaming telemetry logs...",
  "Creating fallback binaries...",
  "Linking shadow services...",
  "Finishing operation sequence...",
];

type MatrixColumn = {
  text: string;
  left: number;
  duration: number;
  delay: number;
};

type ViewMode = "terminal" | "matrix";

const createMatrixColumnText = () => {
  return Array.from({ length: MATRIX_COLUMN_LENGTH }, () => {
    const tokenRoll = Math.random();

    if (tokenRoll < 0.14) {
      const wordIndex = Math.floor(Math.random() * MATRIX_WORDS.length);
      return MATRIX_WORDS[wordIndex];
    }

    if (tokenRoll < 0.26) {
      return Math.floor(Math.random() * 256)
        .toString(16)
        .toUpperCase()
        .padStart(2, "0");
    }

    const randomIndex = Math.floor(Math.random() * MATRIX_CHARS.length);
    return MATRIX_CHARS[randomIndex];
  }).join("\n");
};

const createMatrixColumns = (): MatrixColumn[] => {
  return Array.from({ length: MATRIX_COLUMN_COUNT }, (_, index) => {
    const spread = 100 / MATRIX_COLUMN_COUNT;
    const left = index * spread + Math.random() * spread * 0.8;

    return {
      text: createMatrixColumnText(),
      left,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    };
  });
};

function RouteComponent() {
  const [alias, setAlias] = useState("anonymous");
  const [lines, setLines] = useState<string[]>([
    "[SYSTEM] Fake Hacker Simulator ready.",
    "[SYSTEM] Type any key to simulate coding and creation.",
  ]);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isMatrixRainMode, setIsMatrixRainMode] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("terminal");
  const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>(() => createMatrixColumns());
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const lineIndexRef = useRef(0);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  useSEO({
    title: "Fake Hacker Simulator | Utility Hub",
    description:
      "A fun fake hacker page with animated terminal output, typing simulation, and fullscreen mode.",
    path: "/fake-hacker-simulator",
    keywords: "fake hacker, hacker typer, terminal simulator, fun tool",
    applicationCategory: "EntertainmentApplication",
    featureList: [
      "Typing simulation",
      "Animated fake terminal output",
      "Auto mode",
      "Matrix rain effect",
      "Fullscreen mode",
    ],
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isAutoMode) {
      return;
    }

    const timerId = window.setInterval(() => {
      appendFakeLine();
    }, 240);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isAutoMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ignore command shortcuts.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      appendFakeLine();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!outputRef.current) {
      return;
    }

    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  const statusText = useMemo(() => {
    if (progress < 25) {
      return "Creating runtime...";
    }
    if (progress < 50) {
      return "Building modules...";
    }
    if (progress < 75) {
      return "Syncing nodes...";
    }
    if (progress < 100) {
      return "Finalizing operation...";
    }
    return "Operation complete. Restarting cycle...";
  }, [progress]);

  const isMatrixView = viewMode === "matrix";

  useEffect(() => {
    if (!isMatrixRainMode) {
      return;
    }

    const timerId = window.setInterval(() => {
      setMatrixColumns((current) => {
        return current.map((column) => {
          if (Math.random() > 0.26) {
            return column;
          }

          return {
            ...column,
            text: createMatrixColumnText(),
          };
        });
      });
    }, 210);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isMatrixRainMode]);

  const appendFakeLine = () => {
    const line = FAKE_LINES[lineIndexRef.current % FAKE_LINES.length];
    const timestamp = new Date().toLocaleTimeString();
    const nextLine = `[${timestamp}] [${alias || "anonymous"}] ${line}`;

    setLines((current) => {
      const next = [...current, nextLine];
      if (next.length > MAX_LINES) {
        return next.slice(next.length - MAX_LINES);
      }
      return next;
    });

    lineIndexRef.current += 1;
    setProgress((current) => {
      const next = current + Math.floor(Math.random() * 6 + 1);
      return next > 100 ? 0 : next;
    });
  };

  const clearOutput = () => {
    setLines([
      "[SYSTEM] Output cleared.",
      "[SYSTEM] Type any key to generate new lines.",
    ]);
    setProgress(0);
  };

  const enterFullscreen = async () => {
    const target = fullscreenRef.current;
    if (!target || document.fullscreenElement) {
      return;
    }

    try {
      await target.requestFullscreen();
    } catch {
      // Ignore blocked fullscreen requests.
    }
  };

  const exitFullscreen = async () => {
    if (!document.fullscreenElement) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore if browser already exited fullscreen.
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Fake Hacker Simulator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          For fun only: simulate dramatic terminal activity while you type.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Alias</label>
            <Input
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="anonymous"
              maxLength={24}
            />
          </div>

          <Button
            type="button"
            variant={isAutoMode ? "default" : "outline"}
            onClick={() => setIsAutoMode((current) => !current)}
          >
            {isAutoMode ? "Auto: ON" : "Auto: OFF"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={viewMode === "terminal" ? "default" : "outline"}
              onClick={() => setViewMode("terminal")}
            >
              Terminal
            </Button>
            <Button
              type="button"
              variant={viewMode === "matrix" ? "default" : "outline"}
              onClick={() => setViewMode("matrix")}
            >
              Matrix
            </Button>
          </div>

          <Button
            type="button"
            variant={isMatrixRainMode ? "default" : "outline"}
            onClick={() => setIsMatrixRainMode((current) => !current)}
          >
            {isMatrixRainMode ? "Matrix Rain: ON" : "Matrix Rain: OFF"}
          </Button>

          <Button type="button" variant="secondary" onClick={clearOutput}>
            Clear
          </Button>

          <Button type="button" variant="outline" onClick={() => void (isFullscreenMode ? exitFullscreen() : enterFullscreen())}>
            {isFullscreenMode ? "Exit Fullscreen" : "Enter Fullscreen"}
          </Button>
        </div>
      </div>

      <div
        ref={fullscreenRef}
        className={`rounded-xl border border-green-900 bg-black text-green-400 shadow-[0_0_35px_rgba(16,185,129,0.18)] ${isMatrixView ? "p-0" : "p-4 sm:p-6"}`}
      >
        {isMatrixView ? null : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-medium">STATUS: {statusText}</span>
              <span>PROGRESS: {progress}%</span>
            </div>

            <div className="mb-4 h-2 w-full overflow-hidden rounded bg-green-950/80">
              <div
                className="h-full bg-green-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {viewMode === "matrix" ? (
          <div
            className={`relative overflow-hidden rounded-xl bg-black ${isFullscreenMode ? "h-[calc(100vh-2px)]" : "h-[72vh] sm:h-[78vh]"}`}
          >
            {isMatrixRainMode ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
                {matrixColumns.map((column, index) => (
                  <span
                    key={`matrix-column-${index}`}
                    className="absolute top-[-28rem] whitespace-pre bg-gradient-to-b from-green-100/95 via-green-400/90 to-green-700/30 bg-clip-text text-[11px] font-medium leading-3 text-transparent [text-shadow:0_0_10px_rgba(74,222,128,0.45)]"
                    style={{
                      left: `${column.left}%`,
                      animation: `fake-hacker-matrix-fall ${column.duration}s linear ${column.delay}s infinite`,
                    }}
                  >
                    {column.text}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-green-600/80">
                Matrix Rain is OFF
              </div>
            )}
          </div>
        ) : (
          <div className="rounded border border-green-900/70 bg-black/70 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-green-500/90 sm:text-xs">
              Terminal Output
            </p>
            <div
              ref={outputRef}
              className="h-[52vh] overflow-auto rounded border border-green-900/70 bg-black/65 p-3 font-mono text-xs leading-5 sm:text-sm"
            >
              {lines.map((line, index) => (
                <p key={`${index}-${line}`}>{line}</p>
              ))}
              <p className="animate-pulse">&gt; _</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fake-hacker-matrix-fall {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(140vh);
          }
        }
      `}</style>
    </div>
  );
}