import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/base64-tool")({
  component: RouteComponent,
});

function RouteComponent() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);

  useSEO({
    title: "Base64 Tool | Utility Hub",
    description:
      "Encode plain text to Base64 or decode Base64 back to text, including Unicode content.",
    path: "/base64-tool",
    keywords: "base64 encoder, base64 decoder, text encode, text decode",
    applicationCategory: "DeveloperApplication",
    featureList: ["Base64 encode", "Base64 decode", "Unicode support", "Copy output"],
  });

  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: "", error: "" };
    }

    try {
      if (mode === "encode") {
        return { output: encodeUnicodeToBase64(input), error: "" };
      }
      return { output: decodeBase64ToUnicode(input), error: "" };
    } catch {
      return {
        output: "",
        error: "Invalid input for selected mode. Please check the text and try again.",
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

  const swapAndReverse = () => {
    if (!output) {
      return;
    }

    setInput(output);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Base64 Tool</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Encode text to Base64 or decode Base64 back into readable text.
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
                size="sm"
                variant="ghost"
                disabled={!input}
                onClick={() => copyToClipboard(input, "input")}
              >
                {copied === "input" ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-52"
              placeholder={mode === "encode" ? "Enter text to encode" : "Enter Base64 to decode"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Output</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!output}
                onClick={() => copyToClipboard(output, "output")}
              >
                {copied === "output" ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea
              value={output}
              readOnly
              className="min-h-52"
              placeholder="Result appears here"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!output} onClick={swapAndReverse}>
            Swap and Reverse
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!input}
            onClick={() => {
              setInput("");
              setCopied(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

function encodeUnicodeToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64ToUnicode(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
