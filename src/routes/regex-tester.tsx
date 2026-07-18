import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/regex-tester")({
  component: RouteComponent,
});

function RouteComponent() {
  const [pattern, setPattern] = useState("[a-z]+");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Hello123World");

  useSEO({
    title: "Regex Tester | Utility Hub",
    description:
      "Test regular expressions live with flags, highlighted matches, and match details.",
    path: "/regex-tester",
    keywords: "regex tester, regex playground, regex flags, regular expression test",
    applicationCategory: "DeveloperApplication",
    featureList: ["Pattern testing", "Flags", "Highlighted matches", "Match list"],
  });

  const result = useMemo(() => testRegex(pattern, flags, text), [pattern, flags, text]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Regex Tester</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Build and test regular expressions with instant match feedback.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Pattern</label>
            <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="[a-z]+" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Flags</label>
            <Input
              value={flags}
              onChange={(e) => setFlags(sanitizeFlags(e.target.value))}
              placeholder="gi"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Test Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-40 font-mono text-sm"
            placeholder="Type text to test against regex..."
          />
        </div>

        {result.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.error}
          </div>
        ) : null}

        {!result.error ? (
          <>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highlighted Output</p>
              <HighlightedText segments={result.segments} />
            </div>

            <div className="rounded-md border border-border bg-background p-3">
              <p className="mb-2 text-sm font-medium text-foreground">Matches ({result.matches.length})</p>
              {result.matches.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {result.matches.map((match, index) => (
                    <li key={`${match.value}-${index}`} className="font-mono text-foreground">
                      #{index + 1} [{match.index}-{match.index + match.value.length}]: {match.value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No matches found.</p>
              )}
            </div>
          </>
        ) : null}

        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPattern("[a-z]+");
              setFlags("gi");
              setText("Hello123World");
            }}
          >
            Reset Sample
          </Button>
        </div>
      </div>
    </div>
  );
}

function sanitizeFlags(raw: string) {
  const cleaned = raw.replace(/[^dgimsuvy]/g, "");
  return Array.from(new Set(cleaned.split(""))).join("");
}

function testRegex(pattern: string, flags: string, text: string) {
  if (!pattern) {
    return {
      error: "",
      segments: [{ text, matched: false }],
      matches: [] as Array<{ value: string; index: number }>,
    };
  }

  try {
    const globalFlags = flags.includes("g") ? flags : `${flags}g`;
    const regex = new RegExp(pattern, globalFlags);
    const matches: Array<{ value: string; index: number }> = [];
    const segments: Array<{ text: string; matched: boolean }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const index = match.index;

      if (index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, index), matched: false });
      }

      segments.push({ text: value, matched: true });
      matches.push({ value, index });
      lastIndex = index + value.length;

      if (value === "") {
        regex.lastIndex += 1;
      }
    }

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), matched: false });
    }

    if (segments.length === 0) {
      segments.push({ text, matched: false });
    }

    return { error: "", segments, matches };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid regex pattern.",
      segments: [{ text, matched: false }],
      matches: [] as Array<{ value: string; index: number }>,
    };
  }
}

function HighlightedText({ segments }: { segments: Array<{ text: string; matched: boolean }> }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 text-sm leading-6">
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark key={index} className="rounded bg-amber-200 px-0.5 text-amber-950">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </pre>
  );
}
