import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Download, Gauge, Pause, Play, Upload, Zap } from "lucide-react";
import SpeedTest, { type MeasurementConfig, type MeasurementSummary } from "@cloudflare/speedtest";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/internet-speed-test")({
  component: RouteComponent,
});

type TestPhase = "idle" | "running" | "finished" | "error";
type StepType = MeasurementConfig["type"];

const MEASUREMENTS: MeasurementConfig[] = [
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 5 },
  { type: "download", bytes: 1e6, count: 5 },
  { type: "download", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 3 },
  { type: "upload", bytes: 1e5, count: 5 },
  { type: "upload", bytes: 1e6, count: 4 },
  { type: "upload", bytes: 1e7, count: 3 },
];

const STEP_LABELS: Record<StepType, string> = {
  latency: "Measuring latency…",
  download: "Measuring download speed…",
  upload: "Measuring upload speed…",
  packetLoss: "Measuring packet loss…",
};

function bpsToMbps(bps: number): number {
  return bps / 1_000_000;
}

function formatMbps(bps: number | undefined): string {
  if (bps === undefined) return "—";
  const mbps = bpsToMbps(bps);
  const decimals = mbps < 10 ? 2 : mbps < 100 ? 1 : 0;
  return mbps.toFixed(decimals);
}

function formatMs(ms: number | null | undefined): string {
  if (ms === undefined || ms === null) return "—";
  return ms.toFixed(ms < 10 ? 2 : 0);
}

