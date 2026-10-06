import { useEffect, useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, FlipHorizontal, FlipVertical, RotateCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropArea } from "@/components/file-drop-area";
import { useSEO } from "@/hooks/use-seo";
import { baseName, downloadBlob, downloadZip, formatBytes } from "@/lib/files";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/image-tools")({
  component: RouteComponent,
});

type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";
type ResizeMode = "none" | "percent" | "fit" | "exact";
type CropAspect = "original" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3" | "35:45";

type Settings = {
  format: OutputFormat;
  quality: number; // 0.05 – 1
  maxKb: string; // optional target size for lossy formats
  resizeMode: ResizeMode;
  percent: number;
  width: string;
  height: string;
  keepAspect: boolean;
  crop: CropAspect;
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  background: string; // fills transparency when saving as JPEG
};

const DEFAULT_SETTINGS: Settings = {
  format: "image/webp",
  quality: 0.8,
  maxKb: "",
  resizeMode: "none",
  percent: 50,
  width: "1920",
  height: "1080",
  keepAspect: true,
  crop: "original",
  rotate: 0,
  flipH: false,
  flipV: false,
  background: "#ffffff",
};

const CROP_OPTIONS: { key: CropAspect; label: string }[] = [
  { key: "original", label: "Original" },
  { key: "1:1", label: "1:1 Square" },
  { key: "4:3", label: "4:3" },
  { key: "3:4", label: "3:4" },
  { key: "16:9", label: "16:9" },
  { key: "9:16", label: "9:16 Story" },
  { key: "3:2", label: "3:2" },
  { key: "2:3", label: "2:3" },
  { key: "35:45", label: "35×45 Passport" },
];

const EXTENSION: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Item = { id: number; file: File; url: string };
type Output = { blob: Blob; url: string; width: number; height: number; srcWidth: number; srcHeight: number };

let nextId = 1;

