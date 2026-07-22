import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as SparkMD5 from "spark-md5";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hash-generator")({
  component: RouteComponent,
});

const SUBTLE_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
const ALGORITHMS = ["MD5", ...SUBTLE_ALGORITHMS] as const;
type Algorithm = (typeof ALGORITHMS)[number];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeHashes(source: { text: string } | { file: File }): Promise<Record<Algorithm, string>> {
  let bytes: ArrayBuffer;
  let md5: string;

  if ("text" in source) {
    bytes = new TextEncoder().encode(source.text).buffer as ArrayBuffer;
    md5 = SparkMD5.hash(source.text);
  } else {
    bytes = await source.file.arrayBuffer();
    md5 = SparkMD5.ArrayBuffer.hash(bytes);
  }

  const results = { MD5: md5 } as Record<Algorithm, string>;
  for (const algo of SUBTLE_ALGORITHMS) {
    const digest = await crypto.subtle.digest(algo, bytes);
    results[algo] = bufferToHex(digest);
  }
  return results;
}

function RouteComponent() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("Hello, world!");
  const [file, setFile] = useState<File | null>(null);
  const [compareValue, setCompareValue] = useState("");
  const [results, setResults] = useState<Record<Algorithm, string> | null>(null);
  const [computing, setComputing] = useState(false);
  const [copied, setCopied] = useState<Algorithm | null>(null);

  useSEO({
    title: "Hash Generator | Utility Hub",
    description:
      "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or a file, and compare against an expected hash.",
    path: "/hash-generator",
    keywords: "hash generator, md5, sha1, sha256, sha512, checksum, file hash, compare hashes",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "MD5, SHA-1, SHA-256, SHA-384, SHA-512",
      "Hash text or a file",
      "Compare against an expected hash",
      "Copy any hash",
    ],
  });

  useEffect(() => {
    const source = mode === "text" ? { text } : file ? { file } : null;
    if (!source || ("text" in source && !source.text)) {
      setResults(null);
      return;
    }

    let cancelled = false;
    setComputing(true);
    computeHashes(source)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .finally(() => {
        if (!cancelled) setComputing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, text, file]);

  const copyHash = async (algo: Algorithm, value: string) => {
    const didCopy = await copyText(value);
    if (didCopy) {
      setCopied(algo);
      setTimeout(() => setCopied((c) => (c === algo ? null : c)), 1500);
    }
  };

  const normalizedCompare = compareValue.trim().toLowerCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Hash Generator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or a file.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        <div className="inline-flex rounded-lg border border-border p-1">
          {(["text", "file"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                mode === m ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {m === "text" ? "Text" : "File"}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <div className="space-y-2">
            <Label>Text</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to hash"
              className="min-h-32"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <p className="text-xs text-muted-foreground">
                {file.name} &middot; {(file.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <Label>Compare Against (optional)</Label>
          <Input
            value={compareValue}
            onChange={(e) => setCompareValue(e.target.value)}
            placeholder="Paste an expected hash to check for a match"
            className="font-mono text-xs"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {computing ? "Computing…" : "Results"}
        </h2>
        {ALGORITHMS.map((algo) => {
          const value = results?.[algo] ?? "";
          const matches = normalizedCompare.length > 0 && value.toLowerCase() === normalizedCompare;
          return (
            <div
              key={algo}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
                matches ? "border-green-500 bg-green-500/10" : "border-border"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{algo}</span>
                  {matches ? (
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      Match
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                  {value || "—"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!value}
                onClick={() => copyHash(algo, value)}
              >
                {copied === algo ? "Copied" : "Copy"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RouteComponent;
