import type { ConverterUnit } from "../types";

export const weightUnits: ConverterUnit[] = [
  { name: "Grams", symbol: "g", toBase: 1, category: "metric", kind: "linear" },
  { name: "Kilograms", symbol: "kg", toBase: 1000, category: "metric", kind: "linear" },
  { name: "Milligrams", symbol: "mg", toBase: 0.001, category: "metric", kind: "linear" },
  { name: "Micrograms", symbol: "µg", toBase: 0.000001, category: "metric", kind: "linear" },
  { name: "Pounds", symbol: "lb", toBase: 453.59237, category: "imperial", kind: "linear" },
  { name: "Ounces", symbol: "oz", toBase: 28.349523125, category: "imperial", kind: "linear" },
  {
    name: "Tons (US)",
    symbol: "US ton",
    toBase: 907184.74,
    category: "imperial",
    kind: "linear",
  },
  {
    name: "Tons (UK)",
    symbol: "UK ton",
    toBase: 1016046.9088,
    category: "imperial",
    kind: "linear",
  },
  { name: "Metric Tons", symbol: "t", toBase: 1000000, category: "metric", kind: "linear" },
  { name: "Stones", symbol: "st", toBase: 6350.29318, category: "imperial", kind: "linear" },
  { name: "Carats", symbol: "ct", toBase: 0.2, category: "jewelry", kind: "linear" },
  { name: "Grain", symbol: "gr", toBase: 0.06479891, category: "imperial", kind: "linear" },
  {
    name: "Atomic Mass Unit",
    symbol: "u",
    toBase: 1.66053907e-24,
    category: "scientific",
    kind: "linear",
  },
  {
    name: "Solar Mass",
    symbol: "M☉",
    toBase: 1.989e33,
    category: "astronomical",
    kind: "linear",
  },
  {
    name: "Earth Mass",
    symbol: "M⊕",
    toBase: 5.972e27,
    category: "astronomical",
    kind: "linear",
  },
];
