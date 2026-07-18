import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

export const Route = createFileRoute("/character-counter")({
  component: RouteComponent,
});

function RouteComponent() {
  const [text, setText] = useState("");

  useSEO({
    title: "Character Counter | Utility Hub",
    description:
      "Count characters, words, lines, and estimated reading time instantly while you type.",
    path: "/character-counter",
    keywords: "character counter, word counter, line counter, reading time",
    applicationCategory: "DeveloperApplication",
    featureList: ["Character count", "Word count", "Line count", "Reading time estimate"],
  });

  const stats = useMemo(() => {
    const charactersWithSpaces = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const readingTimeMinutes = words / 200;

    return {
      charactersWithSpaces,
      charactersWithoutSpaces,
      words,
      lines,
      readingTimeMinutes,
    };
  }, [text]);

  const clear = () => setText("");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Character Counter</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Paste or type text to get real-time writing stats.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Input Text</h2>
          <Button type="button" variant="secondary" onClick={clear} disabled={!text}>
            Clear
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-56"
          placeholder="Start typing here..."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Characters" value={stats.charactersWithSpaces.toLocaleString()} />
        <StatCard
          label="No Spaces"
          value={stats.charactersWithoutSpaces.toLocaleString()}
        />
        <StatCard label="Words" value={stats.words.toLocaleString()} />
        <StatCard label="Lines" value={stats.lines.toLocaleString()} />
        <StatCard
          label="Reading Time"
          value={`${Math.max(0, Math.ceil(stats.readingTimeMinutes))} min`}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
