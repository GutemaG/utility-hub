import type { ConverterUnit } from "../types";

export const lengthUnits: ConverterUnit[] = [
  { name: "Meters", symbol: "m", toBase: 1, category: "metric", kind: "linear" },
  { name: "Kilometers", symbol: "km", toBase: 1000, category: "metric", kind: "linear" },
  { name: "Centimeters", symbol: "cm", toBase: 0.01, category: "metric", kind: "linear" },
  { name: "Millimeters", symbol: "mm", toBase: 0.001, category: "metric", kind: "linear" },
  { name: "Inches", symbol: "in", toBase: 0.0254, category: "imperial", kind: "linear" },
  { name: "Feet", symbol: "ft", toBase: 0.3048, category: "imperial", kind: "linear" },
  { name: "Yards", symbol: "yd", toBase: 0.9144, category: "imperial", kind: "linear" },
  { name: "Miles", symbol: "mi", toBase: 1609.344, category: "imperial", kind: "linear" },
  {
    name: "Nautical Miles",
    symbol: "nmi",
    toBase: 1852,
    category: "nautical",
    kind: "linear",
  },
  {
    name: "Light Years",
    symbol: "ly",
    toBase: 9.461e15,
    category: "astronomical",
    kind: "linear",
  },
  {
    name: "Astronomical Units",
    symbol: "AU",
    toBase: 1.496e11,
    category: "astronomical",
    kind: "linear",
  },
  {
    name: "Parsecs",
    symbol: "pc",
    toBase: 3.086e16,
    category: "astronomical",
    kind: "linear",
  },
];
