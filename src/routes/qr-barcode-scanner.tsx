import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type * as ZXingReader from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";
import { Camera, CameraOff, Copy, Flashlight, ImageIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileDropArea } from "@/components/file-drop-area";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { downloadBlob } from "@/lib/files";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qr-barcode-scanner")({
  component: RouteComponent,
});

type ReadResult = ZXingReader.ReadResult;

// The zxing reader (~1MB wasm) is only fetched once the user starts scanning. The wasm file is
// served from our own build instead of zxing-wasm's default jsDelivr URL so it works offline too.
let readerPromise: Promise<typeof ZXingReader> | null = null;
function loadReader() {
  if (!readerPromise) {
    readerPromise = import("zxing-wasm/reader").then((mod) => {
      mod.prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path),
        },
      });
      return mod;
    });
  }
  return readerPromise;
}

type ScanEntry = {
  id: number;
  text: string;
  format: string;
  contentType: string;
  time: Date;
};

const SCAN_INTERVAL_MS = 200;
// Ignore the same code seen again within this window so a held-still code isn't logged repeatedly
const DUPLICATE_WINDOW_MS = 3000;

function RouteComponent() {
  const [mode, setMode] = useState<"camera" | "image">("camera");
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [beep, setBeep] = useState(true);
  const nextId = useRef(1);
  const lastSeen = useRef<Map<string, number>>(new Map());

  useSEO({
    title: "QR & Barcode Scanner | Utility Hub",
    description:
      "Scan QR codes and barcodes with your camera or from an image. Reads QR, Data Matrix, PDF417, Aztec, MaxiCode, Code 128, Code 39, EAN/UPC, GS1 and more, entirely in your browser.",
    path: "/qr-barcode-scanner",
    keywords: "qr code scanner, barcode scanner, scan qr from image, data matrix reader, gs1 scanner, online barcode reader",
    applicationCategory: "Tool",
    featureList: [
      "Live camera scanning with torch support",
      "Scan from uploaded or pasted images",
      "1D and 2D formats including GS1 and MIL-STD-130 IUID",
      "Understands Wi‑Fi, contact, email, phone, SMS and link codes",
      "Scan history with copy and export",
      "Runs fully in the browser",
    ],
  });

  const addResults = useCallback(
    (results: ReadResult[], fromCamera: boolean) => {
      const now = Date.now();
      const fresh = results.filter((r) => {
        if (!fromCamera) return true;
        const key = `${r.format}:${r.text}`;
        const seen = lastSeen.current.get(key);
        lastSeen.current.set(key, now);
        return !seen || now - seen > DUPLICATE_WINDOW_MS;
      });
      if (!fresh.length) return;

      const entries = fresh.map((r) => ({
        id: nextId.current++,
        text: r.text,
        format: r.format,
        contentType: r.contentType,
        time: new Date(),
      }));
      setHistory((prev) => [...entries.reverse(), ...prev].slice(0, 100));
      setSelectedId(entries[0].id);
      if (beep) playBeep();
      navigator.vibrate?.(60);
    },
    [beep]
  );

  const selected = history.find((h) => h.id === selectedId) ?? history[0];

  const exportCsv = () => {
    const rows = [["time", "format", "content_type", "text"], ...history.map((h) => [h.time.toISOString(), formatLabel(h.format), h.contentType, h.text])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "scans.csv");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">QR & Barcode Scanner</h1>
        <p className="text-muted-foreground">
          Scan QR codes and barcodes with your camera or from an image. Nothing is uploaded: decoding
          happens on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-border p-1">
              {(["camera", "image"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    mode === m ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {m === "camera" ? <Camera className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                  {m === "camera" ? "Camera" : "Image"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={beep} onChange={(e) => setBeep(e.target.checked)} />
              Beep on scan
            </label>
          </div>

          {mode === "camera" ? (
            <CameraScanner onResults={(r) => addResults(r, true)} />
          ) : (
            <ImageScanner onResults={(r) => addResults(r, false)} />
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Result</h2>
          {selected ? (
            <ResultDetails entry={selected} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              Point your camera at a code or upload an image
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>History ({history.length})</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={exportCsv} disabled={!history.length}>
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setHistory([]);
                    lastSeen.current.clear();
                  }}
                  disabled={!history.length}
                >
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
            <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {history.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">No scans yet.</p>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm transition hover:bg-accent/40",
                      selected?.id === h.id && "bg-accent/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-blue-600">{formatLabel(h.format)}</span>
                      <span>{h.time.toLocaleTimeString()}</span>
                    </div>
                    <div className="truncate font-mono text-xs">{showControlChars(h.text) || "(empty)"}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraScanner({ onResults }: { onResults: (results: ReadResult[]) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const start = async (id = deviceId) => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't available here. Use HTTPS, or switch to Image mode.");
      return;
    }
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id
          ? { deviceId: { exact: id }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(!!caps.torch);
      setDeviceId(track.getSettings().deviceId ?? id);
      // Labels are only filled in after permission has been granted
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));
      setRunning(true);
      loadReader();
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings and try again."
          : name === "NotFoundError"
            ? "No camera was found on this device. Switch to Image mode to scan from a picture."
            : `Could not start the camera${err instanceof Error ? `: ${err.message}` : "."}`
      );
      stop();
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch {
      setTorchSupported(false);
    }
  };

  useEffect(() => stop, [stop]);

  // Decode loop: grab a frame every SCAN_INTERVAL_MS while the camera runs
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let busy = false;
    const overlay = overlayRef.current;
    const frame = document.createElement("canvas");
    const ctx = frame.getContext("2d", { willReadFrequently: true });

    const tick = async () => {
      const video = videoRef.current;
      if (cancelled || busy || !video || !ctx || video.readyState < 2) return;
      busy = true;
      try {
        frame.width = video.videoWidth;
        frame.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const reader = await loadReader();
        const results = await reader.readBarcodes(ctx.getImageData(0, 0, frame.width, frame.height), {
          tryHarder: true,
          maxNumberOfSymbols: 4,
        });
        if (cancelled) return;
        const valid = results.filter((r) => r.isValid);
        drawOverlay(overlay, frame.width, frame.height, valid);
        if (valid.length) onResultsRef.current(valid);
      } catch {
        /* a failed frame is fine, try the next one */
      } finally {
        busy = false;
      }
    };

    const timer = window.setInterval(tick, SCAN_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      drawOverlay(overlay, 0, 0, []);
    };
  }, [running]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        <video ref={videoRef} className="h-full w-full object-contain" muted playsInline />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        {!running ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/80">
            <CameraOff className="h-8 w-8" />
            Camera is off
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <Button variant="secondary" onClick={stop}>
            Stop camera
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => start()}>
            Start camera
          </Button>
        )}
        {torchSupported ? (
          <Button variant="outline" onClick={toggleTorch}>
            <Flashlight className="h-4 w-4" /> {torchOn ? "Torch off" : "Torch on"}
          </Button>
        ) : null}
        {devices.length > 1 ? (
          <select
            className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              start(e.target.value);
            }}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

function ImageScanner({ onResults }: { onResults: (results: ReadResult[]) => void }) {
  const [image, setImage] = useState<{ url: string; width: number; height: number; name: string } | null>(null);
  const [found, setFound] = useState<ReadResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  const scanFile = async (file: File) => {
    setBusy(true);
    setStatus(null);
    setFound([]);
    try {
      const url = URL.createObjectURL(file);
      const bitmap = await createImageBitmap(file);
      setImage({ url, width: bitmap.width, height: bitmap.height, name: file.name });

      // Decode from pixels drawn over white: zxing ignores alpha (so a transparent PNG reads as
      // solid black) and its own decoder can't open WebP/AVIF, but the browser can.
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const reader = await loadReader();
      const results = (
        await reader.readBarcodes(ctx.getImageData(0, 0, canvas.width, canvas.height), { tryHarder: true, maxNumberOfSymbols: 16 })
      ).filter((r) => r.isValid);
      setFound(results);
      if (results.length) onResults(results);
      else setStatus("No QR code or barcode found. Try a sharper, closer or better-lit image.");
    } catch {
      setStatus("Could not read this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <FileDropArea
        accept="image/*"
        onFiles={(files) => scanFile(files[0])}
        listenToPaste
        disabled={busy}
        hint="PNG, JPG, WebP, GIF, BMP. You can also paste a screenshot."
      />
      {image ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/40">
          <img src={image.url} alt={image.name} className="block h-auto w-full" />
          <svg viewBox={`0 0 ${image.width} ${image.height}`} className="pointer-events-none absolute inset-0 h-full w-full">
            {found.map((r, i) => (
              <polygon
                key={i}
                points={positionPoints(r).map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgba(37,99,235,0.15)"
                stroke="#2563eb"
                strokeWidth={Math.max(2, image.width / 250)}
              />
            ))}
          </svg>
        </div>
      ) : null}
      {busy ? <p className="text-sm text-muted-foreground">Scanning…</p> : null}
      {status ? <p className="text-sm text-amber-600">{status}</p> : null}
      {found.length > 1 ? <p className="text-sm text-muted-foreground">Found {found.length} codes in this image.</p> : null}
    </div>
  );
}

function ResultDetails({ entry }: { entry: ScanEntry }) {
  const [copied, setCopied] = useState(false);
  const parsed = interpret(entry.text);

  const copy = async (value: string) => {
    if (await copyText(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-blue-600/10 px-2 py-0.5 font-medium text-blue-700 dark:text-blue-300">
          {formatLabel(entry.format)}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{parsed.kind}</span>
        {entry.contentType !== "Text" ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{entry.contentType}</span>
        ) : null}
      </div>

      <div className="relative rounded-lg border border-border bg-muted/40 p-3">
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all pr-16 font-mono text-sm">
          {showControlChars(entry.text) || "(empty)"}
        </pre>
        <Button size="sm" variant="ghost" className="absolute right-2 top-2" onClick={() => copy(entry.text)}>
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {parsed.fields.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {parsed.fields.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="break-all">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {parsed.action ? (
        <div className="flex flex-wrap gap-2">
          {parsed.action.href ? (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href={parsed.action.href} target="_blank" rel="noopener noreferrer">
                {parsed.action.label}
              </a>
            </Button>
          ) : null}
          {parsed.kind === "Contact" ? (
            <Button
              variant="secondary"
              onClick={() => downloadBlob(new Blob([entry.text], { type: "text/vcard" }), "contact.vcf")}
            >
              Save contact (.vcf)
            </Button>
          ) : null}
          {parsed.kind === "Wi‑Fi" && parsed.secret ? (
            <Button variant="secondary" onClick={() => copy(parsed.secret!)}>
              Copy password
            </Button>
          ) : null}
        </div>
      ) : null}
      {parsed.kind === "Link" ? (
        <p className="text-xs text-muted-foreground">Check the address before opening links from unknown codes.</p>
      ) : null}
    </div>
  );
}

type Interpretation = {
  kind: string;
  fields: [string, string][];
  action?: { label: string; href?: string };
  secret?: string;
};

// Recognise the common QR payload conventions (the same ones our QR Code Generator writes)
function interpret(text: string): Interpretation {
  const t = text.trim();

  if (/^https?:\/\//i.test(t)) {
    return { kind: "Link", fields: [], action: { label: "Open link", href: t } };
  }

  if (/^WIFI:/i.test(t)) {
    const field = (key: string) => {
      const m = new RegExp(`[:;]${key}:((?:\\\\.|[^;])*)`, "i").exec(t);
      return m ? m[1].replace(/\\(.)/g, "$1") : "";
    };
    const password = field("P");
    return {
      kind: "Wi‑Fi",
      fields: [
        ["Network", field("S")],
        ["Security", field("T") || "None"],
        ["Password", password || "—"],
        ["Hidden", field("H") === "true" ? "Yes" : "No"],
      ],
      action: { label: "" },
      secret: password || undefined,
    };
  }

  if (/^BEGIN:VCARD/i.test(t)) {
    const unfolded = t.replace(/\r?\n[ \t]/g, "");
    const get = (prop: string) =>
      unfolded
        .split(/\r?\n/)
        .filter((line) => new RegExp(`^${prop}[;:]`, "i").test(line))
        .map((line) => line.slice(line.indexOf(":") + 1).replace(/\\n/g, " ").replace(/;+/g, " ").trim())
        .filter(Boolean);
    const fields: [string, string][] = [];
    const add = (label: string, values: string[]) => values.forEach((v) => fields.push([label, v]));
    add("Name", get("FN").length ? get("FN") : get("N"));
    add("Organization", get("ORG"));
    add("Title", get("TITLE"));
    add("Phone", get("TEL"));
    add("Email", get("EMAIL"));
    add("Website", get("URL"));
    add("Address", get("ADR"));
    return { kind: "Contact", fields, action: { label: "" } };
  }

  if (/^MECARD:/i.test(t)) {
    const parts = t.slice(7).split(";").filter(Boolean).map((p) => p.split(":"));
    const labels: Record<string, string> = { N: "Name", TEL: "Phone", EMAIL: "Email", URL: "Website", ADR: "Address", ORG: "Organization" };
    return { kind: "Contact", fields: parts.filter(([k]) => labels[k]).map(([k, ...v]) => [labels[k], v.join(":")]) };
  }

  if (/^mailto:/i.test(t)) {
    const [address, query = ""] = t.slice(7).split("?");
    const params = new URLSearchParams(query);
    const fields: [string, string][] = [["To", decodeURIComponent(address)]];
    if (params.get("subject")) fields.push(["Subject", params.get("subject")!]);
    if (params.get("body")) fields.push(["Body", params.get("body")!]);
    return { kind: "Email", fields, action: { label: "Send email", href: t } };
  }

  if (/^tel:/i.test(t)) {
    return { kind: "Phone", fields: [["Number", t.slice(4)]], action: { label: "Call", href: t } };
  }

  const sms = /^(?:SMSTO|sms):([^:?]*)[:?]?(?:body=)?(.*)$/i.exec(t);
  if (sms) {
    const fields: [string, string][] = [["To", sms[1]]];
    if (sms[2]) fields.push(["Message", decodeURIComponent(sms[2])]);
    return { kind: "SMS", fields, action: { label: "Open in messages", href: `sms:${sms[1]}${sms[2] ? `?body=${encodeURIComponent(decodeURIComponent(sms[2]))}` : ""}` } };
  }

  const geo = /^geo:(-?[\d.]+),(-?[\d.]+)/i.exec(t);
  if (geo) {
    return {
      kind: "Location",
      fields: [["Latitude", geo[1]], ["Longitude", geo[2]]],
      action: { label: "Open in Maps", href: `https://www.google.com/maps?q=${geo[1]},${geo[2]}` },
    };
  }

  if (t.startsWith("[)>")) return { kind: "ISO/IEC 15434 (IUID)", fields: [] };
  if (/^\(\d{2,4}\)/.test(t)) return { kind: "GS1 data", fields: [] };
  if (/^\d+$/.test(t)) return { kind: "Number", fields: [] };
  return { kind: "Text", fields: [] };
}

function formatLabel(format: string) {
  return ZXINGLABELS[format] ?? format;
}

// Same names as zxing-wasm's formatToLabel, kept local so the history renders before the reader loads
const ZXINGLABELS: Record<string, string> = {
  QRCode: "QR Code", MicroQRCode: "Micro QR Code", RMQRCode: "rMQR Code", DataMatrix: "Data Matrix",
  PDF417: "PDF417", CompactPDF417: "Compact PDF417", MicroPDF417: "MicroPDF417", Aztec: "Aztec", AztecCode: "Aztec Code",
  MaxiCode: "MaxiCode", Code128: "Code 128", Code39: "Code 39", Code39Std: "Code 39", Code39Ext: "Code 39 Full ASCII",
  Code93: "Code 93", Codabar: "Codabar", ITF: "ITF", ITF14: "ITF-14", EAN13: "EAN-13", EAN8: "EAN-8",
  UPCA: "UPC-A", UPCE: "UPC-E", ISBN: "ISBN", DataBar: "GS1 DataBar", DataBarExp: "GS1 DataBar Expanded",
  DataBarLtd: "GS1 DataBar Limited",
};

// Make GS / RS / EOT separators (used by GS1 and IUID codes) visible instead of invisible
function showControlChars(text: string) {
  const names: Record<number, string> = { 4: "<EOT>", 29: "<GS>", 30: "<RS>" };
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, (c) => names[c.charCodeAt(0)] ?? `<0x${c.charCodeAt(0).toString(16).padStart(2, "0")}>`);
}

function positionPoints(r: ReadResult) {
  const p = r.position;
  return [p.topLeft, p.topRight, p.bottomRight, p.bottomLeft];
}

function drawOverlay(canvas: HTMLCanvasElement | null, width: number, height: number, results: ReadResult[]) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = Math.max(3, width / 200);
  ctx.strokeStyle = "#22c55e";
  ctx.fillStyle = "rgba(34,197,94,0.2)";
  for (const r of results) {
    const pts = positionPoints(r);
    ctx.beginPath();
    pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

let audioCtx: AudioContext | null = null;
function playBeep() {
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 1200;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    /* audio is optional */
  }
}

export default RouteComponent;
