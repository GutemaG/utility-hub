import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { stringify as toYaml } from "yaml";

export const Route = createFileRoute("/json-validator")({
  component: RouteComponent,
});

type ToolMode = "validate" | "repair" | "minify" | "sort" | "diff" | "csv" | "yaml";

type CsvDelimiterOption = "," | ";" | "\t" | "|";

const DELIMITER_OPTIONS: Array<{ label: string; value: CsvDelimiterOption }> = [
  { label: "Comma (,)", value: "," },
  { label: "Semicolon (;)", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe (|)", value: "|" },
];

const MODE_META: Record<ToolMode, { label: string; help: string }> = {
  validate: {
    label: "Validate",
    help: "Checks JSON syntax and shows precise parse feedback.",
  },
  repair: {
    label: "Repair",
    help: "Applies safe auto-fixes like trailing comma removal and key quoting.",
  },
  minify: {
    label: "Minify",
    help: "Compresses JSON into a single compact line.",
  },
  sort: {
    label: "Sort Keys",
    help: "Recursively sorts object keys alphabetically.",
  },
  diff: {
    label: "Diff",
    help: "Compares two JSON values and lists path-level differences.",
  },
  csv: {
    label: "CSV",
    help: "Converts JSON object or array of objects into CSV output.",
  },
  yaml: {
    label: "YAML",
    help: "Converts JSON into human-readable YAML format.",
  },
};

function RouteComponent() {
  const [input, setInput] = useState(`{\n  "name": "Utility Hub",\n  "version": "1.0.1"\n}`);
  const [secondaryInput, setSecondaryInput] = useState("{}");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [mode, setMode] = useState<ToolMode>("validate");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [delimiter, setDelimiter] = useState<CsvDelimiterOption>(",");
  const activeModeMeta = MODE_META[mode];

  useSEO({
    title: "JSON Validator & Converter | Utility Hub",
    description:
      "Validate, repair, minify, sort, diff, and convert JSON to CSV or YAML with syntax highlighting.",
    path: "/json-validator",
    keywords: "json validator, json minify, json sort keys, json diff, json to csv, json to yaml",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "JSON validation",
      "Basic JSON repair",
      "JSON minify",
      "Sort object keys",
      "JSON diff",
      "JSON to CSV",
      "JSON to YAML",
      "Syntax-highlighted preview",
    ],
  });

  const result = useMemo(
    () =>
      runJsonTool({
        mode,
        input,
        secondaryInput,
        includeHeader,
        delimiter,
      }),
    [mode, input, secondaryInput, includeHeader, delimiter]
  );

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

  const clear = () => {
    setInput("");
    setSecondaryInput("");
    setCopied(null);
  };

  const loadSample = () => {
    const sample = getSampleForMode(mode);
    setInput(sample.input);
    setSecondaryInput(sample.secondaryInput);
    setCopied(null);
  };

  const inputLineCount = useMemo(() => input.split(/\r\n|\n|\r/).length, [input]);
  const outputLineCount = useMemo(
    () => (result.output ? result.output.split(/\r\n|\n|\r/).length : 0),
    [result.output]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">JSON Toolbox</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Validate, transform, and convert JSON with one focused tool.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">{activeModeMeta.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activeModeMeta.help}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <ToolTab label={MODE_META.validate.label} active={mode === "validate"} onClick={() => setMode("validate")} />
          <ToolTab label={MODE_META.repair.label} active={mode === "repair"} onClick={() => setMode("repair")} />
          <ToolTab label={MODE_META.minify.label} active={mode === "minify"} onClick={() => setMode("minify")} />
          <ToolTab label={MODE_META.sort.label} active={mode === "sort"} onClick={() => setMode("sort")} />
          <ToolTab label={MODE_META.diff.label} active={mode === "diff"} onClick={() => setMode("diff")} />
          <ToolTab label={MODE_META.csv.label} active={mode === "csv"} onClick={() => setMode("csv")} />
          <ToolTab label={MODE_META.yaml.label} active={mode === "yaml"} onClick={() => setMode("yaml")} />
          <Button type="button" size="sm" variant="secondary" onClick={loadSample}>
            Load Sample
          </Button>
        </div>

        {mode === "csv" ? (
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
              />
              Include header row
            </label>
            <label className="flex items-center gap-2 text-foreground">
              Delimiter
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as CsvDelimiterOption)}
                className="rounded border border-input bg-background px-2 py-1"
                aria-label="CSV delimiter"
              >
                {DELIMITER_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {mode === "diff" ? "Left JSON" : "Input JSON"}
              </label>
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
              className="min-h-64 font-mono text-sm"
              placeholder={mode === "diff" ? "Paste first JSON value..." : "Paste JSON here..."}
              spellCheck={false}
              aria-label="Primary JSON input"
            />
            <p className="text-xs text-muted-foreground">{inputLineCount} line(s)</p>

            {mode === "diff" ? (
              <>
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-foreground">Right JSON</label>
                </div>
                <Textarea
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="min-h-64 font-mono text-sm"
                  placeholder="Paste second JSON for diff..."
                  spellCheck={false}
                  aria-label="Secondary JSON input for diff"
                />
              </>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Output</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!result.output}
                onClick={() => copyToClipboard(result.output, "output")}
              >
                {copied === "output" ? "Copied" : "Copy"}
              </Button>
            </div>
            {mode === "validate" || mode === "repair" || mode === "sort" || mode === "minify" ? (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                {result.output ? (
                  <JsonHighlightedPreview value={result.output} />
                ) : (
                  <pre className="max-h-72 overflow-auto rounded bg-background p-3 text-xs leading-5 text-muted-foreground">
                    Result appears here
                  </pre>
                )}
              </div>
            ) : mode === "diff" ? (
              <JsonDiffView rows={result.diffRows} />
            ) : (
              <Textarea
                value={result.output}
                readOnly
                className="min-h-64 font-mono text-sm"
                placeholder="Result appears here"
                spellCheck={false}
                aria-label="Tool output"
              />
            )}
            <p className="text-xs text-muted-foreground">{outputLineCount} line(s)</p>
          </div>
        </div>

        {result.status === "success" ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {result.message}
          </div>
        ) : null}

        {result.status === "error" ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{result.message}</p>
            {result.location ? (
              <p className="mt-1 text-xs">
                Line {result.location.line}, Column {result.location.column}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={clear} disabled={!input && !secondaryInput}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

type ToolResult = {
  status: "empty" | "success" | "error";
  output: string;
  message: string;
  location: { line: number; column: number } | null;
  diffRows: DiffRow[];
};

function runJsonTool({
  mode,
  input,
  secondaryInput,
  includeHeader,
  delimiter,
}: {
  mode: ToolMode;
  input: string;
  secondaryInput: string;
  includeHeader: boolean;
  delimiter: string;
}): ToolResult {
  if (!input.trim()) {
    return {
      status: "empty",
      output: "",
      message: "",
      location: null,
      diffRows: [],
    };
  }

  try {
    if (mode === "diff") {
      const left = JSON.parse(input);
      const right = JSON.parse(secondaryInput);
      const differences = diffObjects(left, right);
      const diffRows = buildJsonDiffRows(left, right);

      return {
        status: "success",
        output:
          differences.length > 0
            ? differences.join("\n")
            : "No differences found. Both JSON values are equivalent.",
        message: differences.length > 0 ? `Found ${differences.length} difference(s).` : "No differences found.",
        location: null,
        diffRows,
      };
    }

    if (mode === "repair") {
      const repaired = basicRepairJson(input);
      const parsed = JSON.parse(repaired);
      return {
        status: "success",
        output: JSON.stringify(parsed, null, 2),
        message: "JSON repaired with basic heuristics.",
        location: null,
        diffRows: [],
      };
    }

    const parsed = JSON.parse(input);

    if (mode === "minify") {
      return {
        status: "success",
        output: JSON.stringify(parsed),
        message: "JSON minified successfully.",
        location: null,
        diffRows: [],
      };
    }

    if (mode === "sort") {
      return {
        status: "success",
        output: JSON.stringify(sortJsonKeys(parsed), null, 2),
        message: "Object keys sorted recursively.",
        location: null,
        diffRows: [],
      };
    }

    if (mode === "csv") {
      return {
        status: "success",
        output: jsonToCsv(parsed, includeHeader, delimiter),
        message: "JSON converted to CSV.",
        location: null,
        diffRows: [],
      };
    }

    if (mode === "yaml") {
      return {
        status: "success",
        output: toYaml(parsed),
        message: "JSON converted to YAML.",
        location: null,
        diffRows: [],
      };
    }

    return {
      status: "success",
      output: JSON.stringify(parsed, null, 2),
      message: "Valid JSON.",
      location: null,
      diffRows: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    const positionMatch = message.match(/position\s+(\d+)/i);

    if (!positionMatch) {
      return {
        status: "error",
        output: "",
        message,
        location: null,
        diffRows: [],
      };
    }

    const location = getLineAndColumn(input, Number(positionMatch[1]));

    return {
      status: "error",
      output: "",
      message,
      location,
      diffRows: [],
    };
  }
}

type DiffRow = {
  kind: "same" | "add" | "remove";
  text: string;
};

function buildJsonDiffRows(left: unknown, right: unknown): DiffRow[] {
  const leftLines = JSON.stringify(left, null, 2).split("\n");
  const rightLines = JSON.stringify(right, null, 2).split("\n");
  const rows: DiffRow[] = [];
  const max = Math.max(leftLines.length, rightLines.length);

  for (let i = 0; i < max; i += 1) {
    const leftLine = leftLines[i];
    const rightLine = rightLines[i];

    if (leftLine === rightLine && leftLine !== undefined) {
      rows.push({ kind: "same", text: leftLine });
      continue;
    }

    if (leftLine !== undefined) {
      rows.push({ kind: "remove", text: leftLine });
    }
    if (rightLine !== undefined) {
      rows.push({ kind: "add", text: rightLine });
    }
  }

  return rows;
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, sortJsonKeys(val)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function jsonToCsv(value: unknown, includeHeader: boolean, delimiter: string): string {
  const rows = Array.isArray(value) ? value : [value];
  const safeRows = rows.filter((row) => row && typeof row === "object") as Array<Record<string, unknown>>;

  if (safeRows.length === 0) {
    throw new Error("CSV conversion expects an object or an array of objects.");
  }

  const headers = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))));
  const csvRows: string[] = [];

  if (includeHeader) {
    csvRows.push(headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter));
  }

  for (const row of safeRows) {
    const cells = headers.map((header) => {
      const raw = row[header];
      const valueText =
        raw === null || raw === undefined
          ? ""
          : typeof raw === "object"
            ? JSON.stringify(raw)
            : String(raw);
      return escapeCsvCell(valueText, delimiter);
    });
    csvRows.push(cells.join(delimiter));
  }

  return csvRows.join("\n");
}

function escapeCsvCell(value: string, delimiter: string): string {
  if (value.includes("\n") || value.includes("\"") || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function basicRepairJson(text: string): string {
  return text
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)([A-Za-z0-9_\-]+)(\s*:)/g, '$1"$2"$3');
}

function diffObjects(left: unknown, right: unknown, path = "$", changes: string[] = []) {
  if (Object.is(left, right)) {
    return changes;
  }

  if (typeof left !== typeof right || left === null || right === null) {
    changes.push(`${path}: ${stringifyShort(left)} -> ${stringifyShort(right)}`);
    return changes;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i += 1) {
      diffObjects(left[i], right[i], `${path}[${i}]`, changes);
    }
    return changes;
  }

  if (typeof left === "object" && typeof right === "object") {
    const leftObj = left as Record<string, unknown>;
    const rightObj = right as Record<string, unknown>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);

    for (const key of keys) {
      diffObjects(leftObj[key], rightObj[key], `${path}.${key}`, changes);
    }
    return changes;
  }

  changes.push(`${path}: ${stringifyShort(left)} -> ${stringifyShort(right)}`);
  return changes;
}

function stringifyShort(value: unknown) {
  if (value === undefined) {
    return "undefined";
  }
  return JSON.stringify(value);
}

function ToolTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={active ? "default" : "outline"} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

function JsonDiffView({ rows }: { rows: DiffRow[] }) {
  if (rows.length === 0) {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Run diff to see line-by-line changes.
      </pre>
    );
  }

  return (
    <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5">
      {rows.map((row, index) => (
        <div
          key={`${row.kind}-${index}`}
          className={
            row.kind === "add"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : row.kind === "remove"
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                : "text-foreground"
          }
        >
          <span className="mr-2 inline-block w-3 text-center">
            {row.kind === "add" ? "+" : row.kind === "remove" ? "-" : " "}
          </span>
          {row.text}
        </div>
      ))}
    </pre>
  );
}

