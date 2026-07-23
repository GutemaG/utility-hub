import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownAZ,
  ArrowLeftRight,
  CheckCircle2,
  Database,
  Download,
  FileCode,
  FileCode2,
  FileSpreadsheet,
  GitCompare,
  ListTree,
  SearchCode,
  ShieldCheck,
  Shrink,
  Table2,
  Upload,
  Wrench,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Ajv from "ajv";
import { JSONPath } from "jsonpath-plus";
import { XMLParser } from "fast-xml-parser";
import XMLBuilder from "fast-xml-builder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { parse as parseYamlText, stringify as toYaml } from "yaml";

export const Route = createFileRoute("/json-validator")({
  component: RouteComponent,
});

type ToolMode =
  | "validate"
  | "repair"
  | "minify"
  | "sort"
  | "diff"
  | "csv"
  | "yaml"
  | "tree"
  | "jsonpath"
  | "schema"
  | "xml"
  | "sql"
  | "excel";

type ConvertDirection = "encode" | "decode";

const CONVERT_MODES: ToolMode[] = ["csv", "yaml", "xml", "sql", "excel"];

const CONVERT_FORMAT_LABEL: Partial<Record<ToolMode, string>> = {
  csv: "CSV",
  yaml: "YAML",
  xml: "XML",
  sql: "SQL",
  excel: "Excel",
};

type CsvDelimiterOption = "," | ";" | "\t" | "|";

