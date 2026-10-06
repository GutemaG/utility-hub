import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { PDFDocument as PDFDocumentType } from "pdf-lib";
import type * as PdfJs from "pdfjs-dist";
import { ArrowDown, ArrowUp, Download, FileText, ImageIcon, RotateCcw, RotateCw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropArea } from "@/components/file-drop-area";
import { useSEO } from "@/hooks/use-seo";
import { baseName, downloadBytes, downloadZip, formatBytes } from "@/lib/files";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pdf-tools")({
  component: RouteComponent,
});

// pdf-lib edits PDFs; pdf.js only draws page thumbnails. Both load on first use.
const loadPdfLib = () => import("pdf-lib");

let pdfjsPromise: Promise<typeof PdfJs> | null = null;
function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]).then(
      ([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfjs;
      }
    );
  }
  return pdfjsPromise;
}

type Tab = "merge" | "organize" | "images";

const TABS: { key: Tab; label: string }[] = [
  { key: "merge", label: "Merge" },
  { key: "organize", label: "Organize & Split" },
  { key: "images", label: "Images → PDF" },
];

let nextId = 1;

function RouteComponent() {
  const [tab, setTab] = useState<Tab>("merge");

  useSEO({
    title: "PDF Tools: Merge, Split, Organize & Images to PDF | Utility Hub",
    description:
      "Merge PDFs, split or extract pages, reorder, rotate and delete pages, and convert JPG/PNG images to PDF. Free and private: files are processed in your browser and never uploaded.",
    path: "/pdf-tools",
    keywords: "merge pdf, split pdf, extract pdf pages, rotate pdf, reorder pdf pages, delete pdf pages, jpg to pdf, images to pdf",
    applicationCategory: "BusinessApplication",
    featureList: [
      "Merge PDFs and images into one PDF",
      "Reorder, rotate and delete pages with thumbnails",
      "Extract selected pages or split by ranges or every N pages",
      "Convert images to PDF with page size and margins",
      "No uploads: everything runs on your device",
    ],
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">PDF Tools</h1>
        <p className="text-muted-foreground">
          Merge, split, reorder, rotate and create PDFs. Your files stay on your device.
        </p>
      </div>

      <div className="inline-flex flex-wrap rounded-lg border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === t.key ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "merge" ? <MergeTool /> : tab === "organize" ? <OrganizeTool /> : <ImagesToPdfTool />}
    </div>
  );
}

// ---------------- Merge ----------------

type MergeItem = { id: number; file: File; pages: number | null; error?: string };

function MergeTool() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: File[]) => {
    const added = files.map((file) => ({ id: nextId++, file, pages: null as number | null }));
    setItems((prev) => [...prev, ...added]);
    const { PDFDocument } = await loadPdfLib();
    for (const item of added) {
      let pages: number | null = 1;
      let err: string | undefined;
      if (isPdf(item.file)) {
        try {
          pages = (await openPdf(PDFDocument, item.file)).getPageCount();
        } catch (e) {
          pages = null;
          err = e instanceof Error ? e.message : "Could not read this PDF.";
        }
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, pages, error: err } : i)));
    }
  };

  const merge = async () => {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const out = await PDFDocument.create();
      for (const item of items) {
        if (item.error) continue;
        if (isPdf(item.file)) {
          const src = await openPdf(PDFDocument, item.file);
          const pages = await out.copyPages(src, src.getPageIndices());
          pages.forEach((p) => out.addPage(p));
        } else {
          await addImagePage(out, item.file, { pageSize: "fit", margin: 0, orientation: "auto" });
        }
      }
      downloadBytes(await out.save(), "merged.pdf", "application/pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merging failed.");
    } finally {
      setBusy(false);
    }
  };

  const usable = items.filter((i) => !i.error);
  const totalPages = usable.reduce((n, i) => n + (i.pages ?? 0), 0);

  return (
    <Panel>
      <FileDropArea accept="application/pdf,.pdf,image/jpeg,image/png,image/webp" multiple onFiles={addFiles} hint="Add PDFs (and images, which become one page each). Reorder them below." />
      {items.length ? (
        <>
          <ReorderList
            items={items}
            onChange={setItems}
            render={(item) => (
              <>
                {isPdf(item.file) ? <FileText className="h-5 w-5 shrink-0 text-red-500" /> : <ImageIcon className="h-5 w-5 shrink-0 text-blue-500" />}
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate font-medium">{item.file.name}</div>
                  <div className={cn("text-xs", item.error ? "text-red-600" : "text-muted-foreground")}>
                    {item.error ?? `${item.pages === null ? "…" : `${item.pages} page${item.pages === 1 ? "" : "s"}`} · ${formatBytes(item.file.size)}`}
                  </div>
                </div>
              </>
            )}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={merge} disabled={busy || usable.length < 1}>
              <Download className="h-4 w-4" /> {busy ? "Merging…" : `Merge ${usable.length} file${usable.length === 1 ? "" : "s"}`}
            </Button>
            <span className="text-sm text-muted-foreground">{totalPages} pages in total</span>
            <Button variant="ghost" onClick={() => setItems([])}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Panel>
  );
}

// ---------------- Organize & split ----------------

type PageItem = { key: number; index: number; rotation: number; thumb: string | null; selected: boolean; width: number; height: number };
type SplitMode = "each" | "every" | "ranges";

function OrganizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("ranges");
  const [every, setEvery] = useState("2");
  const [ranges, setRanges] = useState("1-3, 4-");
  const dragKey = useRef<number | null>(null);
  // Bumped on every load so a slow thumbnail loop from a previous file stops writing
  const loadToken = useRef(0);

  const load = async (f: File) => {
    const token = ++loadToken.current;
    setFile(f);
    setPages([]);
    setError(null);
    setLoading(true);
    try {
      const { PDFDocument } = await loadPdfLib();
      await openPdf(PDFDocument, f); // surfaces encryption / corruption errors early
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      const initial: PageItem[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        initial.push({ key: nextId++, index: i - 1, rotation: 0, thumb: null, selected: false, width: vp.width, height: vp.height });
      }
      if (token !== loadToken.current) return;
      setPages(initial);
      setLoading(false);
      // Thumbnails render progressively so big documents become usable right away
      for (let i = 1; i <= doc.numPages && token === loadToken.current; i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 160 / Math.max(base.width, base.height) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
        const thumb = canvas.toDataURL("image/jpeg", 0.7);
        if (token === loadToken.current) {
          setPages((prev) => prev.map((p) => (p.index === i - 1 && !p.thumb ? { ...p, thumb } : p)));
        }
      }
      doc.destroy();
    } catch (e) {
      if (token !== loadToken.current) return;
      setError(e instanceof Error ? e.message : "Could not open this PDF.");
      setLoading(false);
    }
  };

  const update = (key: number, change: Partial<PageItem>) => setPages((prev) => prev.map((p) => (p.key === key ? { ...p, ...change } : p)));
  const selected = pages.filter((p) => p.selected);

  const build = async (subset: PageItem[]) => {
    const { PDFDocument, degrees } = await loadPdfLib();
    const src = await openPdf(PDFDocument, file!);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, subset.map((p) => p.index));
    copied.forEach((page, i) => {
      page.setRotation(degrees((page.getRotation().angle + subset[i].rotation) % 360));
      out.addPage(page);
    });
    return out.save();
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const name = file ? baseName(file.name) : "document";

  const split = () =>
    run(async () => {
      let groups: PageItem[][];
      if (splitMode === "each") {
        groups = pages.map((p) => [p]);
      } else if (splitMode === "every") {
        const n = Math.max(1, Number(every) || 1);
        groups = [];
        for (let i = 0; i < pages.length; i += n) groups.push(pages.slice(i, i + n));
      } else {
        groups = parseRanges(ranges, pages.length).map(([a, b]) => pages.slice(a - 1, b));
      }
      groups = groups.filter((g) => g.length);
      if (!groups.length) throw new Error("No pages match those ranges.");
      const files = [];
      for (const g of groups) {
        const first = pages.indexOf(g[0]) + 1;
        const last = pages.indexOf(g[g.length - 1]) + 1;
        files.push({ name: `${name}-${first === last ? `p${first}` : `p${first}-${last}`}.pdf`, data: await build(g) });
      }
      if (files.length === 1) downloadBytes(files[0].data, files[0].name, "application/pdf");
      else await downloadZip(files, `${name}-split.zip`);
    });

  return (
    <Panel>
      <FileDropArea accept="application/pdf,.pdf" onFiles={(f) => load(f[0])} hint="One PDF. Drag pages to reorder; rotate, delete or select them." />
      {loading ? <p className="text-sm text-muted-foreground">Opening PDF…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {pages.length ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {file?.name} · {pages.length} pages{selected.length ? ` · ${selected.length} selected` : ""}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setPages((p) => p.map((x) => ({ ...x, selected: !selected.length })))}>
              {selected.length ? "Clear selection" : "Select all"}
            </Button>
            {selected.length ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setPages((p) => p.map((x) => (x.selected ? { ...x, rotation: (x.rotation + 90) % 360 } : x)))}>
                  <RotateCw className="h-4 w-4" /> Rotate selected
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setPages((p) => p.filter((x) => !x.selected))}>
                  <Trash2 className="h-4 w-4" /> Delete selected
                </Button>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {pages.map((p, i) => (
              <div
                key={p.key}
                draggable
                onDragStart={() => (dragKey.current = p.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = pages.findIndex((x) => x.key === dragKey.current);
                  if (from < 0 || from === i) return;
                  const next = [...pages];
                  const [moved] = next.splice(from, 1);
                  next.splice(i, 0, moved);
                  setPages(next);
                }}
                className={cn(
                  "group relative flex cursor-grab flex-col items-center gap-1 rounded-lg border p-2 transition active:cursor-grabbing",
                  p.selected ? "border-blue-600 ring-2 ring-blue-200" : "border-border hover:border-ring"
                )}
              >
                <button className="flex h-36 w-full items-center justify-center" onClick={() => update(p.key, { selected: !p.selected })} title="Click to select">
                  {p.thumb ? (
                    <img src={p.thumb} alt={`Page ${p.index + 1}`} className="max-h-28 max-w-full border border-border bg-white shadow-sm transition-transform" style={{ transform: `rotate(${p.rotation}deg)` }} />
                  ) : (
                    <div className="h-28 w-20 animate-pulse rounded bg-muted" />
                  )}
                </button>
                <div className="flex w-full items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {i + 1}
                    {p.index !== i ? <span className="opacity-60"> (was {p.index + 1})</span> : null}
                  </span>
                  <span className="flex gap-0.5">
                    <IconButton label="Rotate left" onClick={() => update(p.key, { rotation: (p.rotation + 270) % 360 })}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="Rotate right" onClick={() => update(p.key, { rotation: (p.rotation + 90) % 360 })}>
                      <RotateCw className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="Delete page" onClick={() => setPages((prev) => prev.filter((x) => x.key !== p.key))}>
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={busy} onClick={() => run(async () => downloadBytes(await build(pages), `${name}-edited.pdf`, "application/pdf"))}>
              <Download className="h-4 w-4" /> Save PDF ({pages.length} pages)
            </Button>
            <Button variant="secondary" disabled={busy || !selected.length} onClick={() => run(async () => downloadBytes(await build(selected), `${name}-extract.pdf`, "application/pdf"))}>
              Extract selected ({selected.length})
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold">Split into several PDFs</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["ranges", "By ranges"],
                  ["every", "Every N pages"],
                  ["each", "One file per page"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSplitMode(k)}
                  className={cn("rounded-md border px-2 py-1 text-sm", splitMode === k ? "border-blue-600 bg-blue-600 text-white" : "border-border hover:bg-accent/50")}
                >
                  {label}
                </button>
              ))}
            </div>
            {splitMode === "ranges" ? (
              <div className="space-y-1">
                <Input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 4-6, 7-" />
                <p className="text-xs text-muted-foreground">
                  Each range becomes its own PDF. Page numbers follow the current order above; "7-" means page 7 to the end.
                </p>
              </div>
            ) : splitMode === "every" ? (
              <Input className="w-32" inputMode="numeric" value={every} onChange={(e) => setEvery(e.target.value.replace(/[^\d]/g, ""))} />
            ) : null}
            <Button variant="outline" disabled={busy} onClick={split}>
              {busy ? "Working…" : "Split & download"}
            </Button>
          </div>
        </>
      ) : null}
    </Panel>
  );
}

