import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import {
  EXAMPLE_HEADER,
  EXAMPLE_PAYLOAD,
  EXAMPLE_SECRET,
  HEADER_CLAIM_INFO,
  JWT_ALGORITHMS,
  JwtDecodeError,
  PAYLOAD_CLAIM_INFO,
  buildJwt,
  decodeJwtStructure,
  isHmacAlgorithm,
  secretToBytes,
  verifyHmacSignature,
  type JwtAlgorithm,
} from "@/lib/jwt";
import { JwtTokenEditor, TokenSpans } from "@/components/jwt/token-field";
import { JsonPanel } from "@/components/jwt/json-panel";
import { SecretField } from "@/components/jwt/secret-field";
import { StatusRow, type StatusState } from "@/components/jwt/status-row";

export const Route = createFileRoute("/jwt-decoder")({
  component: RouteComponent,
});

type JwtMode = "decode" | "encode";

type DecodeState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      signatureB64: string;
      signingInput: string;
    };

interface VerifyState {
  state: StatusState;
  message: string;
}

const DEFAULT_PAYLOAD_TEXT = JSON.stringify(EXAMPLE_PAYLOAD, null, 2);

function headerTextFor(alg: JwtAlgorithm) {
  return JSON.stringify({ alg, typ: "JWT" }, null, 2);
}

