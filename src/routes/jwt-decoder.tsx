import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";

export const Route = createFileRoute("/jwt-decoder")({
  component: RouteComponent,
});

function RouteComponent() {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState<"header" | "payload" | null>(null);

  useSEO({
    title: "JWT Decoder | Utility Hub",
    description: "Decode JWT header and payload with readable issued/expiration time details.",
    path: "/jwt-decoder",
    keywords: "jwt decoder, decode token, jwt header payload, jwt exp iat",
    applicationCategory: "DeveloperApplication",
    featureList: ["Decode header", "Decode payload", "Expiration time", "Issued time"],
  });

  const result = useMemo(() => decodeJwt(token), [token]);

  const copy = async (value: string, target: "header" | "payload") => {
    if (!value) return;
    const didCopy = await copyText(value);
    if (didCopy) {
      setCopied(target);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">JWT Decoder</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Paste a JWT to decode header and payload instantly.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <label className="mb-2 block text-sm font-medium text-foreground">JWT Token</label>
        <Textarea
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          className="min-h-28 font-mono text-sm"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        />

        {result.status === "error" ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.message}
          </div>
        ) : null}

        {result.status === "success" ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel
                title="Header"
                value={result.headerPretty}
                copied={copied === "header"}
                onCopy={() => copy(result.headerPretty, "header")}
              />
              <Panel
                title="Payload"
                value={result.payloadPretty}
                copied={copied === "payload"}
                onCopy={() => copy(result.payloadPretty, "payload")}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Issued At (iat)" value={result.issuedAt} />
              <InfoRow label="Expires At (exp)" value={result.expiresAt} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Panel({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Button type="button" size="sm" variant="ghost" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto rounded bg-background p-3 text-xs leading-5 text-foreground">
        {value}
      </pre>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}

type JwtDecodeResult =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      headerPretty: string;
      payloadPretty: string;
      issuedAt: string;
      expiresAt: string;
    };

function decodeJwt(token: string): JwtDecodeResult {
  if (!token) return { status: "idle" };

  const parts = token.split(".");
  if (parts.length < 2) {
    return { status: "error", message: "Invalid JWT format. Expected header.payload.signature." };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return {
      status: "success",
      headerPretty: JSON.stringify(header, null, 2),
      payloadPretty: JSON.stringify(payload, null, 2),
      issuedAt: formatEpoch(payload?.iat),
      expiresAt: formatEpoch(payload?.exp),
    };
  } catch {
    return { status: "error", message: "Unable to decode token. Ensure header and payload are valid Base64URL JSON." };
  }
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function formatEpoch(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not available";
  }
  return `${new Date(value * 1000).toISOString()} (${new Date(value * 1000).toLocaleString()})`;
}
