import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileDropArea } from "@/components/file-drop-area";
import { Chip, Field, Panel, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { baseName, downloadBlob, downloadZip, formatBytes } from "@/lib/files";
import { cn } from "@/lib/utils";
import type { WorkerRequest, WorkerResponse } from "@/workers/background-removal.worker";

export const Route = createFileRoute("/background-remover")({
  component: RouteComponent,
});

type Mask = { width: number; height: number; data: Uint8Array };
type Item = {
  id: number;
  file: File;
  url: string;
  status: "queued" | "processing" | "done" | "error";
  mask?: Mask;
  error?: string;
  ms?: number;
};
type BgMode = "transparent" | "color" | "blur" | "image";
type Settings = { mode: BgMode; color: string; blur: number; cleanup: number; crop: boolean; bgImage: string | null };

const COLORS = ["#ffffff", "#000000", "#f3f4f6", "#dbeafe", "#2563eb", "#dc2626", "#16a34a", "#fde68a"];
const CHECKER =
  "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 20px 20px";

let nextId = 1;

function RouteComponent() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [settings, setSettings] = useState<Settings>({ mode: "transparent", color: "#ffffff", blur: 12, cleanup: 30, crop: false, bgImage: null });
  const [model, setModel] = useState<{ state: "idle" | "loading" | "ready"; loaded: number; total: number }>({ state: "idle", loaded: 0, total: 0 });
  const workerRef = useRef<Worker | null>(null);
  const startedRef = useRef<Record<number, number>>({});

  useSEO({
    title: "Remove Background from Image, Free & Private | Utility Hub",
    description:
      "Remove the background from photos automatically with AI that runs in your browser. Make transparent PNGs or put a white, coloured, blurred or custom background behind people, products and logos.",
    path: "/background-remover",
    keywords:
      "remove background, background remover, remove bg, transparent background, remove background from image, passport photo background, white background",
    applicationCategory: "MultimediaApplication",
    featureList: [
      "Automatic AI background removal",
      "Transparent PNG, solid colour, blurred or custom backgrounds",
      "Before/after comparison",
      "Crop to the subject",
      "Batch processing with zip download",
      "Runs on your device: images are never uploaded",
    ],
  });

  const getWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("../workers/background-removal.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === "progress") setModel({ state: "loading", loaded: msg.loaded, total: msg.total });
      else if (msg.type === "ready") setModel((m) => ({ ...m, state: "ready" }));
      else if (msg.type === "result") {
        const ms = Date.now() - (startedRef.current[msg.id] ?? Date.now());
        setItems((list) =>
          list.map((it) => (it.id === msg.id ? { ...it, status: "done", ms, mask: { width: msg.width, height: msg.height, data: msg.mask } } : it))
        );
      } else if (msg.type === "error") {
        setItems((list) => list.map((it) => (it.id === msg.id ? { ...it, status: "error", error: msg.message } : it)));
        setModel((m) => (m.state === "ready" ? m : { ...m, state: "idle" }));
      }
    };
    workerRef.current = worker;
    return worker;
  }, []);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Process one image at a time.
  useEffect(() => {
    if (items.some((i) => i.status === "processing")) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;
    setItems((list) => list.map((it) => (it.id === next.id ? { ...it, status: "processing" } : it)));
    setModel((m) => (m.state === "idle" ? { ...m, state: "loading" } : m));
    startedRef.current[next.id] = Date.now();
    getWorker().postMessage({ id: next.id, blob: next.file } satisfies WorkerRequest);
  }, [items, getWorker]);

  const addFiles = (files: File[]) => {
    const added = files.map((file) => ({ id: nextId++, file, url: URL.createObjectURL(file), status: "queued" as const }));
    setItems((list) => [...list, ...added]);
    setSelected((s) => s ?? added[0]?.id ?? null);
  };

  const remove = (id: number) => {
    setItems((list) => {
      const it = list.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.url);
      return list.filter((x) => x.id !== id);
    });
    setSelected((s) => (s === id ? null : s));
  };

  const current = items.find((i) => i.id === selected) ?? items[0];
  const done = items.filter((i) => i.status === "done");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const exportOne = async (item: Item, type: "image/png" | "image/jpeg") => {
    const canvas = await composite(item, settings);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.92));
    if (blob) downloadBlob(blob, `${baseName(item.file.name)}-no-bg.${type === "image/png" ? "png" : "jpg"}`);
  };

  const exportAll = async () => {
    const files = [];
    for (const item of done) {
      const canvas = await composite(item, settings);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (blob) files.push({ name: `${baseName(item.file.name)}-no-bg.png`, data: blob });
    }
    await downloadZip(files, "background-removed.zip");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <ToolHeader
        title="Background Remover"
        subtitle="Remove image backgrounds automatically. The AI runs on your device, so your photos are never uploaded."
      />

      <FileDropArea onFiles={addFiles} accept="image/*" multiple listenToPaste hint="JPG, PNG or WebP. Drop, click or paste images." />

      {model.state === "loading" ? (
        <Panel className="space-y-2 p-4 sm:p-4">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {model.total ? `Downloading the AI model (one time only): ${formatBytes(model.loaded)} of ${formatBytes(model.total)}` : "Loading the AI model…"}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${model.total ? (model.loaded / model.total) * 100 : 5}%` }} />
          </div>
        </Panel>
      ) : null}

      {items.length ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {current ? <Preview item={current} settings={settings} /> : null}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map((it) => (
                <div key={it.id} className="relative shrink-0">
                  <button
                    onClick={() => setSelected(it.id)}
                    className={cn(
                      "block size-20 overflow-hidden rounded-md border-2",
                      current?.id === it.id ? "border-blue-600" : "border-transparent"
                    )}
                  >
                    <img src={it.url} alt={it.file.name} className="size-full object-cover" />
                    {it.status !== "done" ? (
                      <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                        {it.status === "error" ? <X className="size-5" /> : <Loader2 className="size-5 animate-spin" />}
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow"
                    aria-label={`Remove ${it.file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Panel>
              <Field label="Background">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["transparent", "Transparent"],
                      ["color", "Colour"],
                      ["blur", "Blur"],
                      ["image", "Image"],
                    ] as const
                  ).map(([m, label]) => (
                    <Chip key={m} active={settings.mode === m} onClick={() => set("mode", m)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </Field>
              {settings.mode === "color" ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("color", c)}
                      className={cn("size-8 rounded-full border-2", settings.color === c ? "border-blue-600 ring-2 ring-blue-300" : "border-border")}
                      style={{ background: c }}
                      aria-label={`Background ${c}`}
                    />
                  ))}
                  <input type="color" value={settings.color} onChange={(e) => set("color", e.target.value)} className="size-8 cursor-pointer rounded" aria-label="Custom colour" />
                </div>
              ) : null}
              {settings.mode === "blur" ? (
                <Field label={`Blur strength: ${settings.blur}px`}>
                  <input type="range" min={2} max={40} value={settings.blur} onChange={(e) => set("blur", Number(e.target.value))} className="w-full" />
                </Field>
              ) : null}
              {settings.mode === "image" ? (
                <FileDropArea
                  accept="image/*"
                  onFiles={(f) => {
                    if (settings.bgImage) URL.revokeObjectURL(settings.bgImage);
                    set("bgImage", URL.createObjectURL(f[0]));
                  }}
                  hint={settings.bgImage ? "Background chosen. Drop another to replace it." : "Choose a background picture"}
                  className="py-4"
                />
              ) : null}
              <Field label={`Edge cleanup: ${settings.cleanup}%`} hint="Higher removes faint leftovers; lower keeps soft edges like hair.">
                <input type="range" min={0} max={100} value={settings.cleanup} onChange={(e) => set("cleanup", Number(e.target.value))} className="w-full" />
              </Field>
              <label className="flex items-center justify-between text-sm">
                Crop to the subject
                <Switch checked={settings.crop} onCheckedChange={(v) => set("crop", v)} />
              </label>
            </Panel>
            {current?.status === "done" ? (
              <Panel className="space-y-2">
                <Button className="w-full" onClick={() => exportOne(current, "image/png")}>
                  <Download className="size-4" /> Download PNG
                </Button>
                {settings.mode !== "transparent" ? (
                  <Button className="w-full" variant="outline" onClick={() => exportOne(current, "image/jpeg")}>
                    <Download className="size-4" /> Download JPG
                  </Button>
                ) : null}
                {done.length > 1 ? (
                  <Button className="w-full" variant="outline" onClick={exportAll}>
                    <Download className="size-4" /> Download all ({done.length}) as zip
                  </Button>
                ) : null}
                {current.ms ? <p className="text-center text-xs text-muted-foreground">Processed in {(current.ms / 1000).toFixed(1)}s</p> : null}
              </Panel>
            ) : null}
            {items.length > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  items.forEach((i) => URL.revokeObjectURL(i.url));
                  setItems([]);
                  setSelected(null);
                }}
              >
                <Trash2 className="size-4" /> Remove all
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <Panel>
          <h2 className="text-sm font-semibold">Good to know</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>The first time you use it, the browser downloads a 44 MB AI model. After that it works offline and starts instantly.</li>
            <li>Works best on people, animals, products and objects with a clear subject.</li>
            <li>Use a white or blue background for passport and ID photos, then crop them in Image Tools.</li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

