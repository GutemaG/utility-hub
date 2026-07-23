import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/number-converter")({
  component: RouteComponent,
});

type Mode = "roman" | "geez";

const ROMAN_VALUES: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const ROMAN_DIGIT_VALUE: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

const ROMAN_MIN = 1;
const ROMAN_MAX = 3999;

function toRoman(num: number): string {
  let n = num;
  let result = "";
  for (const [value, symbol] of ROMAN_VALUES) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

// Round-tripping through toRoman rejects non-canonical forms (e.g. "IIII",
// "VX") that a naive left-to-right sum would otherwise accept.
function fromRoman(text: string): number | null {
  const cleaned = text.trim().toUpperCase();
  if (!cleaned || !/^[IVXLCDM]+$/.test(cleaned)) return null;

  let total = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const current = ROMAN_DIGIT_VALUE[cleaned[i]];
    const next = ROMAN_DIGIT_VALUE[cleaned[i + 1]];
    total += next && current < next ? -current : current;
  }

  if (total < ROMAN_MIN || total > ROMAN_MAX || toRoman(total) !== cleaned) return null;
  return total;
}

// Ge'ez numerals: units and tens are added together, then a "hundred" (፻) or
// "ten-thousand" (፼) marker multiplies whatever was accumulated so far and
// adds it to the running total (e.g. ፵፫፻፳፭ = (40+3)*100 + (20+5) = 4,325).
// Because each block (the part before a ፻ or ፼) can only hold a value up to
// 99, the largest number this scheme can represent is 99*10,000 + 99*100 + 99.
const GEEZ_UNITS: Array<[number, string]> = [
  [1, "፩"],
  [2, "፪"],
  [3, "፫"],
  [4, "፬"],
  [5, "፭"],
  [6, "፮"],
  [7, "፯"],
  [8, "፰"],
  [9, "፱"],
];
const GEEZ_TENS: Array<[number, string]> = [
  [10, "፲"],
  [20, "፳"],
  [30, "፴"],
  [40, "፵"],
  [50, "፶"],
  [60, "፷"],
  [70, "፸"],
  [80, "፹"],
  [90, "፺"],
];
const GEEZ_HUNDRED = "፻";
const GEEZ_TEN_THOUSAND = "፼";
const GEEZ_ZERO = "-";

const GEEZ_DIGIT_VALUE: Record<string, number> = Object.fromEntries(
  [...GEEZ_UNITS, ...GEEZ_TENS].map(([value, glyph]) => [glyph, value])
);

const GEEZ_MIN = 0;
const GEEZ_MAX = 99 * 10000 + 99 * 100 + 99;

// Encodes 1-99 as up to one tens symbol followed by up to one units symbol.
function geezBlock(n: number): string {
  const tens = GEEZ_TENS.find(([v]) => v === n - (n % 10))?.[1] ?? "";
  const units = GEEZ_UNITS.find(([v]) => v === n % 10)?.[1] ?? "";
  return tens + units;
}

function toGeez(num: number): string {
  if (num === 0) return GEEZ_ZERO;

  const tenThousands = Math.floor(num / 10000);
  const afterTenThousands = num % 10000;
  const hundreds = Math.floor(afterTenThousands / 100);
  const ones = afterTenThousands % 100;

  let result = "";
  if (tenThousands > 0) {
    result += (tenThousands === 1 ? "" : geezBlock(tenThousands)) + GEEZ_TEN_THOUSAND;
  }
  if (hundreds > 0) {
    result += (hundreds === 1 ? "" : geezBlock(hundreds)) + GEEZ_HUNDRED;
  }
  if (ones > 0) {
    result += geezBlock(ones);
  }
  return result;
}

