import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/url-encoder")({
  component: RouteComponent,
});

function RouteComponent() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);

  useSEO({
    title: "URL Encoder & Decoder | Utility Hub",
    description:
      "Encode and decode URLs instantly. Convert special characters to URL-safe format and back.",
    path: "/url-encoder",
    keywords: "url encoder, url decoder, percent encode, uri encode, uri decode",
    applicationCategory: "DeveloperApplication",
    featureList: ["URL encode", "URL decode", "Copy output", "Swap input and output"],
  });

  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: "", error: "" };
    }

    try {
      if (mode === "encode") {
        return { output: encodeURIComponent(input), error: "" };
      }

      return { output: decodeURIComponent(input), error: "" };
    } catch {
      return {
        output: "",
        error: "Invalid encoded URL input. Check percent-encoded characters and try again.",
      };
    }
  }, [input, mode]);

  const copyToClipboard = async (value: string, target: "input" | "output") => {
    if (!value) {
      return;
    }

    const didCopy = await copyText(value);
    if (didCopy) {
      setCopied(target);
      setTimeout(() => setCopied(null), 1500);
    } else {
      setCopied(null);
    }
  };

  const swapValues = () => {
    if (!output) {
      return;
    }

    setInput(output);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  };

  const clearAll = () => {
    setInput("");
    setCopied(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">URL Encoder & Decoder</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Convert text to URL-safe format or decode URL-encoded strings instantly.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setMode("encode")}
            variant={mode === "encode" ? "default" : "outline"}
          >
            Encode
          </Button>
          <Button
            type="button"
            onClick={() => setMode("decode")}
            variant={mode === "decode" ? "default" : "outline"}
          >
            Decode
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Input</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(input, "input")}
                disabled={!input}
              >
                {copied === "input" ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Enter URL or text to encode"
                  : "Enter encoded string to decode"
              }
              className="min-h-44"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Output</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(output, "output")}
                disabled={!output}
              >
                {copied === "output" ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea
              value={output}
              readOnly
              placeholder="Result will appear here"
              className="min-h-44"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={swapValues} disabled={!output}>
            Swap and Reverse
          </Button>
          <Button type="button" variant="secondary" onClick={clearAll} disabled={!input}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
