import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/base64-file-converter")({
  component: RouteComponent,
});

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB safety cap

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/json": "json",
  "application/zip": "zip",
  "application/xml": "xml",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/html": "html",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "font/woff": "woff",
  "font/woff2": "woff2",
};

function splitDataUri(input: string): { mime: string | null; base64: string } {
  const match = /^data:([^;,]+)?(;charset=[^;,]+)?;base64,(.*)$/s.exec(input.trim());
  if (match) {
    return { mime: match[1] ?? null, base64: match[3] };
  }
  return { mime: null, base64: input.trim() };
}

function base64ToBlob(base64: string, mime: string): Blob {
  const cleaned = base64.replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime || "application/octet-stream" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function RouteComponent() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  // Encode (File -> Base64)
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState("");
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Decode (Base64 -> File)
  const [base64Input, setBase64Input] = useState("");
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [fileName, setFileName] = useState("download.bin");
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useSEO({
    title: "Base64 File Converter | Utility Hub",
    description:
      "Convert any file to a Base64 data URI, or decode a Base64 string back into a downloadable file with a custom name and type.",
    path: "/base64-file-converter",
    keywords: "base64 file converter, file to base64, base64 to file, base64 decode file, data uri converter",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "File to Base64 data URI",
      "Base64 to downloadable file",
      "Auto-detect MIME type and extension from a data URI",
      "Image preview on decode",
    ],
  });

  const handleFile = (selected: File | null) => {
    setEncodeError(null);
    setDataUri("");
    setFile(selected);
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      setEncodeError(`File is too large (${formatBytes(selected.size)}). Max size is ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDataUri(reader.result as string);
    reader.onerror = () => setEncodeError("Could not read the file.");
    reader.readAsDataURL(selected);
  };

  const copyEncoded = async (text: string) => {
    if (!text) return;
    const didCopy = await copyText(text);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleBase64InputChange = (value: string) => {
    setBase64Input(value);
    setDecodeError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    const { mime, base64 } = splitDataUri(value);
    if (mime) {
      setMimeType(mime);
      const ext = EXTENSION_BY_MIME[mime];
      if (ext) {
        setFileName((prev) => {
          const base = prev.includes(".") ? prev.slice(0, prev.lastIndexOf(".")) : prev || "download";
          return `${base}.${ext}`;
        });
      }
    }
    if (mime?.startsWith("image/") && base64) {
      try {
        setPreviewUrl(`data:${mime};base64,${base64.replace(/\s+/g, "")}`);
      } catch {
        /* ignore preview failures */
      }
    }
  };

  const downloadDecoded = () => {
    const { base64 } = splitDataUri(base64Input);
    if (!base64) {
      setDecodeError("Paste a Base64 string first.");
      return;
    }
    try {
      const blob = base64ToBlob(base64, mimeType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "download.bin";
      a.click();
      URL.revokeObjectURL(url);
      setDecodeError(null);
    } catch {
      setDecodeError("Could not decode this Base64 string. Check for missing characters or invalid padding.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Base64 File Converter</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Convert a file to Base64, or decode a Base64 string back into a downloadable file.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-border p-1">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              mode === m ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            {m === "encode" ? "File → Base64" : "Base64 → File"}
          </button>
        ))}
      </div>

      {mode === "encode" ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <p className="text-xs text-muted-foreground">
                {file.name} &middot; {formatBytes(file.size)} &middot; {file.type || "unknown type"}
              </p>
            ) : null}
            {encodeError ? <p className="text-xs text-red-600">{encodeError}</p> : null}
          </div>

          {dataUri ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Data URI</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copyEncoded(dataUri)}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={dataUri}
                  className="field-sizing-fixed h-32 max-h-48 resize-y overflow-y-auto font-mono text-xs"
                />
              </div>

              {file?.type.startsWith("image/") ? (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <img src={dataUri} alt={file.name} className="max-h-48 rounded-md border border-border" />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label>Base64 String</Label>
            <Textarea
              value={base64Input}
              onChange={(e) => handleBase64InputChange(e.target.value)}
              placeholder="Paste a raw Base64 string or a data:mime;base64,... URI"
              className="field-sizing-fixed h-32 max-h-48 resize-y overflow-y-auto font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Pasting a data URI auto-fills the type and extension below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="download.bin" />
            </div>
            <div className="space-y-2">
              <Label>MIME Type</Label>
              <Input
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                placeholder="application/octet-stream"
                className="font-mono text-xs"
              />
            </div>
          </div>

          {previewUrl ? (
            <div className="space-y-2">
              <Label>Preview</Label>
              <img src={previewUrl} alt={fileName} className="max-h-48 rounded-md border border-border" />
            </div>
          ) : null}

          {decodeError ? <p className="text-sm text-red-600">{decodeError}</p> : null}

          <Button type="button" onClick={downloadDecoded} disabled={!base64Input.trim()}>
            Download File
          </Button>
        </div>
      )}
    </div>
  );
}

export default RouteComponent;
