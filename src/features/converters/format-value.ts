import type { FormatOptions } from "./types";

export function formatConvertedValue(
  value: number,
  options: FormatOptions = {}
): string {
  const {
    largeThreshold = 1000,
    veryLargeThreshold = 1_000_000,
  } = options;

  const abs = Math.abs(value);

  if (abs === 0) return "0";
  if (abs < 0.001 && abs > 0) return value.toFixed(8);
  if (abs < 1) return value.toFixed(6);
  if (abs >= veryLargeThreshold) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }
  if (abs >= largeThreshold) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return value.toFixed(3);
}

export function formatTemperatureValue(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.01 && abs !== 0) return value.toFixed(6);
  if (abs < 1) return value.toFixed(4);
  if (abs >= 1000) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }
  return value.toFixed(2);
}

export function formatShoeSizeValue(value: number, step = 0.5): string {
  const rounded = Math.round(value / step) * step;
  return rounded.toFixed(step < 1 ? 1 : 0);
}

export function formatDataStorageValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  if (abs >= 1_000_000) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }
  if (abs >= 1000) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  }
  if (abs < 0.001 && abs > 0) return value.toFixed(8);
  if (abs < 1) return value.toFixed(6);
  return value.toFixed(3);
}