function Preview({ item, settings }: { item: Item; settings: Settings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [split, setSplit] = useState(100);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (item.status !== "done") return;
    let cancelled = false;
    composite(item, settings, 1400).then((c) => {
      const target = canvasRef.current;
      if (cancelled || !target) return;
      target.width = c.width;
      target.height = c.height;
      target.getContext("2d")!.drawImage(c, 0, 0);
      setSize({ w: c.width, h: c.height });
    });
    return () => {
      cancelled = true;
    };
  }, [item, settings]);

  if (item.status === "error") {
    return (
      <Panel>
        <p className="text-sm text-red-600">Could not process {item.file.name}: {item.error}</p>
      </Panel>
    );
  }

  return (
    <Panel className="space-y-3 p-3 sm:p-3">
      <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-md" style={{ background: CHECKER }}>
        {item.status === "done" ? (
          <>
            <canvas ref={canvasRef} className="block max-h-[65vh] max-w-full" style={size ? { aspectRatio: `${size.w}/${size.h}` } : undefined} data-testid="bg-result" />
            {!settings.crop && split < 100 ? (
              <img
                src={item.url}
                alt="Original"
                className="absolute inset-0 size-full object-fill"
                style={{ clipPath: `inset(0 0 0 ${split}%)` }}
              />
            ) : null}
          </>
        ) : (
          <div className="relative">
            <img src={item.url} alt={item.file.name} className="block max-h-[65vh] max-w-full opacity-60" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow">
                <Loader2 className="size-4 animate-spin" /> {item.status === "queued" ? "Waiting…" : "Removing background…"}
              </span>
            </div>
          </div>
        )}
      </div>
      {item.status === "done" && !settings.crop ? (
        <label className="flex items-center gap-3 text-xs text-muted-foreground">
          Compare
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="flex-1" aria-label="Compare with original" />
        </label>
      ) : null}
    </Panel>
  );
}

