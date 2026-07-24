export type DelimiterMode = "auto" | "newline" | "comma" | "tab" | "whitespace";

export interface NumberGridResult {
  /**
   * Ragged grid of parsed numbers. A cell is `undefined` when it was empty or unparseable in the
   * original input — its column position is preserved so column sums stay aligned even when a
   * row has gaps (e.g. a sparse spreadsheet selection pasted as tab-separated values).
   */
  grid: (number | undefined)[][];
  /** All valid numbers in reading order, flattened. */
  values: number[];
  /** Non-empty tokens that could not be parsed as a number (surfaced so the user can fix a typo). */
  invalidTokens: string[];
  /** Count of values that parsed fine but were dropped because they matched an excluded value. */
  excludedCount: number;
  /** Delimiter actually used to split each line (resolved when mode is "auto"). */
  delimiterUsed: Exclude<DelimiterMode, "auto">;
  columnCount: number;
  rowCount: number;
  sum: number;
  count: number;
  average: number;
  min: number | null;
  max: number | null;
  /** Sum of each column, only meaningful when columnCount > 1. */
  columnSums: number[];
  /** Sum of each row, only meaningful when columnCount > 1. */
  rowSums: number[];
}

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;

function parseToken(token: string, stripThousandsCommas: boolean): number | null {
  let s = token.trim();
  if (s === "") return null;

  // Accounting-style negatives, e.g. "(123.45)" -> "-123.45".
  if (/^\(.+\)$/.test(s)) {
    s = `-${s.slice(1, -1)}`;
  }

  if (stripThousandsCommas) {
    s = s.replace(/,/g, "");
  }

  if (!NUMBER_PATTERN.test(s)) return null;
  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

function detectDelimiter(nonEmptyLines: string[]): Exclude<DelimiterMode, "auto"> {
  if (nonEmptyLines.some((l) => l.includes("\t"))) return "tab";

  const commaLines = nonEmptyLines.filter((l) => l.includes(","));
  const looksLikeCsv = commaLines.some((l) => {
    const parts = l.split(",").map((p) => p.trim()).filter((p) => p !== "");
    if (parts.length < 2) return false;
    const numericParts = parts.filter((p) => NUMBER_PATTERN.test(p.replace(/^\((.+)\)$/, "-$1")));
    return numericParts.length >= 2;
  });
  if (looksLikeCsv) return "comma";

  const hasMultiWhitespaceColumns = nonEmptyLines.some((l) => l.trim().split(/\s+/).length >= 2);
  if (hasMultiWhitespaceColumns) return "whitespace";

  return "newline";
}

function splitLine(line: string, mode: Exclude<DelimiterMode, "auto">): string[] {
  switch (mode) {
    case "newline":
      return [line];
    case "comma":
      return line.split(",");
    case "tab":
      return line.split("\t");
    case "whitespace":
      return line.trim().split(/\s+/);
  }
}

const EXCLUDE_EPSILON = 1e-9;

/** Parses a comma-separated "exclude" field (e.g. "0, -1, 100") into numbers, ignoring blanks/typos. */
export function parseExcludeList(text: string): number[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "")
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n));
}