function JsonHighlightedPreview({ value }: { value: string }) {
  const tokens = useMemo(() => tokenizeJson(value), [value]);

  return (
    <pre className="max-h-72 overflow-auto rounded bg-background p-3 text-xs leading-5">
      {tokens.map((token, index) => (
        <span key={`${token.type}-${index}`} className={tokenClass(token.type)}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}

function tokenClass(type: JsonToken["type"]) {
  if (type === "key") return "text-blue-600 dark:text-blue-300";
  if (type === "string") return "text-emerald-600 dark:text-emerald-300";
  if (type === "number") return "text-amber-600 dark:text-amber-300";
  if (type === "boolean") return "text-violet-600 dark:text-violet-300";
  if (type === "null") return "text-rose-600 dark:text-rose-300";
  if (type === "punctuation") return "text-muted-foreground";
  return "text-foreground";
}

type JsonToken = {
  text: string;
  type: "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "plain";
};

function tokenizeJson(value: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const pattern =
    /(\"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\\"])*\"\s*:?)|(\b-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],:])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: value.slice(lastIndex, match.index), type: "plain" });
    }

    const text = match[0];
    const isKey = /^".*":$/.test(text.trim());

    if (match[1]) tokens.push({ text, type: isKey ? "key" : "string" });
    else if (match[2]) tokens.push({ text, type: "number" });
    else if (match[3]) tokens.push({ text, type: "boolean" });
    else if (match[4]) tokens.push({ text, type: "null" });
    else if (match[5]) tokens.push({ text, type: "punctuation" });

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push({ text: value.slice(lastIndex), type: "plain" });
  }

  return tokens;
}

function getSampleForMode(mode: ToolMode) {
  const baseObject = `{
  "name": "Utility Hub",
  "version": "1.0.1",
  "features": ["json", "csv", "yaml"],
  "active": true
}`;

  if (mode === "diff") {
    return {
      input: `{
  "name": "Utility Hub",
  "version": 1,
  "active": true
}`,
      secondaryInput: `{
  "name": "Utility Hub",
  "version": 2,
  "active": false
}`,
    };
  }

  if (mode === "repair") {
    return {
      input: `{
  name: 'Utility Hub',
  version: '1.0.1',
  trailing: true,
}`,
      secondaryInput: "",
    };
  }

  if (mode === "csv") {
    return {
      input: `[
  { "name": "Alice", "age": 28, "city": "Addis Ababa" },
  { "name": "Bob", "age": 31, "city": "Nairobi" }
]`,
      secondaryInput: "",
    };
  }

  return {
    input: baseObject,
    secondaryInput: "",
  };
}

function getLineAndColumn(text: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, text.length));
  const upToIndex = text.slice(0, safeIndex);
  const lines = upToIndex.split(/\r\n|\n|\r/);

  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}
