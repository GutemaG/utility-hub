import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/integer-base-converter")({
  component: RouteComponent,
});

// Digits 0-9, then a-z, then A-Z, then + and / — a base-N alphabet is always a
// prefix of a base-M alphabet for N < M, so raising the base never changes
// what earlier digits mean.
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
const MIN_BASE = 2;
const MAX_BASE = 64;

function parseInBase(text: string, base: number): bigint | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  let negative = false;
  let body = trimmed;
  if (body[0] === "-") {
    negative = true;
    body = body.slice(1);
  }
  if (body.length === 0) return null;

  const bigBase = BigInt(base);
  let result = 0n;
  for (const ch of body) {
    const digit = ALPHABET.indexOf(ch);
    if (digit === -1 || digit >= base) return null;
    result = result * bigBase + BigInt(digit);
  }
  return negative ? -result : result;
}

function formatInBase(value: bigint, base: number): string {
  if (value === 0n) return "0";
  const negative = value < 0n;
  let v = negative ? -value : value;
  const bigBase = BigInt(base);
  let out = "";
  while (v > 0n) {
    const digit = Number(v % bigBase);
    out = ALPHABET[digit] + out;
    v /= bigBase;
  }
  return negative ? `-${out}` : out;
}

interface StandardRow {
  base: number;
  label: string;
}

const STANDARD_ROWS: StandardRow[] = [
  { base: 2, label: "Binary (base 2)" },
  { base: 8, label: "Octal (base 8)" },
  { base: 10, label: "Decimal (base 10)" },
  { base: 16, label: "Hexadecimal (base 16)" },
  { base: 64, label: "Base64 numeral (base 64)" },
];

const START_VALUE = 58n;

function RouteComponent() {
  const [values, setValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const row of STANDARD_ROWS) initial[row.base] = formatInBase(START_VALUE, row.base);
    return initial;
  });
  const [customBase, setCustomBase] = useState(36);
  const [customValue, setCustomValue] = useState(formatInBase(START_VALUE, 36));
  const [invalidBase, setInvalidBase] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | "custom" | null>(null);

  useSEO({
    title: "Integer Base Converter | Utility Hub",
    description:
      "Convert integers between binary, octal, decimal, hexadecimal, base64, and any custom base from 2 to 64. Supports arbitrarily large numbers.",
    path: "/integer-base-converter",
    keywords: "base converter, binary to decimal, hex converter, octal converter, base64 numeral, radix converter, number base converter",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "Binary, octal, decimal, hexadecimal, and base64 conversion",
      "Custom base from 2 to 64",
      "Arbitrary-precision (BigInt) integers",
      "Negative number support",
      "Edit any field, all others update live",
    ],
  });

  const applyValue = (parsed: bigint, editedBase: number, editedText: string) => {
    setInvalidBase(null);
    const next: Record<number, string> = {};
    for (const row of STANDARD_ROWS) {
      next[row.base] = row.base === editedBase ? editedText : formatInBase(parsed, row.base);
    }
    setValues(next);
    setCustomValue(editedBase === customBase ? editedText : formatInBase(parsed, customBase));
  };

  const handleRowChange = (base: number, text: string) => {
    setValues((prev) => ({ ...prev, [base]: text }));
    if (!text.trim()) {
      setInvalidBase(null);
      return;
    }
    const parsed = parseInBase(text, base);
    if (parsed === null) {
      setInvalidBase(base);
      return;
    }
    applyValue(parsed, base, text);
  };

  const handleCustomValueChange = (text: string) => {
    setCustomValue(text);
    if (!text.trim()) {
      setInvalidBase(null);
      return;
    }
    const parsed = parseInBase(text, customBase);
    if (parsed === null) {
      setInvalidBase(-1); // sentinel for custom row
      return;
    }
    applyValue(parsed, customBase, text);
  };

  const handleCustomBaseChange = (rawBase: number) => {
    const base = Math.min(MAX_BASE, Math.max(MIN_BASE, Number.isNaN(rawBase) ? MIN_BASE : rawBase));
    setCustomBase(base);
    // Re-derive the custom field from the last known-good decimal value.
    const parsed = parseInBase(values[10], 10);
    if (parsed !== null) {
      setCustomValue(formatInBase(parsed, base));
      // Only clear the custom row's own error — a different row's pending
      // invalid entry (e.g. Binary) shouldn't be dismissed by this change.
      setInvalidBase((prev) => (prev === -1 ? null : prev));
    }
  };

  const copyRow = async (key: number | "custom", text: string) => {
    const didCopy = await copyText(text);
    if (didCopy) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Integer Base Converter</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Convert integers between binary, octal, decimal, hexadecimal, base64, and any custom
          base. Edit any field — the rest update automatically.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
        {STANDARD_ROWS.map((row) => (
          <div key={row.base} className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="sm:w-48 shrink-0 text-sm">{row.label}</Label>
              <Input
                value={values[row.base]}
                onChange={(e) => handleRowChange(row.base, e.target.value)}
                className={cn(
                  "font-mono",
                  invalidBase === row.base && "border-red-500 focus-visible:ring-red-300"
                )}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => copyRow(row.base, values[row.base])}
                disabled={!values[row.base]}
              >
                {copied === row.base ? "Copied" : "Copy"}
              </Button>
            </div>
            {invalidBase === row.base ? (
              <p className="sm:ml-52 text-xs text-red-600">Not a valid base-{row.base} number.</p>
            ) : null}
          </div>
        ))}

        <hr className="border-border" />

        <div className="space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center gap-2 sm:w-48">
              <Label className="text-sm">Custom Base</Label>
              <Input
                type="number"
                min={MIN_BASE}
                max={MAX_BASE}
                value={customBase}
                onChange={(e) => handleCustomBaseChange(Number(e.target.value))}
                className="w-16 font-mono"
              />
            </div>
            <Input
              value={customValue}
              onChange={(e) => handleCustomValueChange(e.target.value)}
              className={cn(
                "font-mono",
                invalidBase === -1 && "border-red-500 focus-visible:ring-red-300"
              )}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => copyRow("custom", customValue)}
              disabled={!customValue}
            >
              {copied === "custom" ? "Copied" : "Copy"}
            </Button>
          </div>
          {invalidBase === -1 ? (
            <p className="sm:ml-52 text-xs text-red-600">Not a valid base-{customBase} number.</p>
          ) : null}
        </div>

        <p className="pt-2 text-xs text-muted-foreground">
          Bases above 36 use digits 0-9, a-z, A-Z, then + and / (a base-N alphabet is always a
          prefix of a larger base's). "Base64 numeral" here is a positional number system, not
          the same as file Base64 encoding — see the Base64 File Converter for that.
        </p>
      </div>
    </div>
  );
}

export default RouteComponent;