function RouteComponent() {
  const [mode, setMode] = useState<JwtMode>("decode");

  // --- Decoder state ---
  const [token, setToken] = useState("");
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [secretIsBase64Url, setSecretIsBase64Url] = useState(false);
  const [exampleAlg, setExampleAlg] = useState<JwtAlgorithm>("HS256");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [verify, setVerify] = useState<VerifyState>({
    state: "neutral",
    message: "Enter the secret used to sign this token to verify its signature.",
  });

  const tokenRef = useRef<HTMLTextAreaElement>(null);

  // --- Encoder state ---
  const [encAlgorithm, setEncAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [headerText, setHeaderText] = useState(headerTextFor("HS256"));
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD_TEXT);
  const [encSecret, setEncSecret] = useState(EXAMPLE_SECRET);
  const [encSecretIsBase64Url, setEncSecretIsBase64Url] = useState(false);
  const [encToken, setEncToken] = useState("");
  const [encError, setEncError] = useState<string | null>(null);
  const [encCopied, setEncCopied] = useState(false);

  useSEO({
    title: "JWT Decoder & Encoder | Utility Hub",
    description:
      "Decode, validate, and verify JSON Web Tokens (JWT), or build and sign a new one from custom header and payload claims — just like jwt.io.",
    path: "/jwt-decoder",
    keywords:
      "jwt decoder, jwt encoder, decode jwt, encode jwt, sign jwt, jwt.io, jwt signature verification, jwt claims",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Decode header and payload",
      "Claims breakdown",
      "HMAC signature verification",
      "Build and sign a new JWT",
      "Generate example tokens",
    ],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const example = await buildJwt("HS256", EXAMPLE_HEADER, EXAMPLE_PAYLOAD, EXAMPLE_SECRET, false);
      if (!cancelled) {
        setToken(example);
        setSecret(EXAMPLE_SECRET);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (autoFocusEnabled) {
      tokenRef.current?.focus();
    }
  }, [autoFocusEnabled]);

  const decoded = useMemo<DecodeState>(() => {
    const trimmed = token.trim();
    if (!trimmed) return { status: "idle" };

    try {
      const result = decodeJwtStructure(trimmed);
      return {
        status: "success",
        header: result.header,
        payload: result.payload,
        signatureB64: result.signatureB64,
        signingInput: result.signingInput,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof JwtDecodeError ? error.message : "Unable to decode token.",
      };
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (decoded.status !== "success") {
        setVerify({ state: "neutral", message: "Paste a token above to verify its signature." });
        return;
      }

      const alg = decoded.header.alg;
      if (typeof alg !== "string" || !isHmacAlgorithm(alg)) {
        setVerify({
          state: "neutral",
          message:
            typeof alg === "string"
              ? `Verifying "${alg}" signatures isn't supported yet — only HMAC (HS256/384/512) secrets can be checked here.`
              : "This token has no recognizable algorithm to verify.",
        });
        return;
      }

      if (!secret) {
        setVerify({ state: "neutral", message: "Enter the secret used to sign this token to verify its signature." });
        return;
      }

      try {
        const secretBytes = secretToBytes(secret, secretIsBase64Url);
        const ok = await verifyHmacSignature(alg, secretBytes, decoded.signingInput, decoded.signatureB64);
        if (!cancelled) {
          setVerify({
            state: ok ? "valid" : "invalid",
            message: ok ? "Signature verified" : "Invalid signature for the given secret.",
          });
        }
      } catch {
        if (!cancelled) {
          setVerify({ state: "invalid", message: "Unable to verify signature with the provided secret." });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [decoded, secret, secretIsBase64Url]);

  const generateExample = async () => {
    const payload = { ...EXAMPLE_PAYLOAD, iat: Math.floor(Date.now() / 1000) };
    const header = { alg: exampleAlg, typ: "JWT" };
    const example = await buildJwt(exampleAlg, header, payload, EXAMPLE_SECRET, false);
    setToken(example);
    setSecret(EXAMPLE_SECRET);
    setSecretIsBase64Url(false);
  };

  const copyToken = async () => {
    if (!token) return;
    const didCopy = await copyText(token);
    if (didCopy) {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 1500);
    }
  };

  const secretStatus = useMemo<VerifyState>(() => {
    if (!secret) {
      return { state: "neutral", message: "No secret entered yet." };
    }
    if (secretIsBase64Url && !/^[A-Za-z0-9_-]+$/.test(secret)) {
      return { state: "invalid", message: "Not valid Base64URL." };
    }
    return { state: "valid", message: "Valid secret" };
  }, [secret, secretIsBase64Url]);

  const validState: StatusState =
    decoded.status === "idle" ? "neutral" : decoded.status === "success" ? "valid" : "invalid";
  const validLabel =
    decoded.status === "idle"
      ? "Paste a token to check its structure."
      : decoded.status === "success"
        ? "Valid JWT"
        : decoded.message;

  const handleAlgorithmChange = (value: JwtAlgorithm) => {
    setEncAlgorithm(value);
    setHeaderText((current) => {
      try {
        const parsed = JSON.parse(current);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return JSON.stringify({ ...parsed, alg: value }, null, 2);
        }
      } catch {
        // Fall through to a fresh header if the current text isn't valid JSON.
      }
      return headerTextFor(value);
    });
  };

  const encParsed = useMemo<
    | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown> }
    | { ok: false; error: string }
  >(() => {
    let header: unknown;
    try {
      header = JSON.parse(headerText);
    } catch {
      return { ok: false, error: "Header isn't valid JSON." };
    }
    if (typeof header !== "object" || header === null || Array.isArray(header)) {
      return { ok: false, error: "Header must be a JSON object." };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return { ok: false, error: "Payload isn't valid JSON." };
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return { ok: false, error: "Payload must be a JSON object." };
    }

    return {
      ok: true,
      header: header as Record<string, unknown>,
      payload: payload as Record<string, unknown>,
    };
  }, [headerText, payloadText]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!encParsed.ok) {
        setEncError(encParsed.error);
        setEncToken("");
        return;
      }
      if (!encSecret) {
        setEncError("Enter a secret to sign the token.");
        setEncToken("");
        return;
      }

      try {
        const signed = await buildJwt(encAlgorithm, encParsed.header, encParsed.payload, encSecret, encSecretIsBase64Url);
        if (!cancelled) {
          setEncToken(signed);
          setEncError(null);
        }
      } catch {
        if (!cancelled) {
          setEncError("Unable to sign the token with the provided secret.");
          setEncToken("");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [encAlgorithm, encParsed, encSecret, encSecretIsBase64Url]);

  const copyEncToken = async () => {
    if (!encToken) return;
    const didCopy = await copyText(encToken);
    if (didCopy) {
      setEncCopied(true);
      setTimeout(() => setEncCopied(false), 1500);
    }
  };

  const encStatus: StatusState = encError ? "invalid" : encToken ? "valid" : "neutral";
  const encStatusLabel = encError ?? (encToken ? "Token signed" : "Fill in header, payload, and a secret to generate a token.");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mx-auto inline-flex rounded-full border border-border bg-muted/50 p-1 sm:mx-0">
          <button
            type="button"
            onClick={() => setMode("decode")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "decode"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            JWT Decoder
          </button>
          <button
            type="button"
            onClick={() => setMode("encode")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "encode"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            JWT Encoder
          </button>
        </div>

        {mode === "decode" ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={generateExample}>
              Generate example
            </Button>
            <Select value={exampleAlg} onValueChange={(value) => setExampleAlg(value as JwtAlgorithm)}>
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JWT_ALGORITHMS.map((alg) => (
                  <SelectItem key={alg} value={alg}>
                    {alg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Select value={encAlgorithm} onValueChange={(value) => handleAlgorithmChange(value as JwtAlgorithm)}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JWT_ALGORITHMS.map((alg) => (
                <SelectItem key={alg} value={alg}>
                  {alg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground sm:text-base">
        {mode === "decode"
          ? "Paste a JWT below that you'd like to decode, validate, and verify."
          : "Edit the header and payload claims below to build and sign a new JWT."}
      </p>

      {mode === "decode" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Encoded Token</label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoFocusEnabled}
                  onChange={(e) => setAutoFocusEnabled(e.target.checked)}
                  className="accent-primary"
                />
                Enable auto-focus
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">JSON Web Token (JWT)</span>
              <div className="flex items-center gap-0.5">
                <Button type="button" size="icon" variant="ghost" className="size-7" disabled={!token} onClick={copyToken}>
                  {tokenCopied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  <span className="sr-only">Copy token</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  disabled={!token}
                  onClick={() => setToken("")}
                >
                  <X className="size-4" />
                  <span className="sr-only">Clear token</span>
                </Button>
              </div>
            </div>

            <JwtTokenEditor
              ref={tokenRef}
              value={token}
              onChange={setToken}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />

            <div className="space-y-1">
              <StatusRow state={validState} label={validLabel} />
              {decoded.status === "success" ? <StatusRow state={verify.state} label={verify.message} /> : null}
            </div>
          </div>

          <div className="space-y-4">
            <JsonPanel
              title="Decoded Header"
              data={decoded.status === "success" ? decoded.header : null}
              claimInfo={HEADER_CLAIM_INFO}
            />
            <JsonPanel
              title="Decoded Payload"
              data={decoded.status === "success" ? decoded.payload : null}
              claimInfo={PAYLOAD_CLAIM_INFO}
            />

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  JWT Signature Verification <span className="font-normal text-muted-foreground">(Optional)</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Enter the secret used to sign the JWT below:
                </p>
              </div>
              <SecretField
                value={secret}
                onChange={setSecret}
                isBase64Url={secretIsBase64Url}
                onToggleBase64Url={setSecretIsBase64Url}
              />
              <StatusRow state={secretStatus.state} label={secretStatus.message} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Header</label>
              <Textarea
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                spellCheck={false}
                className="min-h-28 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Payload</label>
              <Textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                spellCheck={false}
                className="min-h-52 font-mono text-sm"
              />
            </div>
            <SecretField
              value={encSecret}
              onChange={setEncSecret}
              isBase64Url={encSecretIsBase64Url}
              onToggleBase64Url={setEncSecretIsBase64Url}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Signed Token</label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                disabled={!encToken}
                onClick={copyEncToken}
              >
                {encCopied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span className="sr-only">Copy signed token</span>
              </Button>
            </div>
            <div className="min-h-40 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm break-all whitespace-pre-wrap">
              {encToken ? <TokenSpans token={encToken} /> : <span className="text-muted-foreground">Your signed JWT will appear here.</span>}
            </div>
            <StatusRow state={encStatus} label={encStatusLabel} />
          </div>
        </div>
      )}
    </div>
  );
}