// ---------------- Images → PDF ----------------

type PageSize = "a4" | "letter" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type ImageItem = { id: number; file: File; url: string };

function ImagesToPdfTool() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await loadPdfLib();
      const out = await PDFDocument.create();
      for (const item of items) await addImagePage(out, item.file, { pageSize, orientation, margin });
      downloadBytes(await out.save(), items.length === 1 ? `${baseName(items[0].file.name)}.pdf` : "images.pdf", "application/pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <FileDropArea
        accept="image/*"
        multiple
        listenToPaste
        onFiles={(files) => setItems((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, url: URL.createObjectURL(file) }))])}
        hint="JPG, PNG, WebP and more. Each image becomes one page; phone photos are turned the right way up."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Page size">
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="fit">Same as image</option>
          </select>
        </Field>
        <Field label="Orientation">
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={orientation}
            disabled={pageSize === "fit"}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
          >
            <option value="auto">Match each image</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </Field>
        <Field label={`Margin (${margin} mm)`}>
          <input type="range" min={0} max={30} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full" />
        </Field>
      </div>

      {items.length ? (
        <>
          <ReorderList
            items={items}
            onChange={(next) => setItems(next)}
            onRemove={(item) => URL.revokeObjectURL(item.url)}
            render={(item) => (
              <>
                <img src={item.url} alt="" className="h-12 w-12 shrink-0 rounded border border-border object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate font-medium">{item.file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</div>
                </div>
              </>
            )}
          />
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={create} disabled={busy}>
              <Download className="h-4 w-4" /> {busy ? "Creating…" : `Create PDF (${items.length} page${items.length === 1 ? "" : "s"})`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                items.forEach((i) => URL.revokeObjectURL(i.url));
                setItems([]);
              }}
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Panel>
  );
}

