import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Worker as TesseractWorker } from "tesseract.js";
import { Copy, Download, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileDropArea } from "@/components/file-drop-area";
import { Chip, Field, Panel, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { baseName, downloadBlob } from "@/lib/files";
import { renderPdfPages } from "@/lib/pdfjs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/image-to-text")({
  component: RouteComponent,
});

const LANGUAGES: { code: string; label: string }[] = [
  { code: "eng", label: "English" },
  { code: "amh", label: "አማርኛ Amharic" },
  { code: "tir", label: "ትግርኛ Tigrinya" },
  { code: "ara", label: "Arabic" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "deu", label: "German" },
  { code: "ita", label: "Italian" },
  { code: "por", label: "Portuguese" },
  { code: "tur", label: "Turkish" },
  { code: "rus", label: "Russian" },
  { code: "hin", label: "Hindi" },
  { code: "chi_sim", label: "Chinese" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
];

type Item = {
  id: number;
  file: File;
  url: string | null; // preview for images
  status: "queued" | "working" | "done" | "error";
  progress: number;
  text: string;
  confidence?: number;
  pages?: number;
  error?: string;
};

let nextId = 1;

function RouteComponent() {
  const [langs, setLangs] = useState<string[]>(["eng"]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [stage, setStage] = useState("");
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<{ key: string; worker: Promise<TesseractWorker> } | null>(null);
  const activeId = useRef<number | null>(null);
  const onProgressRef = useRef<(status: string, p: number) => void>(() => {});

  useSEO({
    title: "Image to Text (OCR): Extract Text from Images & Scanned PDFs | Utility Hub",
    description:
      "Free OCR that copies text from photos, screenshots and scanned PDFs. Supports Amharic, Tigrinya, English, Arabic and more. Runs in your browser so your documents stay private.",
    path: "/image-to-text",
    keywords:
      "image to text, ocr, extract text from image, jpg to text, picture to text, amharic ocr, scanned pdf to text, copy text from image, screenshot to text",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Extract text from JPG, PNG, WebP and screenshots",
      "Scanned PDF to text, page by page",
      "Amharic, Tigrinya, English and 12 more languages",
      "Copy or download as .txt",
      "Private: runs entirely in your browser",
    ],
  });

  const langKey = langs.join("+");

  const getWorker = (onProgress: (status: string, p: number) => void) => {
    if (workerRef.current?.key !== langKey) {
      workerRef.current?.worker.then((w) => w.terminate()).catch(() => {});
      const worker = import("tesseract.js").then(({ createWorker }) =>
        createWorker(langs, 1, {
          logger: (m) => {
            if (activeId.current !== null) onProgressRef.current(m.status, m.progress);
          },
        })
      );
      workerRef.current = { key: langKey, worker };
    }
    onProgressRef.current = onProgress;
    return workerRef.current.worker;
  };
  useEffect(() => () => void workerRef.current?.worker.then((w) => w.terminate()).catch(() => {}), []);

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  // OCR one file at a time.
  useEffect(() => {
    if (items.some((i) => i.status === "working")) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) {
      setStage("");
      return;
    }
    update(next.id, { status: "working", progress: 0 });
    activeId.current = next.id;
    (async () => {
      try {
        let pageInfo = { n: 1, total: 1 };
        const worker = await getWorker((status, p) => {
          setStage(status);
          if (status === "recognizing text") update(next.id, { progress: (pageInfo.n - 1 + p) / pageInfo.total });
        });
        const isPdf = next.file.type === "application/pdf" || next.file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const texts: string[] = [];
          const confidences: number[] = [];
          for await (const { canvas, pageNumber, pageCount } of renderPdfPages(next.file, 2.5)) {
            pageInfo = { n: pageNumber, total: pageCount };
            const { data } = await worker.recognize(canvas);
            texts.push(pageCount > 1 ? `--- Page ${pageNumber} ---\n${tidy(data.text)}` : tidy(data.text));
            confidences.push(data.confidence);
            update(next.id, { text: texts.join("\n\n"), pages: pageCount, progress: pageNumber / pageCount });
          }
          update(next.id, { status: "done", confidence: avg(confidences) });
        } else {
          const { data } = await worker.recognize(next.file);
          update(next.id, { status: "done", text: tidy(data.text), confidence: data.confidence, progress: 1 });
        }
      } catch (err) {
        update(next.id, { status: "error", error: err instanceof Error ? err.message : String(err) });
      } finally {
        activeId.current = null;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addFiles = (files: File[]) => {
    const added: Item[] = files.map((file) => ({
      id: nextId++,
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      status: "queued",
      progress: 0,
      text: "",
    }));
    setItems((list) => [...list, ...added]);
    setSelected(added[0]?.id ?? null);
  };

  const remove = (id: number) => {
    setItems((list) => {
      const it = list.find((x) => x.id === id);
      if (it?.url) URL.revokeObjectURL(it.url);
      return list.filter((x) => x.id !== id);
    });
  };

  const rerun = () => setItems((list) => list.map((it) => (it.status === "working" ? it : { ...it, status: "queued", text: "", progress: 0 })));

  const toggleLang = (code: string) =>
    setLangs((l) => (l.includes(code) ? (l.length > 1 ? l.filter((x) => x !== code) : l) : [...l, code]));

  const current = items.find((i) => i.id === selected) ?? items[0];
  const allText = items
    .filter((i) => i.text)
    .map((i) => (items.length > 1 ? `=== ${i.file.name} ===\n${i.text}` : i.text))
    .join("\n\n");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <ToolHeader
        title="Image to Text (OCR)"
        subtitle="Copy the text out of photos, screenshots and scanned PDFs, including Amharic. Nothing is uploaded."
      />

      <Panel>
        <Field label="Text language(s) in the image" hint="Pick every language that appears. Each one downloads once (0.3–2 MB) and is then cached.">
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((l) => (
              <Chip key={l.code} active={langs.includes(l.code)} onClick={() => toggleLang(l.code)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </Field>
        {items.some((i) => i.status === "done" || i.status === "error") ? (
          <Button variant="outline" size="sm" onClick={rerun}>
            Run again with these languages
          </Button>
        ) : null}
      </Panel>

      <FileDropArea
        onFiles={addFiles}
        accept="image/*,application/pdf,.pdf"
        multiple
        listenToPaste
        hint="Images or scanned PDFs. You can also paste a screenshot (Ctrl+V)."
      />

      {items.length ? (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border p-2",
                  current?.id === it.id ? "border-blue-600" : "border-border hover:bg-accent/40"
                )}
                onClick={() => setSelected(it.id)}
              >
                {it.url ? (
                  <img src={it.url} alt="" className="size-12 shrink-0 rounded object-cover" />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded bg-muted text-xs font-bold">PDF</div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <div className="truncate font-medium">{it.file.name}</div>
                  <div className="text-muted-foreground">
                    {it.status === "queued" && "Waiting…"}
                    {it.status === "working" && `${Math.round(it.progress * 100)}%`}
                    {it.status === "done" && `${it.text.split(/\s+/).filter(Boolean).length} words · ${Math.round(it.confidence ?? 0)}% confidence`}
                    {it.status === "error" && <span className="text-red-600">Failed</span>}
                  </div>
                  {it.status === "working" ? (
                    <div className="mt-1 h-1 overflow-hidden rounded bg-muted">
                      <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.max(3, it.progress * 100)}%` }} />
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(it.id);
                  }}
                  aria-label={`Remove ${it.file.name}`}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {items.length > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => items.forEach((i) => remove(i.id))}>
                <Trash2 className="size-4" /> Remove all
              </Button>
            ) : null}
          </div>

          {current ? (
            <Panel className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="truncate text-sm font-semibold">{current.file.name}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!current.text}
                    onClick={async () => {
                      setCopied(await copyText(current.text));
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!current.text}
                    onClick={() => downloadBlob(new Blob([current.text], { type: "text/plain;charset=utf-8" }), `${baseName(current.file.name)}.txt`)}
                  >
                    <Download className="size-4" /> .txt
                  </Button>
                  {items.length > 1 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!allText}
                      onClick={() => downloadBlob(new Blob([allText], { type: "text/plain;charset=utf-8" }), "extracted-text.txt")}
                    >
                      <Download className="size-4" /> All
                    </Button>
                  ) : null}
                </div>
              </div>
              {current.status === "working" || current.status === "queued" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {current.status === "queued" ? "Waiting for the previous file…" : stageLabel(stage)}
                  {current.pages ? ` (page ${Math.min(current.pages, Math.floor(current.progress * current.pages) + 1)} of ${current.pages})` : ""}
                </div>
              ) : null}
              {current.status === "error" ? <p className="text-sm text-red-600">Could not read this file: {current.error}</p> : null}
              <div className={cn("grid gap-3", current.url && "md:grid-cols-2")}>
                {current.url ? <img src={current.url} alt="" className="max-h-[60vh] w-full rounded-md border border-border object-contain" /> : null}
                <Textarea
                  value={current.text}
                  onChange={(e) => update(current.id, { text: e.target.value })}
                  rows={18}
                  placeholder={current.status === "done" ? "No text found." : ""}
                  className="min-h-[300px] font-[system-ui,'Noto_Sans_Ethiopic',sans-serif] text-sm"
                  data-testid="ocr-text"
                />
              </div>
            </Panel>
          ) : null}
        </div>
      ) : (
        <Panel>
          <h2 className="text-sm font-semibold">Tips for better results</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Use a sharp, well-lit photo taken straight on. Screenshots work best.</li>
            <li>Select only the languages in the image: extra languages slow it down and can reduce accuracy.</li>
            <li>Afaan Oromo and Somali use Latin letters, so choose English for them.</li>
            <li>Handwriting is not supported well; printed text is.</li>
          </ul>
        </Panel>
      )}
    </div>
  );
}

/** Tesseract often reads the Ethiopic full stop (።) as two wordspaces (፡፡). */
function tidy(text: string) {
  return text.trim().replace(/፡\s?፡/g, "።");
}

function avg(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stageLabel(stage: string) {
  if (!stage) return "Starting…";
  if (stage.includes("loading language") || stage.includes("loading tesseract")) return "Downloading language data…";
  if (stage.includes("initializ")) return "Preparing…";
  if (stage.includes("recognizing")) return "Reading text…";
  return stage[0].toUpperCase() + stage.slice(1) + "…";
}
