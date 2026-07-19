import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/ascii-art-generator")({
  component: RouteComponent,
});

type FillPreset = {
  label: string;
  value: string;
};

const FILL_PRESETS: FillPreset[] = [
  { label: "#", value: "#" },
  { label: "@", value: "@" },
  { label: "*", value: "*" },
  { label: "$", value: "$" },
  { label: "%", value: "%" },
  { label: "X", value: "X" },
];

const GLYPH_HEIGHT = 5;

function RouteComponent() {
  const [text, setText] = useState("UTILITY HUB");
  const [fillChar, setFillChar] = useState("#");
  const [letterSpacing, setLetterSpacing] = useState(1);
  const [lineSpacing, setLineSpacing] = useState(1);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"png" | "jpg" | null>(null);

  useSEO({
    title: "ASCII Art Generator | Utility Hub",
    description:
      "Generate fun ASCII art from text with adjustable style, spacing, and one-click copy.",
    path: "/ascii-art-generator",
    keywords: "ascii art generator, text to ascii, ascii text, fun tools",
    applicationCategory: "EntertainmentApplication",
    featureList: [
      "Text to ASCII art",
      "Custom fill character",
      "Letter and line spacing control",
      "Copy ASCII output",
    ],
  });

  const output = useMemo(
    () => renderAsciiArt(text, sanitizeFillChar(fillChar), letterSpacing, lineSpacing),
    [text, fillChar, letterSpacing, lineSpacing]
  );

  const handleCopy = async () => {
    if (!output.trim()) {
      return;
    }

    const didCopy = await copyText(output);
    if (!didCopy) {
      setCopied(false);
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = async (format: "png" | "jpg") => {
    if (!output.trim()) {
      return;
    }

    setExporting(format);
    try {
      downloadAsciiAsImage(output, format);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">ASCII Art Generator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Turn plain text into fun ASCII banners for chats, docs, and terminals.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input Text</label>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-28"
              placeholder="Type text here..."
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Fill Character</label>
              <Input
                value={fillChar}
                maxLength={1}
                onChange={(event) => setFillChar(event.target.value.slice(0, 1))}
                placeholder="#"
              />
              <div className="flex flex-wrap gap-2">
                {FILL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={sanitizeFillChar(fillChar) === preset.value ? "default" : "outline"}
                    onClick={() => setFillChar(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Letter Spacing</label>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={letterSpacing}
                  onChange={(event) => setLetterSpacing(clampNumber(event.target.value, 0, 8, 1))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Line Spacing</label>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={lineSpacing}
                  onChange={(event) => setLineSpacing(clampNumber(event.target.value, 0, 6, 1))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-foreground">ASCII Output</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setText("");
                  setCopied(false);
                }}
              >
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => void handleCopy()} disabled={!output.trim()}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handleExport("png")}
                disabled={!output.trim() || exporting !== null}
              >
                {exporting === "png" ? "Exporting..." : "Export PNG"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handleExport("jpg")}
                disabled={!output.trim() || exporting !== null}
              >
                {exporting === "jpg" ? "Exporting..." : "Export JPG"}
              </Button>
            </div>
          </div>

          <pre className="min-h-[28rem] overflow-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-5 text-foreground sm:text-base">
            {output || "Type something to generate ASCII art..."}
          </pre>
        </div>
      </div>
    </div>
  );
}

function renderAsciiArt(text: string, fillChar: string, letterSpacing: number, lineSpacing: number) {
  if (!text.trim()) {
    return "";
  }

  const spacing = " ".repeat(letterSpacing);
  const blankLine = "";
  const lines = text.split(/\r?\n/);
  const output: string[] = [];

  lines.forEach((line, lineIndex) => {
    const upper = line.toUpperCase();
    for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
      const rowParts = upper.split("").map((char) => {
        const glyph = GLYPHS[char] ?? GLYPHS["?"];
        return glyph[row].replace(/X/g, fillChar);
      });

      output.push(rowParts.join(spacing).replace(/\s+$/g, ""));
    }

    if (lineIndex < lines.length - 1) {
      for (let i = 0; i < lineSpacing; i += 1) {
        output.push(blankLine);
      }
    }
  });

  return output.join("\n");
}

function sanitizeFillChar(value: string) {
  return value.trim().slice(0, 1) || "#";
}

function clampNumber(value: string, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function downloadAsciiAsImage(ascii: string, format: "png" | "jpg") {
  const lines = ascii.split("\n");
  const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0);

  const padding = 32;
  const fontSize = 20;
  const lineHeight = 24;
  const charWidth = 12;

  const width = Math.max(420, maxLineLength * charWidth + padding * 2);
  const height = Math.max(220, lines.length * lineHeight + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.font = `${fontSize}px Consolas, 'Courier New', monospace`;
  context.fillStyle = "#111827";
  context.textBaseline = "top";

  lines.forEach((line, index) => {
    context.fillText(line, padding, padding + index * lineHeight);
  });

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const fileName = format === "png" ? "ascii-art.png" : "ascii-art.jpg";
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

const GLYPHS: Record<string, string[]> = {
  " ": ["     ", "     ", "     ", "     ", "     "],
  "!": ["  X  ", "  X  ", "  X  ", "     ", "  X  "],
  "?": [" XXX ", "X   X", "  XX ", "     ", "  X  "],
  ".": ["     ", "     ", "     ", "     ", "  X  "],
  ",": ["     ", "     ", "     ", "  X  ", " X   "],
  "-": ["     ", "     ", " XXX ", "     ", "     "],
  "_": ["     ", "     ", "     ", "     ", "XXXXX"],
  "/": ["    X", "   X ", "  X  ", " X   ", "X    "],
  "0": [" XXX ", "X  XX", "X X X", "XX  X", " XXX "],
  "1": ["  X  ", " XX  ", "  X  ", "  X  ", " XXX "],
  "2": [" XXX ", "X   X", "   X ", "  X  ", "XXXXX"],
  "3": [" XXX ", "    X", "  XX ", "    X", " XXX "],
  "4": ["   X ", "  XX ", " X X ", "XXXXX", "   X "],
  "5": ["XXXXX", "X    ", "XXXX ", "    X", "XXXX "],
  "6": [" XXX ", "X    ", "XXXX ", "X   X", " XXX "],
  "7": ["XXXXX", "    X", "   X ", "  X  ", " X   "],
  "8": [" XXX ", "X   X", " XXX ", "X   X", " XXX "],
  "9": [" XXX ", "X   X", " XXXX", "    X", " XXX "],
  A: [" XXX ", "X   X", "XXXXX", "X   X", "X   X"],
  B: ["XXXX ", "X   X", "XXXX ", "X   X", "XXXX "],
  C: [" XXX ", "X   X", "X    ", "X   X", " XXX "],
  D: ["XXXX ", "X   X", "X   X", "X   X", "XXXX "],
  E: ["XXXXX", "X    ", "XXXX ", "X    ", "XXXXX"],
  F: ["XXXXX", "X    ", "XXXX ", "X    ", "X    "],
  G: [" XXX ", "X    ", "X XXX", "X   X", " XXX "],
  H: ["X   X", "X   X", "XXXXX", "X   X", "X   X"],
  I: [" XXX ", "  X  ", "  X  ", "  X  ", " XXX "],
  J: ["  XXX", "   X ", "   X ", "X  X ", " XX  "],
  K: ["X   X", "X  X ", "XXX  ", "X  X ", "X   X"],
  L: ["X    ", "X    ", "X    ", "X    ", "XXXXX"],
  M: ["X   X", "XX XX", "X X X", "X   X", "X   X"],
  N: ["X   X", "XX  X", "X X X", "X  XX", "X   X"],
  O: [" XXX ", "X   X", "X   X", "X   X", " XXX "],
  P: ["XXXX ", "X   X", "XXXX ", "X    ", "X    "],
  Q: [" XXX ", "X   X", "X   X", "X  XX", " XXXX"],
  R: ["XXXX ", "X   X", "XXXX ", "X  X ", "X   X"],
  S: [" XXXX", "X    ", " XXX ", "    X", "XXXX "],
  T: ["XXXXX", "  X  ", "  X  ", "  X  ", "  X  "],
  U: ["X   X", "X   X", "X   X", "X   X", " XXX "],
  V: ["X   X", "X   X", "X   X", " X X ", "  X  "],
  W: ["X   X", "X   X", "X X X", "XX XX", "X   X"],
  X: ["X   X", " X X ", "  X  ", " X X ", "X   X"],
  Y: ["X   X", " X X ", "  X  ", "  X  ", "  X  "],
  Z: ["XXXXX", "   X ", "  X  ", " X   ", "XXXXX"],
};