import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lorem-ipsum-generator")({
  component: RouteComponent,
});

const CLASSIC_OPENER = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
  "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
  "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit",
  "voluptate", "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "at", "vero", "eos", "accusamus",
  "iusto", "odio", "dignissimos", "ducimus", "blanditiis", "praesentium", "voluptatum",
  "deleniti", "atque", "corrupti", "quos", "quas", "molestias", "excepturi", "occaecati",
  "cupiditate", "provident", "similique", "debitis", "rerum", "necessitatibus", "saepe",
  "eveniet", "voluptates", "repudiandae", "recusandae", "itaque", "earum", "hic", "tenetur",
  "sapiente", "delectus", "reiciendis", "voluptatibus", "maiores", "alias", "perferendis",
  "doloribus", "asperiores", "repellat", "nemo", "ipsam", "quia", "quaerat", "fuga", "harum",
  "quidem", "rerum", "facilis", "expedita", "distinctio", "nam", "libero", "tempore", "cum",
  "soluta", "nobis", "eligendi", "optio", "cumque", "nihil", "impedit", "quo", "minus",
];

type Unit = "words" | "sentences" | "paragraphs";

const DEFAULT_COUNT: Record<Unit, number> = { words: 50, sentences: 5, paragraphs: 3 };
const COUNT_LIMITS: Record<Unit, { min: number; max: number }> = {
  words: { min: 1, max: 500 },
  sentences: { min: 1, max: 50 },
  paragraphs: { min: 1, max: 20 },
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateSentence() {
  const words = Array.from({ length: randomInt(6, 16) }, () => pickWord());
  return capitalize(words.join(" ")) + ".";
}

function generateParagraph() {
  return Array.from({ length: randomInt(3, 7) }, () => generateSentence()).join(" ");
}

function generateWords(count: number, startWithLorem: boolean) {
  const words: string[] = startWithLorem
    ? CLASSIC_OPENER.replace(".", "").replace(",", "").toLowerCase().split(" ")
    : [];
  while (words.length < count) words.push(pickWord());
  const trimmed = words.slice(0, count);
  return capitalize(trimmed.join(" ")) + ".";
}

function generateSentences(count: number, startWithLorem: boolean) {
  const sentences = Array.from({ length: count }, (_, i) =>
    i === 0 && startWithLorem ? CLASSIC_OPENER : generateSentence()
  );
  return sentences.join(" ");
}

function generateParagraphs(count: number, startWithLorem: boolean) {
  const paragraphs = Array.from({ length: count }, (_, i) => {
    if (i === 0 && startWithLorem) {
      const rest = Array.from({ length: randomInt(2, 6) }, () => generateSentence());
      return [CLASSIC_OPENER, ...rest].join(" ");
    }
    return generateParagraph();
  });
  return paragraphs;
}

function generate(unit: Unit, count: number, startWithLorem: boolean, wrapHtml: boolean): string {
  if (unit === "words") {
    const text = generateWords(count, startWithLorem);
    return wrapHtml ? `<p>${text}</p>` : text;
  }
  if (unit === "sentences") {
    const text = generateSentences(count, startWithLorem);
    return wrapHtml ? `<p>${text}</p>` : text;
  }
  const paragraphs = generateParagraphs(count, startWithLorem);
  return wrapHtml ? paragraphs.map((p) => `<p>${p}</p>`).join("\n") : paragraphs.join("\n\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RouteComponent() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(DEFAULT_COUNT.paragraphs);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [wrapHtml, setWrapHtml] = useState(false);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  useSEO({
    title: "Lorem Ipsum Generator | Utility Hub",
    description:
      "Generate placeholder Lorem Ipsum text by words, sentences, or paragraphs, with optional HTML <p> wrapping.",
    path: "/lorem-ipsum-generator",
    keywords: "lorem ipsum generator, placeholder text, dummy text, filler text",
    applicationCategory: "Tool",
    featureList: [
      "Generate by words, sentences, or paragraphs",
      "Classic opening sentence option",
      "Wrap output in HTML paragraph tags",
      "Copy and download output",
    ],
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const output = useMemo(
    () => generate(unit, count, startWithLorem, wrapHtml),
    [unit, count, startWithLorem, wrapHtml, seed]
  );

  const changeUnit = (nextUnit: Unit) => {
    setUnit(nextUnit);
    setCount(DEFAULT_COUNT[nextUnit]);
  };

  const copy = async () => {
    const didCopy = await copyText(output);
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const limits = COUNT_LIMITS[unit];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Lorem Ipsum Generator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Generate placeholder text by words, sentences, or paragraphs.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Unit</Label>
            <div className="inline-flex rounded-lg border border-border p-1">
              {(["words", "sentences", "paragraphs"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => changeUnit(u)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                    unit === u ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Count</Label>
            <Input
              type="number"
              min={limits.min}
              max={limits.max}
              value={count}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isNaN(next)) return;
                setCount(Math.min(limits.max, Math.max(limits.min, next)));
              }}
              className="w-28"
            />
          </div>

          <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="rounded border-input bg-background text-primary focus:ring-ring"
            />
            Start with "Lorem ipsum…"
          </label>

          <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={wrapHtml}
              onChange={(e) => setWrapHtml(e.target.checked)}
              className="rounded border-input bg-background text-primary focus:ring-ring"
            />
            Wrap in &lt;p&gt; tags
          </label>
        </div>

        <div className="flex items-center justify-between">
          <Label>Output</Label>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}>
              Regenerate
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => downloadFile(output, "lorem-ipsum.txt", "text/plain")}
            >
              Download
            </Button>
          </div>
        </div>
        <Textarea
          readOnly
          value={output}
          className="field-sizing-fixed h-72 max-h-96 resize-y overflow-y-auto font-mono text-sm"
        />
      </div>
    </div>
  );
}

export default RouteComponent;
