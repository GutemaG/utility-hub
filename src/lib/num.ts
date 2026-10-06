/** Parse a user-typed number; returns NaN for blanks. Accepts commas as thousands separators. */
export function num(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  return cleaned === "" ? NaN : Number(cleaned);
}

export function fmt(value: number, maxDigits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}