function RouteComponent() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [summary, setSummary] = useState<MeasurementSummary>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<StepType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const speedTestRef = useRef<InstanceType<typeof SpeedTest> | null>(null);

  useSEO({
    title: "Internet Speed Test | Utility Hub",
    description:
      "Measure your download speed, upload speed, latency, and jitter right in your browser using Cloudflare's global network.",
    path: "/internet-speed-test",
    keywords: "internet speed test, download speed test, upload speed test, bandwidth test, latency test, ping test, jitter test",
    applicationCategory: "UtilitiesApplication",
    featureList: ["Live download speed", "Live upload speed", "Latency", "Jitter", "No sign-up required"],
  });

  const ensureEngine = () => {
    if (speedTestRef.current) return speedTestRef.current;

    const engine = new SpeedTest({
      autoStart: false,
      logAimApiUrl: null,
      measureDownloadLoadedLatency: false,
      measureUploadLoadedLatency: false,
      measurements: MEASUREMENTS,
    });

    engine.onRunningChange = (running) => {
      if (running) {
        setPhase("running");
        setIsPaused(false);
      } else if (!engine.isFinished) {
        // Not running and not finished means the test was paused.
        setIsPaused(true);
      }
    };
    engine.onPhaseChange = ({ measurementId, measurement }) => {
      setStepIndex(measurementId);
      setCurrentStep(measurement.type);
    };
    engine.onResultsChange = () => {
      setSummary(engine.results.getSummary());
    };
    engine.onFinish = (results) => {
      setPhase("finished");
      setSummary(results.getSummary());
    };
    engine.onError = (message) => {
      setPhase("error");
      setErrorMessage(message);
    };

    speedTestRef.current = engine;
    return engine;
  };

  const handleStart = () => {
    setErrorMessage(null);
    setSummary({});
    setStepIndex(0);
    setCurrentStep(null);
    setIsPaused(false);

    const engine = ensureEngine();
    if (engine.isFinished || phase === "error") {
      engine.restart();
    } else {
      engine.play();
    }
  };

  const handlePauseResume = () => {
    const engine = speedTestRef.current;
    if (!engine) return;
    if (isPaused) {
      engine.play();
    } else {
      engine.pause();
    }
  };

  // Start automatically on page load; the ring itself can be clicked to
  // re-run once idle/finished/error, so no separate "Start" button is needed.
  // The actual start is deferred a tick so React 19 StrictMode's dev-mode
  // double-invoke (mount -> cleanup -> mount) cancels the first, unfired
  // timer instead of pausing a test that had only just begun playing.
  useEffect(() => {
    const timer = setTimeout(() => handleStart(), 0);
    return () => {
      clearTimeout(timer);
      speedTestRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSteps = MEASUREMENTS.length;
  const progressPercent =
    phase === "finished" ? 100 : phase === "running" ? Math.round((stepIndex / totalSteps) * 100) : 0;

  // The engine doesn't always call onError when every request fails (e.g. no
  // connectivity) — it can instead "finish" with no usable data. Treat that
  // the same as an error rather than showing a misleading 0 Mbps result.
  const finishedWithNoData = phase === "finished" && !summary.download && !summary.upload && !summary.latency;
  const showError = phase === "error" || finishedWithNoData;

  const ringReading = (() => {
    if (phase === "running") {
      if (currentStep === "download") return { value: formatMbps(summary.download), unit: "Mbps", label: "Download" };
      if (currentStep === "upload") return { value: formatMbps(summary.upload), unit: "Mbps", label: "Upload" };
      if (currentStep === "latency") return { value: formatMs(summary.latency), unit: "ms", label: "Latency" };
    }
    if (phase === "finished" && !finishedWithNoData) {
      return { value: formatMbps(summary.download), unit: "Mbps", label: "Download" };
    }
    return null;
  })();

  const ringClickable = phase === "idle" || phase === "finished" || phase === "error";
  const isComplete = phase === "finished" && !finishedWithNoData;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Internet Speed Test</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Measure your download speed, upload speed, latency, and jitter right in your browser.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {!showError ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {phase === "running"
                  ? isPaused
                    ? "Paused"
                    : currentStep
                      ? STEP_LABELS[currentStep]
                      : "Starting…"
                  : phase === "finished"
                    ? "Test complete — tap to test again"
                    : "Tap to start"}
              </p>
              {phase === "running" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handlePauseResume}
                  aria-label={isPaused ? "Resume test" : "Pause test"}
                >
                  {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </Button>
              ) : null}
            </div>

            <ProgressRing
              percent={progressPercent}
              clickable={ringClickable}
              onClick={handleStart}
              complete={isComplete}
            >
              {ringReading ? (
                <>
                  <p
                    className={`text-4xl font-bold tabular-nums sm:text-5xl ${
                      isComplete ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                    }`}
                  >
                    {ringReading.value}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      isComplete ? "text-blue-600/80 dark:text-blue-400/80" : "text-muted-foreground"
                    }`}
                  >
                    {ringReading.unit}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      isComplete ? "text-blue-600/80 dark:text-blue-400/80" : "text-muted-foreground"
                    }`}
                  >
                    {ringReading.label}
                  </p>
                </>
              ) : (
                <>
                  <Gauge className="h-8 w-8 text-primary" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Tap to start</p>
                </>
              )}
            </ProgressRing>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricBlock icon={Download} label="Download" value={formatMbps(summary.download)} unit="Mbps" />
              <MetricBlock icon={Upload} label="Upload" value={formatMbps(summary.upload)} unit="Mbps" />
              <MetricBlock icon={Gauge} label="Latency" value={formatMs(summary.latency)} unit="ms" />
              <MetricBlock icon={Gauge} label="Jitter" value={formatMs(summary.jitter)} unit="ms" />
            </div>

            {phase === "finished" && summary.totalDurationMs !== undefined ? (
              <p className="text-center text-xs text-muted-foreground">
                Completed in {(summary.totalDurationMs / 1000).toFixed(1)}s
              </p>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Transfers a small amount of data (tens of MB) to and from Cloudflare's network to measure your
                connection. Results are aggregated by Cloudflare.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {finishedWithNoData
                ? "Couldn't reach Cloudflare's test servers. Check your connection and try again."
                : (errorMessage ?? "Something went wrong while running the test.")}
            </div>
            <Button type="button" onClick={handleStart} className="gap-2">
              <Zap className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressRing({
  percent,
  clickable,
  onClick,
  complete,
  children,
}: {
  percent: number;
  clickable: boolean;
  onClick: () => void;
  complete: boolean;
  children: React.ReactNode;
}) {
  const size = 208;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-label={clickable ? "Start or restart the speed test" : "Speed test in progress"}
      className="group relative mx-auto flex items-center justify-center rounded-full outline-none disabled:cursor-default focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset,color] duration-500 ease-out ${
            complete ? "stroke-blue-500 dark:stroke-blue-400" : "stroke-primary"
          }`}
        />
      </svg>
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center rounded-full transition-colors ${
          clickable ? (complete ? "group-hover:bg-blue-500/5" : "group-hover:bg-primary/5") : ""
        }`}
      >
        {children}
      </div>
    </button>
  );
}

function MetricBlock({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Download;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
        {value}
        <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