/* ------------------------------------------------------------ Compositing -- */

const bitmapCache = new WeakMap<File, Promise<ImageBitmap>>();
function bitmapOf(file: File) {
  let p = bitmapCache.get(file);
  if (!p) {
    p = createImageBitmap(file);
    bitmapCache.set(file, p);
  }
  return p;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function refineAlpha(a: number, cleanup: number) {
  const low = (cleanup / 100) * 0.3;
  const high = 1 - (cleanup / 100) * 0.3;
  const t = Math.min(1, Math.max(0, (a / 255 - low) / (high - low)));
  return Math.round(t * t * (3 - 2 * t) * 255);
}

function subjectBox(mask: Mask) {
  let minX = mask.width,
    minY = mask.height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[y * mask.width + x] > 100) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: mask.width, h: mask.height };
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return { x, y, w: Math.min(mask.width, maxX + pad + 1) - x, h: Math.min(mask.height, maxY + pad + 1) - y };
}

/** Draw the cut-out subject over the chosen background. `maxSide` limits the size for previews. */
async function composite(item: Item, settings: Settings, maxSide = Infinity): Promise<HTMLCanvasElement> {
  const mask = item.mask!;
  const bitmap = await bitmapOf(item.file);
  const W = mask.width;
  const H = mask.height;

  // Foreground: original pixels with the refined mask as alpha.
  const fg = document.createElement("canvas");
  fg.width = W;
  fg.height = H;
  const fctx = fg.getContext("2d", { willReadFrequently: true })!;
  fctx.drawImage(bitmap, 0, 0, W, H);
  const pixels = fctx.getImageData(0, 0, W, H);
  const lut = new Uint8Array(256).map((_, a) => refineAlpha(a, settings.cleanup));
  for (let i = 0; i < mask.data.length; i++) pixels.data[i * 4 + 3] = lut[mask.data[i]];
  fctx.putImageData(pixels, 0, 0);

  const box = settings.crop ? subjectBox(mask) : { x: 0, y: 0, w: W, h: H };
  const scale = Math.min(1, maxSide / Math.max(box.w, box.h));
  const out = document.createElement("canvas");
  out.width = Math.round(box.w * scale);
  out.height = Math.round(box.h * scale);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";

  if (settings.mode === "color") {
    ctx.fillStyle = settings.color;
    ctx.fillRect(0, 0, out.width, out.height);
  } else if (settings.mode === "blur") {
    const radius = settings.blur * scale * Math.max(1, W / 1000);
    ctx.filter = `blur(${radius}px)`;
    // Draw a little larger than the canvas so the blur doesn't fade to transparent at the edges.
    const m = radius * 2;
    ctx.drawImage(bitmap, box.x, box.y, box.w, box.h, -m, -m, out.width + 2 * m, out.height + 2 * m);
    ctx.filter = "none";
  } else if (settings.mode === "image" && settings.bgImage) {
    const bg = await loadImage(settings.bgImage);
    const s = Math.max(out.width / bg.naturalWidth, out.height / bg.naturalHeight);
    const bw = bg.naturalWidth * s;
    const bh = bg.naturalHeight * s;
    ctx.drawImage(bg, (out.width - bw) / 2, (out.height - bh) / 2, bw, bh);
  }
  ctx.drawImage(fg, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);
  return out;
}
