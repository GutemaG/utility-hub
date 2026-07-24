import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Check, Copy } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { copyText } from "@/lib/clipboard";
import {
  formatResultNumber,
  parseExcludeList,
  parseNumberGrid,
  removeValuesFromInput,
  sortNumbersInInput,
  type DelimiterMode,
} from "@/lib/number-grid";

export const Route = createFileRoute("/number-sum-calculator")({
  component: RouteComponent,
});

const SAMPLE_INPUT = `38.5

33.46
30
52.28

23
38.52
15.79
10.37
2.55
12.47
10.11
4.19
1.6371
3.0508
47.81
14.09




65.89
25
43.83
250
25.62
50.29
101.06
32.87
38.56`;

const DELIMITER_OPTIONS: { value: DelimiterMode; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "newline", label: "One per line" },
  { value: "comma", label: "Comma (CSV)" },
  { value: "tab", label: "Tab" },
  { value: "whitespace", label: "Space" },
];

function RouteComponent() {
  useSEO({
    title: "Number Sum Calculator | Utility Hub",
    description:
      "Paste a column or grid of numbers — from a spreadsheet, CSV, or plain text — and instantly get the sum, average, min, max, plus per-row and per-column totals. Blank lines and cells are skipped automatically.",
    path: "/number-sum-calculator",
    keywords:
      "sum calculator, add numbers, paste and sum, column sum, row sum, matrix sum, csv sum, add list of numbers",
    applicationCategory: "UtilitiesApplication",
    featureList: [
      "Auto-detects newline, comma, tab, or space separated numbers",
      "Skips blank lines and empty cells, with a one-click cleanup button",
      "Exclude specific values (like stray zeros) from the totals, or delete them from the list entirely",
      "Sort the pasted numbers ascending or descending",
      "Sum, count, average, min, and max",
      "Per-row and per-column totals for grid/matrix input",
      "Copy results as TSV",
    ],
  });

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<DelimiterMode>("auto");
  const [excludeInput, setExcludeInput] = useState("0");
  const [copied, setCopied] = useState(false);

  const excludeValues = useMemo(() => parseExcludeList(excludeInput), [excludeInput]);
  const result = useMemo(() => parseNumberGrid(input, mode, excludeValues), [input, mode, excludeValues]);
  const isGrid = result.columnCount > 1;

  const handleClear = () => setInput("");
  const handleSample = () => setInput(SAMPLE_INPUT);
  const handleRemoveBlankLines = () =>
    setInput((current) =>
      current
        .split(/\r\n|\r|\n/)
        .filter((line) => line.trim() !== "")
        .join("\n")
    );
  const handleRemoveListedValues = () =>
    setInput((current) => removeValuesFromInput(current, result.delimiterUsed, excludeValues));
  const handleSort = (direction: "asc" | "desc") =>
    setInput((current) => sortNumbersInInput(current, mode, direction));

  const handleCopy = async () => {
    const lines = isGrid
      ? [
          ...result.grid.map((row, r) =>
            [...row.map((v) => (v !== undefined ? formatResultNumber(v) : "")), formatResultNumber(result.rowSums[r])].join("\t")
          ),
          [...result.columnSums.map(formatResultNumber), formatResultNumber(result.sum)].join("\t"),
        ]
      : [`Sum\t${formatResultNumber(result.sum)}`, `Count\t${result.count}`, `Average\t${formatResultNumber(result.average)}`, `Min\t${result.min !== null ? formatResultNumber(result.min) : ""}`, `Max\t${result.max !== null ? formatResultNumber(result.max) : ""}`];

    const didCopy = await copyText(lines.join("\n"));
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Number Sum Calculator</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Paste numbers from anywhere — a spreadsheet column, a CSV row, or a plain list — and get an
          instant sum. Blank lines and empty cells are skipped automatically.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Input</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={mode} onValueChange={(value) => setMode(value as DelimiterMode)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Delimiter" />
              </SelectTrigger>
              <SelectContent>
                {DELIMITER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={handleRemoveBlankLines} disabled={!input}>
              Remove blank lines
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleSample}>
              Load sample
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleClear} disabled={!input}>
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="field-sizing-fixed h-64 max-h-[32rem] resize-y overflow-y-auto font-mono text-sm"
          placeholder={"Paste numbers here, one per line, comma separated, tab separated, or a mix.\n\n38.5\n33.46\n30\n52.28"}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Label htmlFor="exclude-values" className="text-xs font-medium text-muted-foreground">
            Exclude values
          </Label>
          <Input
            id="exclude-values"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            placeholder="e.g. 0, -1"
            className="h-8 w-40 text-sm"
          />
          <p className="text-xs text-muted-foreground">Comma-separated numbers to leave out of the totals.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveListedValues}
            disabled={!input || excludeValues.length === 0}
            title="Delete every cell matching the excluded values above, right out of the input"
          >
            Remove excluded values from list
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSort("asc")}
            disabled={!input}
            title="Rewrite the list sorted ascending, one number per line"
          >
            <ArrowUpNarrowWide className="h-4 w-4" />
            Ascending
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSort("desc")}
            disabled={!input}
            title="Rewrite the list sorted descending, one number per line"
          >
            <ArrowDownNarrowWide className="h-4 w-4" />
            Descending
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {result.count > 0
            ? `Detected ${result.count} value${result.count === 1 ? "" : "s"}${
                isGrid ? ` across ${result.rowCount} row${result.rowCount === 1 ? "" : "s"} × ${result.columnCount} column${result.columnCount === 1 ? "" : "s"}` : ""
              } (${DELIMITER_OPTIONS.find((o) => o.value === result.delimiterUsed)?.label.toLowerCase()} delimiter).`
            : "Paste some numbers above to see the results."}
          {result.excludedCount > 0
            ? ` Excluded ${result.excludedCount} value${result.excludedCount === 1 ? "" : "s"} matching ${excludeValues.join(", ")}.`
            : ""}
        </p>
        {result.invalidTokens.length > 0 ? (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Skipped {result.invalidTokens.length} non-numeric token{result.invalidTokens.length === 1 ? "" : "s"}:{" "}
            {result.invalidTokens.slice(0, 12).join(", ")}
            {result.invalidTokens.length > 12 ? ", …" : ""}
          </p>
        ) : null}
      </div>

      {result.count > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Sum" value={formatResultNumber(result.sum)} highlight />
            <StatCard label="Count" value={result.count.toLocaleString()} />
            <StatCard label="Average" value={formatResultNumber(result.average)} />
            <StatCard label="Min" value={result.min !== null ? formatResultNumber(result.min) : "—"} />
            <StatCard label="Max" value={result.max !== null ? formatResultNumber(result.max) : "—"} />
          </div>

          {isGrid ? (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Row &amp; column totals</h2>
                <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy as TSV"}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    {Array.from({ length: result.columnCount }, (_, c) => (
                      <TableHead key={c} className="text-right">
                        Col {c + 1}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-semibold">Row sum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.grid.map((row, r) => (
                    <TableRow key={r}>
                      <TableCell className="text-muted-foreground">{r + 1}</TableCell>
                      {Array.from({ length: result.columnCount }, (_, c) => (
                        <TableCell key={c} className="text-right">
                          {row[c] !== undefined ? formatResultNumber(row[c]) : ""}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">{formatResultNumber(result.rowSums[r])}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Column sum</TableCell>
                    {result.columnSums.map((colSum, c) => (
                      <TableCell key={c} className="text-right">
                        {formatResultNumber(colSum)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">{formatResultNumber(result.sum)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy results"}
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-primary/30 bg-primary/10 p-4 text-center shadow-sm"
          : "rounded-lg border border-border bg-card p-4 text-center shadow-sm"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold break-words text-foreground sm:text-2xl">{value}</p>
    </div>
  );
}