function RouteComponent() {
  useSEO({
    title: "Image Tools: Compress, Resize, Crop & Convert | Utility Hub",
    description:
      "Compress, resize, crop, rotate and convert images to JPG, PNG or WebP in bulk. Runs entirely in your browser, so your images never leave your device.",
    path: "/image-tools",
    keywords: "image compressor, resize image, convert to webp, jpg to png, crop image, passport photo size, reduce image size kb",
    applicationCategory: "MultimediaApplication",
    featureList: [
      "Batch compress and convert to JPG, PNG or WebP",
      "Resize by percent, fit within a box, or exact size",
      "Compress to a target file size in KB",
      "Crop to common aspect ratios, rotate and flip",
      "Strips EXIF metadata, no uploads",
    ],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">Image Tools</h1>
        <p className="text-muted-foreground">
          Compress, resize, crop and convert images in bulk. Everything runs on your device. Need favicons or app
          icons? Use the{" "}
          <Link to="/app-icon-generator" className="text-blue-600 hover:underline">
            App Icon & Favicon Generator
          </Link>
          .
        </p>
      </div>

      <ConvertTool />
    </div>
  );
}

function ConvertTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [outputs, setOutputs] = useState<Record<number, Output | { error: string }>>({});
  const [processing, setProcessing] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const addFiles = (files: File[]) => {
    setItems((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, url: URL.createObjectURL(file) }))]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Re-process everything shortly after settings or the file list change
  useEffect(() => {
    if (!items.length) {
      setOutputs({});
      return;
    }
    let cancelled = false;
    const created: string[] = [];
    const timer = window.setTimeout(async () => {
      setProcessing(true);
      const next: Record<number, Output | { error: string }> = {};
      for (const item of items) {
        if (cancelled) return;
        try {
          const out = await processImage(item.file, settings);
          created.push(out.url);
          next[item.id] = out;
        } catch (err) {
          next[item.id] = { error: err instanceof Error ? err.message : "Could not process this image." };
        }
      }
      if (!cancelled) {
        setOutputs(next);
        setProcessing(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      // Free the previous run's previews once a newer run replaces them
      setTimeout(() => created.forEach((u) => URL.revokeObjectURL(u)), 5000);
    };
  }, [items, settings]);

  const ready = items.filter((i) => outputs[i.id] && "blob" in outputs[i.id]);
  const totals = ready.reduce(
    (t, i) => ({ before: t.before + i.file.size, after: t.after + (outputs[i.id] as Output).blob.size }),
    { before: 0, after: 0 }
  );

  const outputName = (item: Item, out: Output) => `${baseName(item.file.name)}.${EXTENSION[out.blob.type] ?? "png"}`;

  const lossy = settings.format !== "image/png";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <Section title="Format & quality">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["original", "image/jpeg", "image/png", "image/webp"] as const).map((f) => (
              <Chip key={f} active={settings.format === f} onClick={() => set("format", f)}>
                {f === "original" ? "Keep" : EXTENSION[f].toUpperCase()}
              </Chip>
            ))}
          </div>
          {lossy ? (
            <>
              <Field label={`Quality (${Math.round(settings.quality * 100)}%)`}>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={settings.quality}
                  onChange={(e) => set("quality", Number(e.target.value))}
                  className="w-full"
                />
              </Field>
              <Field label="Max file size (KB, optional)">
                <Input
                  inputMode="numeric"
                  placeholder="e.g. 200"
                  value={settings.maxKb}
                  onChange={(e) => set("maxKb", e.target.value.replace(/[^\d]/g, ""))}
                />
                <p className="text-xs text-muted-foreground">
                  Lowers JPG/WebP quality until each image fits, handy for upload forms with size limits.
                </p>
              </Field>
            </>
          ) : null}
          {settings.format === "image/jpeg" ? (
            <Field label="Background for transparent areas">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.background}
                  onChange={(e) => set("background", e.target.value)}
                  className="h-9 w-12 rounded border"
                />
                <Input value={settings.background} onChange={(e) => set("background", e.target.value)} />
              </div>
            </Field>
          ) : null}
        </Section>

        <Section title="Resize">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["none", "Original"],
                ["percent", "Percent"],
                ["fit", "Fit within"],
                ["exact", "Exact"],
              ] as const
            ).map(([k, label]) => (
              <Chip key={k} active={settings.resizeMode === k} onClick={() => set("resizeMode", k)}>
                {label}
              </Chip>
            ))}
          </div>
          {settings.resizeMode === "percent" ? (
            <Field label={`Scale (${settings.percent}%)`}>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={settings.percent}
                onChange={(e) => set("percent", Number(e.target.value))}
                className="w-full"
              />
            </Field>
          ) : null}
          {settings.resizeMode === "fit" || settings.resizeMode === "exact" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label={settings.resizeMode === "fit" ? "Max width (px)" : "Width (px)"}>
                <Input inputMode="numeric" value={settings.width} onChange={(e) => set("width", e.target.value.replace(/[^\d]/g, ""))} />
              </Field>
              <Field label={settings.resizeMode === "fit" ? "Max height (px)" : "Height (px)"}>
                <Input inputMode="numeric" value={settings.height} onChange={(e) => set("height", e.target.value.replace(/[^\d]/g, ""))} />
              </Field>
              {settings.resizeMode === "exact" ? (
                <label className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={settings.keepAspect} onChange={(e) => set("keepAspect", e.target.checked)} />
                  Keep aspect ratio (uses width; leave width empty to use height)
                </label>
              ) : (
                <p className="col-span-2 text-xs text-muted-foreground">Images smaller than the box are left as they are.</p>
              )}
            </div>
          ) : null}
        </Section>

        <Section title="Crop, rotate & flip">
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={settings.crop}
            onChange={(e) => set("crop", e.target.value as CropAspect)}
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.key === "original" ? "No crop" : `Center crop: ${c.label}`}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => set("rotate", ((settings.rotate + 90) % 360) as Settings["rotate"])}>
              <RotateCw className="h-4 w-4" /> Rotate ({settings.rotate}°)
            </Button>
            <Button variant={settings.flipH ? "default" : "outline"} size="sm" onClick={() => set("flipH", !settings.flipH)}>
              <FlipHorizontal className="h-4 w-4" /> Flip H
            </Button>
            <Button variant={settings.flipV ? "default" : "outline"} size="sm" onClick={() => set("flipV", !settings.flipV)}>
              <FlipVertical className="h-4 w-4" /> Flip V
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSettings(DEFAULT_SETTINGS)}>
              Reset
            </Button>
          </div>
        </Section>

        <p className="text-xs text-muted-foreground">
          Saved images don't keep EXIF metadata (camera, GPS location), so they're safer to share.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <FileDropArea accept="image/*" multiple listenToPaste onFiles={addFiles} hint="JPG, PNG, WebP, GIF, BMP, SVG, AVIF. Add as many as you like." />

        {items.length ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {processing
                  ? "Processing…"
                  : `${ready.length} image${ready.length === 1 ? "" : "s"}: ${formatBytes(totals.before)} → ${formatBytes(totals.after)}`}
                {!processing && totals.before ? <SavingBadge before={totals.before} after={totals.after} /> : null}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={processing || !ready.length}
                  onClick={() =>
                    ready.length === 1
                      ? downloadBlob((outputs[ready[0].id] as Output).blob, outputName(ready[0], outputs[ready[0].id] as Output))
                      : downloadZip(
                          ready.map((i) => ({ name: outputName(i, outputs[i.id] as Output), data: (outputs[i.id] as Output).blob })),
                          "images.zip"
                        )
                  }
                >
                  <Download className="h-4 w-4" /> {ready.length > 1 ? "Download all (.zip)" : "Download"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    items.forEach((i) => URL.revokeObjectURL(i.url));
                    setItems([]);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const out = outputs[item.id];
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <img
                      src={out && "url" in out ? out.url : item.url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-md bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:12px_12px] object-contain"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="truncate font-medium">{item.file.name}</div>
                      {out && "error" in out ? (
                        <div className="text-xs text-red-600">{out.error}</div>
                      ) : out ? (
                        <div className="text-xs text-muted-foreground">
                          {out.srcWidth}×{out.srcHeight} · {formatBytes(item.file.size)} → {out.width}×{out.height} ·{" "}
                          {formatBytes(out.blob.size)}
                          <SavingBadge before={item.file.size} after={out.blob.size} />
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</div>
                      )}
                    </div>
                    {out && "blob" in out ? (
                      <Button size="sm" variant="secondary" onClick={() => downloadBlob(out.blob, outputName(item, out))}>
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)} aria-label="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---- image processing ----

function resolveFormat(format: OutputFormat, sourceType: string): string {
  if (format !== "original") return format;
  return sourceType in EXTENSION ? sourceType : "image/png";
}

async function processImage(file: File, s: Settings): Promise<Output> {
  const bitmap = await createImageBitmap(file);
  try {
    const srcW = bitmap.width;
    const srcH = bitmap.height;
    const sideways = s.rotate === 90 || s.rotate === 270;

    // Center crop, chosen in the final (rotated) orientation
    let sw = srcW;
    let sh = srcH;
    if (s.crop !== "original") {
      const [a, b] = s.crop.split(":").map(Number);
      const target = sideways ? b / a : a / b;
      if (sw / sh > target) sw = Math.round(sh * target);
      else sh = Math.round(sw / target);
    }
    const sx = Math.round((srcW - sw) / 2);
    const sy = Math.round((srcH - sh) / 2);
    const cropW = sideways ? sh : sw;
    const cropH = sideways ? sw : sh;

    // Output size
    let tw = cropW;
    let th = cropH;
    const wantW = Number(s.width) || 0;
    const wantH = Number(s.height) || 0;
    if (s.resizeMode === "percent") {
      tw = cropW * (s.percent / 100);
      th = cropH * (s.percent / 100);
    } else if (s.resizeMode === "fit" && (wantW || wantH)) {
      const scale = Math.min(1, wantW ? wantW / cropW : Infinity, wantH ? wantH / cropH : Infinity);
      tw = cropW * scale;
      th = cropH * scale;
    } else if (s.resizeMode === "exact" && (wantW || wantH)) {
      if (s.keepAspect) {
        const scale = wantW ? wantW / cropW : wantH / cropH;
        tw = cropW * scale;
        th = cropH * scale;
      } else {
        tw = wantW || cropW;
        th = wantH || cropH;
      }
    }
    tw = Math.max(1, Math.round(tw));
    th = Math.max(1, Math.round(th));
    if (tw * th > 268_000_000) throw new Error("Output is too large for the browser to create.");

    const type = resolveFormat(s.format, file.type);
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    if (type === "image/jpeg") {
      ctx.fillStyle = s.background;
      ctx.fillRect(0, 0, tw, th);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.translate(tw / 2, th / 2);
    ctx.rotate((s.rotate * Math.PI) / 180);
    ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
    const dw = sideways ? th : tw;
    const dh = sideways ? tw : th;
    ctx.drawImage(bitmap, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);

    let blob = await canvasToBlob(canvas, type, s.quality);
    const maxBytes = Number(s.maxKb) * 1024;
    if (maxBytes && type !== "image/png" && blob.size > maxBytes) {
      // Binary-search the highest quality that fits under the limit
      let lo = 0.02;
      let hi = s.quality;
      let best: Blob | null = null;
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2;
        const attempt = await canvasToBlob(canvas, type, q);
        if (attempt.size <= maxBytes) {
          best = attempt;
          lo = q;
        } else {
          hi = q;
        }
      }
      blob = best ?? (await canvasToBlob(canvas, type, 0.02));
    }

    return { blob, url: URL.createObjectURL(blob), width: tw, height: th, srcWidth: srcW, srcHeight: srcH };
  } finally {
    bitmap.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Your browser can't encode this format."))), type, quality)
  );
}

// ---- small UI helpers ----

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1.5 text-sm font-medium transition",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-border hover:bg-accent/50"
      )}
    >
      {children}
    </button>
  );
}

function SavingBadge({ before, after }: { before: number; after: number }) {
  const pct = Math.round((1 - after / before) * 100);
  return (
    <span className={cn("ml-2 rounded px-1.5 py-0.5 text-xs font-medium", pct >= 0 ? "bg-green-600/10 text-green-700 dark:text-green-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
      {pct >= 0 ? `−${pct}%` : `+${Math.abs(pct)}%`}
    </span>
  );
}

export default RouteComponent;