function fromGeez(text: string): number | null {
  const cleaned = text.trim();
  if (!cleaned) return null;
  if (cleaned === GEEZ_ZERO) return 0;

  let total = 0;
  let holding = 0;
  for (const ch of cleaned) {
    if (ch in GEEZ_DIGIT_VALUE) {
      holding += GEEZ_DIGIT_VALUE[ch];
    } else if (ch === GEEZ_HUNDRED) {
      total += (holding || 1) * 100;
      holding = 0;
    } else if (ch === GEEZ_TEN_THOUSAND) {
      total += (holding || 1) * 10000;
      holding = 0;
    } else {
      return null;
    }
  }
  total += holding;

  if (total < GEEZ_MIN || total > GEEZ_MAX) return null;
  return total;
}

// Spoken Amharic uses a base-1,000 system (thousand/hundred/ten/one), unlike
// the base-10,000 Ge'ez numeral system above — so this is a separate
// algorithm, not derived from toGeez/fromGeez.
const AMHARIC_ONES: Record<number, string> = {
  1: "አንድ",
  2: "ሁለት",
  3: "ሶስት",
  4: "አራት",
  5: "አምስት",
  6: "ስድስት",
  7: "ሰባት",
  8: "ስምንት",
  9: "ዘጠኝ",
};

const AMHARIC_TEENS: Record<number, string> = {
  10: "አስር",
  11: "አስራ አንድ",
  12: "አስራ ሁለት",
  13: "አስራ ሶስት",
  14: "አስራ አራት",
  15: "አስራ አምስት",
  16: "አስራ ስድስት",
  17: "አስራ ሰባት",
  18: "አስራ ስምንት",
  19: "አስራ ዘጠኝ",
};

const AMHARIC_TENS: Record<number, string> = {
  20: "ሃያ",
  30: "ሰላሳ",
  40: "አርባ",
  50: "አምሳ",
  60: "ስድሳ",
  70: "ሰባ",
  80: "ሰማንያ",
  90: "ዘጠና",
};

const AMHARIC_WORD_MIN = 0;
const AMHARIC_WORD_MAX = 99999;

function amharicTwoDigits(num: number): string {
  if (num === 0) return "";
  if (num >= 10 && num <= 19) return AMHARIC_TEENS[num];
  const tens = Math.floor(num / 10) * 10;
  const ones = num % 10;
  return [AMHARIC_TENS[tens], AMHARIC_ONES[ones]].filter(Boolean).join(" ");
}

function numberToAmharicWords(num: number): string {
  if (num === 0) return "ዜሮ";

  const words: string[] = [];
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    words.push(`${amharicTwoDigits(thousands)} ሺህ`);
  }

  const afterThousands = num % 1000;
  const hundreds = Math.floor(afterThousands / 100);
  if (hundreds > 0) {
    words.push(`${AMHARIC_ONES[hundreds]} መቶ`);
  }

  const tensAndOnes = afterThousands % 100;
  if (tensAndOnes > 0) {
    words.push(amharicTwoDigits(tensAndOnes));
  }

  return words.join(" ");
}

interface GeezRow {
  integer: number;
  value: string;
  amharic: string;
}

const RANGE_MAX_ROWS = 5000;

function escapeCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function RouteComponent() {
  const [mode, setMode] = useState<Mode>("roman");

  // Roman numerals
  const [romanNumberText, setRomanNumberText] = useState("58");
  const [romanText, setRomanText] = useState("LVIII");
  const [romanError, setRomanError] = useState<string | null>(null);
  const [romanErrorField, setRomanErrorField] = useState<"number" | "roman" | null>(null);
  const [romanCopied, setRomanCopied] = useState<"number" | "roman" | null>(null);

  // Ge'ez numbers
  const [geezNumberText, setGeezNumberText] = useState("4325");
  const [geezText, setGeezText] = useState(toGeez(4325));
  const [geezError, setGeezError] = useState<string | null>(null);
  const [geezErrorField, setGeezErrorField] = useState<"number" | "geez" | null>(null);
  const [geezCopied, setGeezCopied] = useState<"number" | "geez" | "amharic" | null>(null);

  // Range generator
  const [rangeFromText, setRangeFromText] = useState("0");
  const [rangeToText, setRangeToText] = useState("100");
  const [rangeStepText, setRangeStepText] = useState("1");
  const [rangeSearch, setRangeSearch] = useState("");

  useSEO({
    title: "Number Converter | Utility Hub",
    description:
      "Convert numbers to and from Roman numerals, to and from Ethiopian Ge'ez numerals, and to Amharic number words.",
    path: "/number-converter",
    keywords:
      "roman numeral converter, number to roman numerals, roman numerals to number, geez numbers, ethiopian numerals, geez numeral converter, amharic numbers, number to amharic words, ge'ez to number",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Number to/from Roman numerals (1-3999)",
      `Number to/from Ethiopian Ge'ez numerals (0-${GEEZ_MAX.toLocaleString()})`,
      `Number to Amharic words (0-${AMHARIC_WORD_MAX.toLocaleString()})`,
      "Generate and download a Ge'ez/Amharic range as CSV",
    ],
  });

  const handleRomanNumberChange = (text: string) => {
    setRomanNumberText(text);
    if (!text.trim()) {
      setRomanError(null);
      setRomanErrorField(null);
      return;
    }
    const n = Number(text);
    if (!Number.isInteger(n) || n < ROMAN_MIN || n > ROMAN_MAX) {
      setRomanError(`Enter a whole number between ${ROMAN_MIN} and ${ROMAN_MAX}.`);
      setRomanErrorField("number");
      return;
    }
    setRomanError(null);
    setRomanErrorField(null);
    setRomanText(toRoman(n));
  };

  const handleRomanTextChange = (text: string) => {
    setRomanText(text);
    if (!text.trim()) {
      setRomanError(null);
      setRomanErrorField(null);
      return;
    }
    const n = fromRoman(text);
    if (n === null) {
      setRomanError("Not a valid Roman numeral.");
      setRomanErrorField("roman");
      return;
    }
    setRomanError(null);
    setRomanErrorField(null);
    setRomanNumberText(String(n));
  };

  const copyRoman = async (key: "number" | "roman", text: string) => {
    if (!text) return;
    const didCopy = await copyText(text);
    if (didCopy) {
      setRomanCopied(key);
      setTimeout(() => setRomanCopied((c) => (c === key ? null : c)), 1500);
    }
  };

  const handleGeezNumberChange = (text: string) => {
    setGeezNumberText(text);
    if (!text.trim()) {
      setGeezError(null);
      setGeezErrorField(null);
      return;
    }
    const n = Number(text);
    if (!Number.isInteger(n) || n < GEEZ_MIN || n > GEEZ_MAX) {
      setGeezError(`Enter a whole number between ${GEEZ_MIN} and ${GEEZ_MAX.toLocaleString()}.`);
      setGeezErrorField("number");
      return;
    }
    setGeezError(null);
    setGeezErrorField(null);
    setGeezText(toGeez(n));
  };

  const handleGeezTextChange = (text: string) => {
    setGeezText(text);
    if (!text.trim()) {
      setGeezError(null);
      setGeezErrorField(null);
      return;
    }
    const n = fromGeez(text);
    if (n === null) {
      setGeezError("Not a valid Ge'ez numeral.");
      setGeezErrorField("geez");
      return;
    }
    setGeezError(null);
    setGeezErrorField(null);
    setGeezNumberText(String(n));
  };

  const geezNumber = Number(geezNumberText);
  const geezNumberIsValid = geezNumberText.trim() !== "" && Number.isInteger(geezNumber);
  const amharicWord =
    geezNumberIsValid && geezNumber >= AMHARIC_WORD_MIN && geezNumber <= AMHARIC_WORD_MAX
      ? numberToAmharicWords(geezNumber)
      : null;

  const rangeResult = useMemo((): { rows: GeezRow[]; error: string | null } => {
    const from = Number(rangeFromText);
    const to = Number(rangeToText);
    const step = Number(rangeStepText);

    if (!rangeFromText.trim() || !rangeToText.trim() || !rangeStepText.trim()) {
      return { rows: [], error: null };
    }
    if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(step)) {
      return { rows: [], error: "From, To, and Step must be whole numbers." };
    }
    if (step < 1) {
      return { rows: [], error: "Step must be at least 1." };
    }
    if (from < GEEZ_MIN || to > GEEZ_MAX) {
      return { rows: [], error: `From and To must be within ${GEEZ_MIN}-${GEEZ_MAX.toLocaleString()}.` };
    }
    if (from > to) {
      return { rows: [], error: "From must be less than or equal to To." };
    }

    const count = Math.floor((to - from) / step) + 1;
    if (count > RANGE_MAX_ROWS) {
      return {
        rows: [],
        error: `That range would generate ${count.toLocaleString()} rows — narrow the range or increase the step (max ${RANGE_MAX_ROWS.toLocaleString()}).`,
      };
    }

    const rows: GeezRow[] = [];
    for (let n = from; n <= to; n += step) {
      rows.push({ integer: n, value: toGeez(n), amharic: n <= AMHARIC_WORD_MAX ? numberToAmharicWords(n) : "" });
    }
    return { rows, error: null };
  }, [rangeFromText, rangeToText, rangeStepText]);

  const rangeFiltered = useMemo(() => {
    const query = rangeSearch.trim().toLowerCase();
    if (!query) return rangeResult.rows;
    return rangeResult.rows.filter(
      (e) =>
        String(e.integer).includes(query) ||
        e.value.toLowerCase().includes(query) ||
        e.amharic.toLowerCase().includes(query)
    );
  }, [rangeResult.rows, rangeSearch]);

  const selectGeezNumber = (n: number) => {
    setGeezNumberText(String(n));
    setGeezText(toGeez(n));
    setGeezError(null);
    setGeezErrorField(null);
  };

  const copyGeez = async (key: "number" | "geez" | "amharic", text: string) => {
    if (!text) return;
    const didCopy = await copyText(text);
    if (didCopy) {
      setGeezCopied(key);
      setTimeout(() => setGeezCopied((c) => (c === key ? null : c)), 1500);
    }
  };

  const downloadRangeCsv = () => {
    if (rangeResult.rows.length === 0) return;
    const header = "Number,Ge'ez,Amharic";
    const csvRows = rangeResult.rows.map((r) =>
      [String(r.integer), escapeCsvField(r.value), escapeCsvField(r.amharic)].join(",")
    );
    const csv = "﻿" + [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geez-numbers-${rangeFromText}-${rangeToText}-step${rangeStepText}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Number Converter</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Convert numbers to/from Roman numerals, or to/from Ethiopian Ge&apos;ez numerals with an Amharic word
          reference.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-border p-1">
        {(["roman", "geez"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              mode === m ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            {m === "roman" ? "Roman Numerals" : "Ethiopian (Ge'ez) Numbers"}
          </button>
        ))}
      </div>

      {mode === "roman" ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="sm:w-32 shrink-0 text-sm">Number</Label>
              <Input
                type="number"
                min={ROMAN_MIN}
                max={ROMAN_MAX}
                value={romanNumberText}
                onChange={(e) => handleRomanNumberChange(e.target.value)}
                className={cn(
                  "font-mono",
                  romanErrorField === "number" && "border-red-500 focus-visible:ring-red-300"
                )}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => copyRoman("number", romanNumberText)}
                disabled={!romanNumberText}
              >
                {romanCopied === "number" ? "Copied" : "Copy"}
              </Button>
            </div>
            {romanErrorField === "number" ? <p className="sm:ml-36 text-xs text-red-600">{romanError}</p> : null}
          </div>

          <div className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="sm:w-32 shrink-0 text-sm">Roman Numeral</Label>
              <Input
                value={romanText}
                onChange={(e) => handleRomanTextChange(e.target.value)}
                spellCheck={false}
                className={cn(
                  "font-mono uppercase",
                  romanErrorField === "roman" && "border-red-500 focus-visible:ring-red-300"
                )}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => copyRoman("roman", romanText)}
                disabled={!romanText}
              >
                {romanCopied === "roman" ? "Copied" : "Copy"}
              </Button>
            </div>
            {romanErrorField === "roman" ? <p className="sm:ml-36 text-xs text-red-600">{romanError}</p> : null}
          </div>

          <p className="pt-2 text-xs text-muted-foreground">
            Standard Roman numerals only represent whole numbers from {ROMAN_MIN} to {ROMAN_MAX}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
            <div className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label className="sm:w-32 shrink-0 text-sm">Number</Label>
                <Input
                  type="number"
                  min={GEEZ_MIN}
                  max={GEEZ_MAX}
                  value={geezNumberText}
                  onChange={(e) => handleGeezNumberChange(e.target.value)}
                  className={cn(
                    "font-mono",
                    geezErrorField === "number" && "border-red-500 focus-visible:ring-red-300"
                  )}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => copyGeez("number", geezNumberText)}
                  disabled={!geezNumberText}
                >
                  {geezCopied === "number" ? "Copied" : "Copy"}
                </Button>
              </div>
              {geezErrorField === "number" ? <p className="sm:ml-36 text-xs text-red-600">{geezError}</p> : null}
            </div>

            <div className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label className="sm:w-32 shrink-0 text-sm">Ge&apos;ez Numeral</Label>
                <Input
                  value={geezText}
                  onChange={(e) => handleGeezTextChange(e.target.value)}
                  spellCheck={false}
                  className={cn(
                    "font-mono",
                    geezErrorField === "geez" && "border-red-500 focus-visible:ring-red-300"
                  )}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => copyGeez("geez", geezText)}
                  disabled={!geezText}
                >
                  {geezCopied === "geez" ? "Copied" : "Copy"}
                </Button>
              </div>
              {geezErrorField === "geez" ? <p className="sm:ml-36 text-xs text-red-600">{geezError}</p> : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="sm:w-32 shrink-0 text-sm">Amharic Word</Label>
              <Input readOnly value={amharicWord ?? ""} className="font-mono" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => copyGeez("amharic", amharicWord ?? "")}
                disabled={!amharicWord}
              >
                {geezCopied === "amharic" ? "Copied" : "Copy"}
              </Button>
            </div>

            {!amharicWord && geezNumberIsValid && !geezErrorField ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Amharic words are only supported up to {AMHARIC_WORD_MAX.toLocaleString()}.
              </p>
            ) : null}

            <p className="pt-2 text-xs text-muted-foreground">
              Ge&apos;ez numerals here support whole numbers from {GEEZ_MIN} to {GEEZ_MAX.toLocaleString()}. Amharic
              words support {AMHARIC_WORD_MIN} to {AMHARIC_WORD_MAX.toLocaleString()}.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-3">
            <Label className="text-sm">Generate a Range</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="number"
                  min={GEEZ_MIN}
                  max={GEEZ_MAX}
                  value={rangeFromText}
                  onChange={(e) => setRangeFromText(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="number"
                  min={GEEZ_MIN}
                  max={GEEZ_MAX}
                  value={rangeToText}
                  onChange={(e) => setRangeToText(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Step</Label>
                <Input
                  type="number"
                  min={1}
                  value={rangeStepText}
                  onChange={(e) => setRangeStepText(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {rangeResult.error ? <p className="text-xs text-red-600">{rangeResult.error}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {rangeResult.rows.length.toLocaleString()} row{rangeResult.rows.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={rangeSearch}
                  onChange={(e) => setRangeSearch(e.target.value)}
                  placeholder="Search by number, glyph, or Amharic word..."
                  className="max-w-64"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={downloadRangeCsv}
                  disabled={rangeResult.rows.length === 0}
                >
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Ge&apos;ez</TableHead>
                    <TableHead>Amharic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rangeFiltered.map((entry) => (
                    <TableRow
                      key={entry.integer}
                      className="cursor-pointer"
                      onClick={() => selectGeezNumber(entry.integer)}
                    >
                      <TableCell className="font-mono text-xs">{entry.integer}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.value}</TableCell>
                      <TableCell className="text-xs">{entry.amharic}</TableCell>
                    </TableRow>
                  ))}
                  {rangeFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                        No rows.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteComponent;
