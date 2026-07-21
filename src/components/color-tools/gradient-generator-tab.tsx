import { useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { rgbaToHex, type RGBA } from "@/lib/color";

interface GradientStop {
  id: string;
  color: string;
  position: number;
}

let stopIdCounter = 0;
function nextStopId() {
  stopIdCounter += 1;
  return `stop-${stopIdCounter}`;
}

const MAX_STOPS = 8;
const MIN_STOPS = 2;

interface GradientGeneratorTabProps {
  color: RGBA;
}

export function GradientGeneratorTab({ color }: GradientGeneratorTabProps) {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<GradientStop[]>(() => [
    { id: nextStopId(), color: rgbaToHex(color), position: 0 },
    { id: nextStopId(), color: "#ec4899", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const addStop = () => {
    if (stops.length >= MAX_STOPS) return;
    const lastPosition = stops[stops.length - 1]?.position ?? 100;
    setStops((prev) => [
      ...prev,
      { id: nextStopId(), color: "#ffffff", position: lastPosition },
    ]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= MIN_STOPS) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, patch: Partial<GradientStop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopsCss = sortedStops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");
  const cssValue =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${stopsCss})`
      : `radial-gradient(circle, ${stopsCss})`;

  const handleCopy = async () => {
    const ok = await copyText(`background: ${cssValue};`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
          Preview
        </h2>
        <div
          className="h-40 rounded-xl border border-border"
          style={{ background: cssValue }}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["linear", "radial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {type === "linear" && (
            <div className="flex min-w-[220px] flex-1 items-center gap-3">
              <label className="whitespace-nowrap text-sm text-muted-foreground">
                Angle: {angle}°
              </label>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {stops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-3">
              <input
                type="color"
                value={stop.color}
                onChange={(e) =>
                  updateStop(stop.id, { color: e.target.value })
                }
                className="h-10 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent"
              />
              <input
                value={stop.color}
                onChange={(e) =>
                  updateStop(stop.id, { color: e.target.value })
                }
                className="w-28 rounded-lg border border-input bg-muted px-2 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) =>
                    updateStop(stop.id, { position: Number(e.target.value) })
                  }
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
                />
                <span className="w-12 shrink-0 text-right font-mono text-sm text-muted-foreground">
                  {stop.position}%
                </span>
              </div>
              <button
                onClick={() => removeStop(stop.id)}
                disabled={stops.length <= MIN_STOPS}
                title="Remove stop"
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addStop}
          disabled={stops.length >= MAX_STOPS}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add stop
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            CSS Output
          </h2>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              copied
                ? "bg-green-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground">
          background: {cssValue};
        </pre>
      </div>
    </div>
  );
}