const DELIMITER_OPTIONS: Array<{ label: string; value: CsvDelimiterOption }> = [
  { label: "Comma (,)", value: "," },
  { label: "Semicolon (;)", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe (|)", value: "|" },
];

const MODE_META: Record<ToolMode, { label: string; help: string; icon: LucideIcon }> = {
  validate: {
    label: "Validate",
    help: "Checks JSON syntax and shows precise parse feedback.",
    icon: CheckCircle2,
  },
  repair: {
    label: "Repair",
    help: "Applies safe auto-fixes like trailing comma removal and key quoting.",
    icon: Wrench,
  },
  minify: {
    label: "Minify",
    help: "Compresses JSON into a single compact line.",
    icon: Shrink,
  },
  sort: {
    label: "Sort Keys",
    help: "Recursively sorts object keys alphabetically.",
    icon: ArrowDownAZ,
  },
  diff: {
    label: "Diff",
    help: "Compares two JSON values and lists path-level differences.",
    icon: GitCompare,
  },
  csv: {
    label: "CSV",
    help: "Convert JSON to CSV, or parse CSV back into JSON.",
    icon: Table2,
  },
  yaml: {
    label: "YAML",
    help: "Convert JSON to YAML, or parse YAML back into JSON.",
    icon: FileCode,
  },
  tree: {
    label: "Tree View",
    help: "Explore JSON as a collapsible, color-coded tree.",
    icon: ListTree,
  },
  jsonpath: {
    label: "JSONPath",
    help: "Query JSON with a JSONPath expression and inspect the matches.",
    icon: SearchCode,
  },
  schema: {
    label: "Schema",
    help: "Validate JSON against a JSON Schema (draft-07).",
    icon: ShieldCheck,
  },
  xml: {
    label: "XML",
    help: "Convert JSON to XML, or parse XML back into JSON.",
    icon: FileCode2,
  },
  sql: {
    label: "SQL",
    help: "Generate INSERT statements from JSON, or parse them back into JSON.",
    icon: Database,
  },
  excel: {
    label: "Excel",
    help: "Export JSON as an .xlsx file, or upload a spreadsheet to get JSON.",
    icon: FileSpreadsheet,
  },
};

const MODE_GROUPS: { label: string; modes: ToolMode[] }[] = [
  { label: "Inspect", modes: ["validate", "tree", "jsonpath", "schema"] },
  { label: "Transform", modes: ["repair", "minify", "sort"] },
  { label: "Compare", modes: ["diff"] },
  { label: "Convert", modes: ["csv", "yaml", "xml", "sql", "excel"] },
];

type InputKind = "json" | "csv" | "yaml" | "xml" | "sql" | "file";

function getInputKind(mode: ToolMode, direction: ConvertDirection): InputKind {
  if (direction === "decode") {
    if (mode === "csv") return "csv";
    if (mode === "yaml") return "yaml";
    if (mode === "xml") return "xml";
    if (mode === "sql") return "sql";
    if (mode === "excel") return "file";
  }
  return "json";
}

function RouteComponent() {
  const [input, setInput] = useState(`{\n  "name": "Utility Hub",\n  "version": "1.0.1"\n}`);
  const [secondaryInput, setSecondaryInput] = useState("{}");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [mode, setMode] = useState<ToolMode>("validate");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [delimiter, setDelimiter] = useState<CsvDelimiterOption>(",");
  const [jsonPathExpression, setJsonPathExpression] = useState("$..*");
  const [direction, setDirection] = useState<ConvertDirection>("encode");
  const [sqlTableName, setSqlTableName] = useState("my_table");
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelFileError, setExcelFileError] = useState<string | null>(null);
  const activeModeMeta = MODE_META[mode];
  const isConvertMode = CONVERT_MODES.includes(mode);

  useEffect(() => {
    setDirection("encode");
    setExcelFileName(null);
    setExcelFileError(null);
  }, [mode]);

  const inputKind = getInputKind(mode, direction);
  const prevInputKindRef = useRef(inputKind);
  useEffect(() => {
    if (prevInputKindRef.current !== inputKind) {
      setInput("");
      setSecondaryInput("");
      prevInputKindRef.current = inputKind;
    }
  }, [inputKind]);

  useSEO({
    title: "JSON Validator & Converter | Utility Hub",
    description:
      "Validate, repair, minify, sort, diff, tree-view, JSONPath query, and schema-validate JSON, plus convert to/from CSV, YAML, XML, SQL, or Excel — both ways.",
    path: "/json-validator",
    keywords:
      "json validator, json formatter, json minify, json sort keys, json diff, json tree viewer, jsonpath tester, json schema validator, json to csv, csv to json, json to yaml, yaml to json, json to xml, xml to json, json to sql, sql to json, json to excel, excel to json",
    applicationCategory: "DeveloperApplication",
    featureList: [
      "JSON validation",
      "Basic JSON repair",
      "JSON minify",
      "Sort object keys",
      "JSON diff",
      "Collapsible JSON tree view",
      "JSONPath query tester",
      "JSON Schema validation",
      "JSON to/from CSV",
      "JSON to/from YAML",
      "JSON to/from XML",
      "JSON to/from SQL INSERT statements",
      "JSON to/from Excel (.xlsx)",
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
        jsonPathExpression,
        direction,
        sqlTableName,
      }),
    [mode, input, secondaryInput, includeHeader, delimiter, jsonPathExpression, direction, sqlTableName]
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
    const sample = getSampleForMode(mode, direction);
    setInput(sample.input);
    setSecondaryInput(sample.secondaryInput);
    if (mode === "jsonpath") {
      setJsonPathExpression(sample.path ?? "$..*");
    }
    if (mode === "sql") {
      setSqlTableName(sample.table ?? "my_table");
    }
    setExcelFileName(null);
    setExcelFileError(null);
    setCopied(null);
  };

  const handleExcelFile = async (file: File) => {
    setExcelFileError(null);
    setExcelFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setInput(JSON.stringify(json, null, 2));
    } catch (err) {
      setExcelFileError(err instanceof Error ? err.message : "Could not read the file.");
    }
  };

  const handleDownloadExcel = async () => {
    if (!result.excelRows || result.excelRows.length === 0) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(result.excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "data.xlsx");
  };

  const inputLineCount = useMemo(() => input.split(/\r\n|\n|\r/).length, [input]);
  const outputLineCount = useMemo(
    () => (result.output ? result.output.split(/\r\n|\n|\r/).length : 0),
    [result.output]
  );

  const ActiveIcon = activeModeMeta.icon;
  const formatLabel = CONVERT_FORMAT_LABEL[mode];

  const inputLabel =
    mode === "diff"
      ? "Left JSON"
      : mode === "schema"
        ? "JSON"
        : mode === "excel" && direction === "decode"
          ? "Excel File"
          : (mode === "xml" || mode === "sql" || mode === "csv" || mode === "yaml") && direction === "decode"
            ? `Input ${formatLabel}`
            : "Input JSON";

  const inputPlaceholder =
    mode === "diff"
      ? "Paste first JSON value..."
      : mode === "xml" && direction === "decode"
        ? "Paste XML here..."
        : mode === "sql" && direction === "decode"
          ? "Paste INSERT statements here..."
          : mode === "csv" && direction === "decode"
            ? "Paste CSV here..."
            : mode === "yaml" && direction === "decode"
              ? "Paste YAML here..."
              : "Paste JSON here...";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">JSON Toolbox</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Inspect, transform, compare, and convert JSON — to CSV, YAML, XML, SQL, and Excel — in one place.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-gradient-to-r from-muted/50 to-muted/10 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{activeModeMeta.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{activeModeMeta.help}</p>
          </div>
        </div>

        <div className="mb-5 space-y-3">
          {MODE_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
              {group.modes.map((m) => (
                <ToolTab
                  key={m}
                  label={MODE_META[m].label}
                  icon={MODE_META[m].icon}
                  active={mode === m}
                  onClick={() => setMode(m)}
                />
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="w-20 shrink-0" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={loadSample}
              disabled={mode === "excel" && direction === "decode"}
            >
              Load Sample
            </Button>
          </div>
        </div>

        {isConvertMode && formatLabel ? (
          <div className="mb-5 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setDirection("encode")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  direction === "encode"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                JSON <ArrowLeftRight className="h-3 w-3" /> {formatLabel}
              </button>
              <button
                type="button"
                onClick={() => setDirection("decode")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  direction === "decode"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {formatLabel} <ArrowLeftRight className="h-3 w-3" /> JSON
              </button>
            </div>
          </div>
        ) : null}

        {mode === "jsonpath" ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <label htmlFor="jsonpath-expression" className="font-medium text-foreground">
              Path
            </label>
            <input
              id="jsonpath-expression"
              type="text"
              value={jsonPathExpression}
              onChange={(e) => setJsonPathExpression(e.target.value)}
              className="min-w-56 flex-1 rounded border border-input bg-background px-2 py-1 font-mono text-sm"
              placeholder="$.store.book[*].title"
              spellCheck={false}
              aria-label="JSONPath expression"
            />
          </div>
        ) : null}

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

        {mode === "sql" && direction === "encode" ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <label htmlFor="sql-table-name" className="font-medium text-foreground">
              Table name
            </label>
            <input
              id="sql-table-name"
              type="text"
              value={sqlTableName}
              onChange={(e) => setSqlTableName(e.target.value)}
              className="min-w-40 rounded border border-input bg-background px-2 py-1 font-mono text-sm"
              placeholder="my_table"
              spellCheck={false}
              aria-label="SQL table name"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{inputLabel}</label>
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

            {mode === "excel" && direction === "decode" ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    Choose a spreadsheet file
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">.xlsx, .xls, or .csv</p>
                </div>
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleExcelFile(file);
                    e.target.value = "";
                  }}
                />
                {excelFileName ? (
                  <p className="text-xs text-foreground">
                    Loaded <span className="font-medium">{excelFileName}</span>
                  </p>
                ) : null}
                {excelFileError ? (
                  <p className="text-xs text-rose-600 dark:text-rose-300">{excelFileError}</p>
                ) : null}
              </div>
            ) : (
              <>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="field-sizing-fixed h-64 max-h-[32rem] resize-y overflow-y-auto font-mono text-sm"
                  placeholder={inputPlaceholder}
                  spellCheck={false}
                  aria-label="Primary JSON input"
                />
                <p className="text-xs text-muted-foreground">{inputLineCount} line(s)</p>
              </>
            )}

            {mode === "diff" || mode === "schema" ? (
              <>
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-foreground">
                    {mode === "schema" ? "JSON Schema" : "Right JSON"}
                  </label>
                </div>
                <Textarea
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="field-sizing-fixed h-64 max-h-[32rem] resize-y overflow-y-auto font-mono text-sm"
                  placeholder={mode === "schema" ? "Paste JSON Schema here..." : "Paste second JSON for diff..."}
                  spellCheck={false}
                  aria-label={mode === "schema" ? "JSON Schema input" : "Secondary JSON input for diff"}
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
            {mode === "validate" ||
            mode === "repair" ||
            mode === "sort" ||
            mode === "minify" ||
            ((mode === "xml" || mode === "sql" || mode === "excel" || mode === "csv" || mode === "yaml") &&
              direction === "decode") ? (
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
            ) : mode === "tree" ? (
              <JsonTreeContainer value={result.treeValue} status={result.status} />
            ) : mode === "jsonpath" ? (
              <JsonPathResultsView matches={result.pathMatches ?? []} status={result.status} />
            ) : mode === "schema" ? (
              <SchemaResultsView status={result.status} issues={result.schemaIssues ?? []} />
            ) : mode === "excel" && direction === "encode" ? (
              <ExcelDownloadPanel rows={result.excelRows ?? []} onDownload={handleDownloadExcel} />
            ) : (
              <Textarea
                value={result.output}
                readOnly
                className="field-sizing-fixed h-64 max-h-[32rem] resize-y overflow-y-auto font-mono text-sm"
                placeholder="Result appears here"
                spellCheck={false}
                aria-label="Tool output"
              />
            )}
            <p className="text-xs text-muted-foreground">{outputLineCount} line(s)</p>
          </div>
        </div>

        {result.status === "success" ? (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {result.message}
          </div>
        ) : null}

        {result.status === "error" ? (
          <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
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

type PathMatch = { path: string; value: unknown };
type SchemaIssue = { path: string; message: string };

type ToolResult = {
  status: "empty" | "success" | "error";
  output: string;
  message: string;
  location: { line: number; column: number } | null;
  diffRows: DiffRow[];
  treeValue?: unknown;
  pathMatches?: PathMatch[];
  schemaIssues?: SchemaIssue[];
  excelRows?: Array<Record<string, unknown>>;
};

const ajv = new Ajv({ allErrors: true, strict: false });

function runJsonTool({
  mode,
  input,
  secondaryInput,
  includeHeader,
  delimiter,
  jsonPathExpression,
  direction,
  sqlTableName,
}: {
  mode: ToolMode;
  input: string;
  secondaryInput: string;
  includeHeader: boolean;
  delimiter: string;
  jsonPathExpression: string;
  direction: ConvertDirection;
  sqlTableName: string;
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
    if (mode === "xml" && direction === "decode") {
      let value: unknown;
      try {
        value = xmlToJson(input);
      } catch (xmlError) {
        throw new Error(xmlError instanceof Error ? `Invalid XML: ${xmlError.message}` : "Invalid XML");
      }
      return {
        status: "success",
        output: JSON.stringify(value, null, 2),
        message: "XML converted to JSON.",
        location: null,
        diffRows: [],
      };
    }

    if (mode === "sql" && direction === "decode") {
      let rows: Array<Record<string, unknown>>;
      try {
        rows = sqlToJson(input);
      } catch (sqlError) {
        throw new Error(sqlError instanceof Error ? sqlError.message : "Could not parse SQL.");
      }
      return {
        status: "success",
        output: JSON.stringify(rows, null, 2),
        message: `Parsed ${rows.length} row(s) from SQL.`,
        location: null,
        diffRows: [],
      };
    }

    if (mode === "csv" && direction === "decode") {
      let rows: Array<Record<string, unknown>> | unknown[][];
      try {
        rows = csvToJson(input, delimiter, includeHeader);
      } catch (csvError) {
        throw new Error(csvError instanceof Error ? csvError.message : "Could not parse CSV.");
      }
      return {
        status: "success",
        output: JSON.stringify(rows, null, 2),
        message: `Parsed ${rows.length} row(s) from CSV.`,
        location: null,
        diffRows: [],
      };
    }

    if (mode === "yaml" && direction === "decode") {
      let value: unknown;
      try {
        value = parseYamlText(input);
      } catch (yamlError) {
        throw new Error(yamlError instanceof Error ? `Invalid YAML: ${yamlError.message}` : "Invalid YAML");
      }
      return {
        status: "success",
        output: JSON.stringify(value, null, 2),
        message: "YAML converted to JSON.",
        location: null,
        diffRows: [],
      };
    }

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

    if (mode === "xml") {
      return {
        status: "success",
        output: jsonToXml(parsed),
        message: "JSON converted to XML.",
        location: null,
        diffRows: [],
      };
    }

    if (mode === "sql") {
      const rows = toTableRows(parsed);
      return {
        status: "success",
        output: jsonToSql(rows, sqlTableName.trim() || "my_table"),
        message: `Generated ${rows.length} INSERT statement(s).`,
        location: null,
        diffRows: [],
      };
    }

    if (mode === "excel") {
      if (direction === "decode") {
        return {
          status: "success",
          output: JSON.stringify(parsed, null, 2),
          message: "Excel file converted to JSON.",
          location: null,
          diffRows: [],
        };
      }

      const rows = toTableRows(parsed);
      return {
        status: "success",
        output: "",
        message: `Ready to export ${rows.length} row(s).`,
        location: null,
        diffRows: [],
        excelRows: rows,
      };
    }

    if (mode === "tree") {
      return {
        status: "success",
        output: JSON.stringify(parsed, null, 2),
        message: "JSON parsed. Explore the tree below.",
        location: null,
        diffRows: [],
        treeValue: parsed,
      };
    }

    if (mode === "jsonpath") {
      let matches: PathMatch[];
      try {
        const rawResults = JSONPath({ path: jsonPathExpression, json: parsed, resultType: "all" }) as Array<{
          path: string;
          value: unknown;
        }>;
        matches = rawResults.map((r) => ({ path: r.path, value: r.value }));
      } catch (pathError) {
        const reason = pathError instanceof Error ? pathError.message : "could not evaluate expression";
        throw new Error(`Invalid JSONPath expression: ${reason}`);
      }

      return {
        status: "success",
        output: JSON.stringify(matches.map((m) => m.value), null, 2),
        message: matches.length > 0 ? `Found ${matches.length} match(es).` : "No matches for this path.",
        location: null,
        diffRows: [],
        pathMatches: matches,
      };
    }

    if (mode === "schema") {
      let schemaObj: unknown;
      try {
        schemaObj = JSON.parse(secondaryInput);
      } catch (schemaParseError) {
        const raw = schemaParseError instanceof Error ? schemaParseError.message : "could not parse";
        const positionMatch = raw.match(/position\s+(\d+)/i);
        const detail = positionMatch
          ? (() => {
              const loc = getLineAndColumn(secondaryInput, Number(positionMatch[1]));
              return `line ${loc.line}, column ${loc.column}`;
            })()
          : raw;
        throw new Error(`Invalid JSON Schema (${detail}).`);
      }

      let validateFn;
      try {
        validateFn = ajv.compile(schemaObj as object);
      } catch (compileError) {
        const reason = compileError instanceof Error ? compileError.message : "could not compile";
        throw new Error(`Invalid JSON Schema: ${reason}`);
      }

      const valid = validateFn(parsed);

      if (valid) {
        return {
          status: "success",
          output: "No issues found. The JSON matches the schema.",
          message: "Valid — the JSON matches the schema.",
          location: null,
          diffRows: [],
          schemaIssues: [],
        };
      }

      const issues: SchemaIssue[] = (validateFn.errors ?? []).map((e) => ({
        path: e.instancePath || "$ (root)",
        message: e.message ?? "is invalid",
      }));

      return {
        status: "error",
        output: issues.map((i) => `${i.path}: ${i.message}`).join("\n"),
        message: `Schema validation failed with ${issues.length} issue(s).`,
        location: null,
        diffRows: [],
        schemaIssues: issues,
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

function toTableRows(value: unknown): Array<Record<string, unknown>> {
  const rows = Array.isArray(value) ? value : [value];
  const safeRows = rows.filter((row) => row && typeof row === "object") as Array<Record<string, unknown>>;

  if (safeRows.length === 0) {
    throw new Error("Expected an object or an array of objects.");
  }

  return safeRows;
}

function jsonToCsv(value: unknown, includeHeader: boolean, delimiter: string): string {
  const safeRows = toTableRows(value);
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

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += ch;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function coerceCsvValue(raw: string): unknown {
  if (raw === "") return "";
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (/^true$/i.test(raw)) return true;
  if (/^false$/i.test(raw)) return false;
  return raw;
}

function csvToJson(
  text: string,
  delimiter: string,
  hasHeader: boolean
): Array<Record<string, unknown>> | unknown[][] {
  const rows = parseCsvRows(text, delimiter);
  if (rows.length === 0) {
    throw new Error("No CSV rows found.");
  }

  if (!hasHeader) {
    return rows.map((row) => row.map(coerceCsvValue));
  }

  const [header, ...dataRows] = rows;
  return dataRows.map((row) => {
    const obj: Record<string, unknown> = {};
    header.forEach((key, i) => {
      obj[key] = coerceCsvValue(row[i] ?? "");
    });
    return obj;
  });
}

function jsonToXml(value: unknown): string {
  const builder = new XMLBuilder({ format: true, indentBy: "  ", ignoreAttributes: false });
  const wrapped = { root: Array.isArray(value) ? { item: value } : value };
  return builder.build(wrapped);
}

function xmlToJson(xml: string): unknown {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml) as Record<string, unknown>;

  if (parsed && typeof parsed === "object" && Object.keys(parsed).length === 1 && "root" in parsed) {
    const root = parsed.root;
    if (root && typeof root === "object" && !Array.isArray(root)) {
      const rootObj = root as Record<string, unknown>;
      if (Object.keys(rootObj).length === 1 && "item" in rootObj) {
        return rootObj.item;
      }
    }
    return root;
  }

  return parsed;
}

function quoteSqlIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonToSql(rows: Array<Record<string, unknown>>, tableName: string): string {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const statements = rows.map((row) => {
    const values = columns.map((col) => sqlLiteral(row[col]));
    return `INSERT INTO ${quoteSqlIdentifier(tableName)} (${columns.map(quoteSqlIdentifier).join(", ")}) VALUES (${values.join(", ")});`;
  });
  return statements.join("\n");
}

function splitTopLevel(text: string, boundary: "(" | ","): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      current += ch;
      if (ch === quoteChar) {
        if (text[i + 1] === quoteChar) {
          current += text[++i];
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      quoteChar = ch;
      current += ch;
      continue;
    }

    if (boundary === "(") {
      if (ch === "(") {
        depth += 1;
        if (depth === 1) {
          current = "";
          continue;
        }
      }
      if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          parts.push(current);
          continue;
        }
      }
      if (depth === 0) continue;
      current += ch;
      continue;
    }

    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (boundary === "," && current.trim() !== "") {
    parts.push(current.trim());
  }

  return parts;
}

function parseSqlLiteral(raw: string): unknown {
  const trimmed = raw.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2)
  ) {
    const quote = trimmed[0];
    const inner = trimmed.slice(1, -1).replace(new RegExp(quote + quote, "g"), quote);
    return inner;
  }

  return trimmed;
}

function sqlToJson(sql: string): Array<Record<string, unknown>> {
  const insertRegex = /INSERT\s+INTO\s+[`"[]?([\w.]+)[`"\]]?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;
  const rows: Array<Record<string, unknown>> = [];
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = insertRegex.exec(sql)) !== null) {
    found = true;
    const columns = match[2].split(",").map((c) => c.trim().replace(/^[`"[]|[`"\]]$/g, ""));
    const tuples = splitTopLevel(match[3], "(");

    for (const tuple of tuples) {
      const values = splitTopLevel(tuple, ",");
      const row: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        row[col] = parseSqlLiteral(values[i] ?? "NULL");
      });
      rows.push(row);
    }
  }

  if (!found) {
    throw new Error("No INSERT INTO ... VALUES (...) statement found.");
  }

  return rows;
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
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={active ? "default" : "outline"} size="sm" onClick={onClick} className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function ExcelDownloadPanel({
  rows,
  onDownload,
}: {
  rows: Array<Record<string, unknown>>;
  onDownload: () => void;
}) {
  if (rows.length === 0) {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Result appears here
      </pre>
    );
  }

  const columnCount = new Set(rows.flatMap((row) => Object.keys(row))).size;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted/30 p-6 text-center">
      <FileSpreadsheet className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
      <p className="text-sm text-foreground">
        {rows.length} row{rows.length === 1 ? "" : "s"} × {columnCount} column{columnCount === 1 ? "" : "s"} ready
      </p>
      <Button type="button" size="sm" onClick={onDownload} className="gap-1.5">
        <Download className="h-4 w-4" />
        Download .xlsx
      </Button>
    </div>
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

function JsonTreeContainer({ value, status }: { value: unknown; status: ToolResult["status"] }) {
  if (status !== "success") {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        {status === "error" ? "Fix the error above to see the tree." : "Tree view appears here"}
      </pre>
    );
  }

  return (
    <div className="max-h-72 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs leading-6">
      <JsonTreeNode label={null} value={value} depth={0} />
    </div>
  );
}

function JsonTreeNode({ label, value, depth }: { label: string | number | null; value: unknown; depth: number }) {
  const isContainer = value !== null && typeof value === "object";
  const [open, setOpen] = useState(depth < 2);

  const keyLabel = label !== null ? (
    <span className="text-blue-600 dark:text-blue-300">{typeof label === "number" ? `[${label}]` : `"${label}"`}: </span>
  ) : null;

  if (!isContainer) {
    return (
      <div style={{ paddingLeft: depth * 14 }}>
        {keyLabel}
        <JsonScalarValue value={value} />
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i): [number, unknown] => [i, v])
    : Object.entries(value as Record<string, unknown>);
  const isEmpty = entries.length === 0;

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isEmpty}
        className="inline-flex items-center gap-1 text-left hover:text-foreground disabled:cursor-default"
      >
        {!isEmpty ? (
          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        ) : (
          <span className="inline-block w-3" />
        )}
        {keyLabel}
        <span className="text-muted-foreground">
          {isEmpty
            ? isArray
              ? "[]"
              : "{}"
            : open
              ? isArray
                ? "["
                : "{"
              : `${isArray ? "[" : "{"}…${entries.length}${isArray ? "]" : "}"}`}
        </span>
      </button>
      {open && !isEmpty ? (
        <div>
          {entries.map(([key, val]) => (
            <JsonTreeNode key={key} label={key} value={val} depth={depth + 1} />
          ))}
          <div className="text-muted-foreground" style={{ paddingLeft: (depth + 1) * 14 }}>
            {isArray ? "]" : "}"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JsonScalarValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return <span className="text-emerald-600 dark:text-emerald-300">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="text-amber-600 dark:text-amber-300">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-violet-600 dark:text-violet-300">{String(value)}</span>;
  }
  return <span className="text-rose-600 dark:text-rose-300">null</span>;
}

function JsonPathResultsView({ matches, status }: { matches: PathMatch[]; status: ToolResult["status"] }) {
  if (status === "empty") {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Matches appear here
      </pre>
    );
  }

  if (status === "error") {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Fix the error above to see matches.
      </pre>
    );
  }

  if (matches.length === 0) {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        No matches for this path.
      </pre>
    );
  }

  return (
    <div className="max-h-72 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs leading-6">
      {matches.map((m, i) => (
        <div key={`${m.path}-${i}`} className="border-b border-border/50 py-1.5 last:border-b-0">
          <p className="text-blue-600 dark:text-blue-300">{m.path}</p>
          <p className="mt-0.5 whitespace-pre-wrap break-all text-foreground">{JSON.stringify(m.value)}</p>
        </div>
      ))}
    </div>
  );
}

function SchemaResultsView({ status, issues }: { status: ToolResult["status"]; issues: SchemaIssue[] }) {
  if (status === "empty") {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Validation result appears here
      </pre>
    );
  }

  if (status === "success") {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-emerald-600 dark:text-emerald-300">
        No issues found. The JSON matches the schema.
      </pre>
    );
  }

  if (issues.length === 0) {
    return (
      <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
        Fix the error above to run validation.
      </pre>
    );
  }

  return (
    <div className="max-h-72 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs leading-6">
      {issues.map((issue, i) => (
        <div key={`${issue.path}-${i}`} className="border-b border-rose-500/20 py-1.5 last:border-b-0">
          <p className="text-rose-600 dark:text-rose-300">{issue.path}</p>
          <p className="mt-0.5 text-foreground">{issue.message}</p>
        </div>
      ))}
    </div>
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

function getSampleForMode(mode: ToolMode, direction: ConvertDirection) {
  const baseObject = `{
  "name": "Utility Hub",
  "version": "1.0.1",
  "features": ["json", "csv", "yaml"],
  "active": true
}`;

  const tableRows = `[
  { "id": 1, "name": "Alice", "city": "Addis Ababa" },
  { "id": 2, "name": "Bob", "city": "Nairobi" }
]`;

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
    return direction === "decode"
      ? {
          input: `name,age,city\nAlice,28,Addis Ababa\nBob,31,Nairobi`,
          secondaryInput: "",
        }
      : {
          input: `[
  { "name": "Alice", "age": 28, "city": "Addis Ababa" },
  { "name": "Bob", "age": 31, "city": "Nairobi" }
]`,
          secondaryInput: "",
        };
  }

  if (mode === "yaml") {
    return direction === "decode"
      ? {
          input: `name: Utility Hub\nversion: 1.0.1\nfeatures:\n  - json\n  - csv\n  - yaml\nactive: true`,
          secondaryInput: "",
        }
      : { input: baseObject, secondaryInput: "" };
  }

  if (mode === "jsonpath") {
    return {
      input: `{
  "store": {
    "book": [
      { "title": "Book A", "price": 12 },
      { "title": "Book B", "price": 8 }
    ]
  }
}`,
      secondaryInput: "",
      path: "$.store.book[*].title",
    };
  }

  if (mode === "schema") {
    return {
      input: `{
  "name": "Utility Hub",
  "version": "1.0.1"
}`,
      secondaryInput: `{
  "type": "object",
  "required": ["name", "version"],
  "properties": {
    "name": { "type": "string" },
    "version": { "type": "string" }
  }
}`,
    };
  }

  if (mode === "xml") {
    return direction === "decode"
      ? {
          input: `<root>
  <name>Utility Hub</name>
  <version>1.0.1</version>
  <active>true</active>
</root>`,
          secondaryInput: "",
        }
      : { input: baseObject, secondaryInput: "" };
  }

  if (mode === "sql") {
    return direction === "decode"
      ? {
          input: `INSERT INTO "users" ("id", "name", "city") VALUES (1, 'Alice', 'Addis Ababa'), (2, 'Bob', 'Nairobi');`,
          secondaryInput: "",
        }
      : { input: tableRows, secondaryInput: "", table: "users" };
  }

  if (mode === "excel") {
    return { input: tableRows, secondaryInput: "" };
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