export function parseNumberGrid(
  input: string,
  mode: DelimiterMode,
  excludeValues: number[] = []
): NumberGridResult {
  const rawLines = input.split(/\r\n|\r|\n/);
  const nonEmptyLines = rawLines.filter((l) => l.trim() !== "");

  const delimiterUsed = mode === "auto" ? detectDelimiter(nonEmptyLines) : mode;
  const stripThousandsCommas = delimiterUsed !== "comma";
  const isExcluded = (n: number) => excludeValues.some((ev) => Math.abs(n - ev) < EXCLUDE_EPSILON);

  const grid: (number | undefined)[][] = [];
  const invalidTokens: string[] = [];
  let excludedCount = 0;

  for (const line of rawLines) {
    if (line.trim() === "") continue;

    const row: (number | undefined)[] = [];
    let hasValue = false;
    for (const cellRaw of splitLine(line, delimiterUsed)) {
      const cell = cellRaw.trim();
      if (cell === "") {
        row.push(undefined);
        continue;
      }

      const parsed = parseToken(cell, stripThousandsCommas);
      if (parsed === null) {
        invalidTokens.push(cell);
        row.push(undefined);
      } else if (isExcluded(parsed)) {
        excludedCount += 1;
        row.push(undefined);
      } else {
        row.push(parsed);
        hasValue = true;
      }
    }

    if (hasValue) grid.push(row);
  }

  const values = grid.flatMap((row) => row.filter((v): v is number => v !== undefined));
  const columnCount = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const rowCount = grid.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  const average = count > 0 ? sum / count : 0;
  const min = count > 0 ? Math.min(...values) : null;
  const max = count > 0 ? Math.max(...values) : null;

  const columnSums = Array.from({ length: columnCount }, (_, c) =>
    grid.reduce((total, row) => total + (row[c] ?? 0), 0)
  );
  const rowSums = grid.map((row) => row.reduce((total: number, v) => total + (v ?? 0), 0));

  return {
    grid,
    values,
    invalidTokens,
    excludedCount,
    delimiterUsed,
    columnCount,
    rowCount,
    sum,
    count,
    average,
    min,
    max,
    columnSums,
    rowSums,
  };
}

export function formatResultNumber(value: number): string {
  if (Object.is(value, -0)) value = 0;
  const rounded = Math.round(value * 1e6) / 1e6;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/** Plain (non-locale) number-to-string, safe to write back into the textarea without re-parsing ambiguity. */
function numberToPlainString(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}

/**
 * Strips any cell/line whose parsed value matches `valuesToRemove` (e.g. stray zeros) directly out
 * of the raw input text, the same way "remove blank lines" edits the textarea in place. A matched
 * cell is blanked rather than spliced out, so column alignment in a tab/comma grid is preserved;
 * a line that ends up with no values left is dropped entirely.
 */
export function removeValuesFromInput(
  input: string,
  delimiterUsed: Exclude<DelimiterMode, "auto">,
  valuesToRemove: number[]
): string {
  if (valuesToRemove.length === 0) return input;

  const stripThousandsCommas = delimiterUsed !== "comma";
  const matchesTarget = (n: number) => valuesToRemove.some((v) => Math.abs(n - v) < EXCLUDE_EPSILON);
  const joiner = delimiterUsed === "comma" ? "," : delimiterUsed === "tab" ? "\t" : " ";

  const outLines: string[] = [];
  for (const line of input.split(/\r\n|\r|\n/)) {
    if (line.trim() === "") continue;

    if (delimiterUsed === "newline") {
      const parsed = parseToken(line.trim(), stripThousandsCommas);
      if (parsed !== null && matchesTarget(parsed)) continue;
      outLines.push(line);
      continue;
    }

    let hasRemainingValue = false;
    const cells = splitLine(line, delimiterUsed).map((cellRaw) => {
      const cell = cellRaw.trim();
      if (cell === "") return "";
      const parsed = parseToken(cell, stripThousandsCommas);
      if (parsed !== null && matchesTarget(parsed)) return "";
      hasRemainingValue = true;
      return cell;
    });

    if (hasRemainingValue) outLines.push(cells.join(joiner));
  }

  return outLines.join("\n");
}

export type SortDirection = "asc" | "desc";

/** Extracts every valid number in the input (ignoring any exclude filter) and rewrites it, sorted, one per line. */
export function sortNumbersInInput(input: string, mode: DelimiterMode, direction: SortDirection): string {
  const { values } = parseNumberGrid(input, mode, []);
  const sorted = [...values].sort((a, b) => (direction === "asc" ? a - b : b - a));
  return sorted.map(numberToPlainString).join("\n");
}