// ---------------- PDF helpers ----------------

const PAGE_SIZES: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MM_TO_PT = 72 / 25.4;

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function openPdf(PDFDocument: typeof PDFDocumentType, file: File) {
  try {
    return await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  } catch (e) {
    if (e instanceof Error && /encrypt/i.test(e.message)) {
      throw new Error(`"${file.name}" is password-protected. Remove the password first, then try again.`);
    }
    throw new Error(`"${file.name}" isn't a readable PDF.`);
  }
}

async function addImagePage(
  doc: PDFDocumentType,
  file: File,
  opts: { pageSize: PageSize; orientation: Orientation; margin: number }
) {
  const { bytes, kind, width, height } = await imageForPdf(file);
  const image = kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

  // Images keep their pixel size in points (1px = 1pt, i.e. 72dpi) when the page matches the image
  if (opts.pageSize === "fit") {
    const page = doc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    return;
  }

  let [pw, ph] = PAGE_SIZES[opts.pageSize];
  const landscape = opts.orientation === "landscape" || (opts.orientation === "auto" && width > height);
  if (landscape) [pw, ph] = [ph, pw];
  const m = opts.margin * MM_TO_PT;
  const scale = Math.min((pw - 2 * m) / width, (ph - 2 * m) / height);
  const w = width * scale;
  const h = height * scale;
  const page = doc.addPage([pw, ph]);
  page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
}

