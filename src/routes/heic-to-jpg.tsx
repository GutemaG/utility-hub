import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileDropArea } from "@/components/file-drop-area";
import { Chip, Field, Panel, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { baseName, downloadBlob, downloadZip, formatBytes } from "@/lib/files";

export const Route = createFileRoute("/heic-to-jpg")({
  component: RouteComponent,
});

type OutFormat = "image/jpeg" | "image/png" | "image/webp";
const FORMATS: { value: OutFormat; label: string; ext: string }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

type Item = {
  id: number;
  file: File;
  status: "queued" | "converting" | "done" | "error";
  out?: Blob;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
};

let nextId = 1;

function RouteComponent() {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<OutFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const busy = useRef(false);

  useSEO({
    title: "HEIC to JPG Converter, Free & Private | Utility Hub",
    description:
      "Convert iPhone HEIC/HEIF photos to JPG, PNG or WebP in bulk. Runs in your browser, so your photos are never uploaded.",
    path: "/heic-to-jpg",
    keywords: "heic to jpg, heic to png, heif to jpg, convert iphone photos, heic converter, open heic on windows",
    applicationCategory: "MultimediaApplication",
    featureList: ["HEIC/HEIF to JPG, PNG or WebP", "Batch conversion with zip download", "Adjustable JPG quality", "Photos never leave your device"],
  });

  // Convert queued items one at a time; re-runs whenever the list or settings change
  useEffect(() => {
    if (busy.current) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;
    busy.current = true;
    setItems((prev) => prev.map((i) => (i.id === next.id ? { ...i, status: "converting" } : i)));
    convert(next.file, format, quality / 100)
      .then(({ blob, width, height }) => {
        const url = URL.createObjectURL(blob);
        setItems((prev) => prev.map((i) => (i.id === next.id ? { ...i, status: "done", out: blob, url, width, height } : i)));
      })
      .catch((e: unknown) => {
        setItems((prev) =>
          prev.map((i) => (i.id === next.id ? { ...i, status: "error", error: e instanceof Error ? e.message : "Could not convert this file." } : i))
        );
      })
      .finally(() => {
        busy.current = false;
        setItems((prev) => [...prev]); // nudge the effect to pick up the next file
      });
  }, [items, format, quality]);

  // Changing the output settings re-converts everything
  const reconvert = (nextFormat: OutFormat, nextQuality: number) => {
    setFormat(nextFormat);
    setQuality(nextQuality);
    setItems((prev) =>
      prev.map((i) => {
        if (i.url) URL.revokeObjectURL(i.url);
        // New id, so a conversion still running with the old settings can't overwrite the new result
        return { id: nextId++, file: i.file, status: "queued" };
      })
    );
  };

  const ext = FORMATS.find((f) => f.value === format)!.ext;
  const done = items.filter((i) => i.status === "done" && i.out);
  const working = items.some((i) => i.status === "queued" || i.status === "converting");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <ToolHeader title="HEIC to JPG Converter" subtitle="Turn iPhone HEIC photos into JPG, PNG or WebP that open everywhere. Your photos stay on your device." />

      <Panel>
        <FileDropArea
          accept=".heic,.heif,image/heic,image/heif"
          multiple
          onFiles={(files) => setItems((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, status: "queued" as const }))])}
          hint="Drop one or many .heic / .heif photos"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Convert to">
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <Chip key={f.value} active={format === f.value} onClick={() => reconvert(f.value, quality)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </Field>
          {format !== "image/png" ? (
            <Field label={`Quality (${quality}%)`}>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                onPointerUp={() => reconvert(format, quality)}
                onKeyUp={() => reconvert(format, quality)}
                className="w-full"
              />
            </Field>
          ) : null}
        </div>
        {items.length ? (
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!done.length || working}
              onClick={() =>
                done.length === 1
                  ? downloadBlob(done[0].out!, `${baseName(done[0].file.name)}.${ext}`)
                  : downloadZip(done.map((i) => ({ name: `${baseName(i.file.name)}.${ext}`, data: i.out! })), "converted-photos.zip")
              }
            >
              <Download className="h-4 w-4" /> {done.length > 1 ? `Download all (${done.length}) as .zip` : "Download"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
                setItems([]);
              }}
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        ) : null}
      </Panel>

      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.id} className="space-y-2 rounded-lg border border-border bg-card p-2" data-testid="heic-item">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded bg-muted">
                {i.url ? (
                  <img src={i.url} alt={i.file.name} className="h-full w-full object-cover" />
                ) : i.status === "error" ? (
                  <span className="p-2 text-center text-xs text-red-600">{i.error}</span>
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="truncate text-xs font-medium" title={i.file.name}>
                {i.file.name}
              </div>
              {i.out ? (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {i.width}×{i.height} · {formatBytes(i.out.size)}
                  </span>
                  <button className="text-blue-600 hover:underline" onClick={() => downloadBlob(i.out!, `${baseName(i.file.name)}.${ext}`)}>
                    Save
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <p>
          iPhones save photos as HEIC, which Windows, many websites and older apps can't open. This converter decodes them in your browser
          (the decoder downloads once, about 3 MB), so nothing is uploaded.
        </p>
      </div>
    </div>
  );
}

async function decode(file: File): Promise<ImageBitmap> {
  // Safari (and some Chromium builds on Mac) can decode HEIC natively, which is fastest
  try {
    return await createImageBitmap(file);
  } catch {
    const { heicTo } = await import("heic-to");
    try {
      return await heicTo({ blob: file, type: "bitmap" });
    } catch {
      throw new Error("Not a readable HEIC/HEIF photo.");
    }
  }
}

async function convert(file: File, type: OutFormat, quality: number) {
  const bitmap = await decode(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
    if (!blob) throw new Error("Could not encode the image.");
    return { blob, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