// pdf-lib only embeds JPEG and PNG, and ignores EXIF rotation, so photos are redrawn upright first.
// PNGs pass through untouched to keep transparency and lossless quality.
async function imageForPdf(file: File): Promise<{ bytes: Uint8Array; kind: "jpg" | "png"; width: number; height: number }> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`"${file.name}" isn't an image this browser can read.`);
  });
  try {
    if (file.type === "image/png") {
      return { bytes: new Uint8Array(await file.arrayBuffer()), kind: "png", width: bitmap.width, height: bitmap.height };
    }
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not convert the image."))), "image/jpeg", 0.92)
    );
    return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: "jpg", width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

// "1-3, 5, 8-" → [[1,3],[5,5],[8,total]] (1-based, clamped, invalid parts ignored)
function parseRanges(input: string, total: number): [number, number][] {
  return input
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): [number, number] | null => {
      const m = /^(\d*)\s*-\s*(\d*)$/.exec(part);
      if (m) {
        const a = m[1] ? Number(m[1]) : 1;
        const b = m[2] ? Number(m[2]) : total;
        return [Math.max(1, Math.min(a, b)), Math.min(total, Math.max(a, b))];
      }
      const n = Number(part);
      return Number.isInteger(n) && n >= 1 && n <= total ? [n, n] : null;
    })
    .filter((r): r is [number, number] => !!r && r[0] <= r[1]);
}

// ---------------- UI helpers ----------------

function ReorderList<T extends { id: number }>({
  items,
  onChange,
  onRemove,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  onRemove?: (item: T) => void;
  render: (item: T) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
          <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
          {render(item)}
          <IconButton label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}>
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton label="Move down" onClick={() => move(i, i + 1)} disabled={i === items.length - 1}>
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Remove"
            onClick={() => {
              onRemove?.(item);
              onChange(items.filter((x) => x.id !== item.id));
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default RouteComponent;
