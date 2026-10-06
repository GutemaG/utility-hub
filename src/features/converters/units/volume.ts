import type { ConverterUnit } from "../types";

// Base unit: millilitre.
export const volumeUnits: ConverterUnit[] = [
  { name: "Millilitres", symbol: "ml", toBase: 1, category: "metric", kind: "linear" },
  { name: "Litres", symbol: "L", toBase: 1000, category: "metric", kind: "linear" },
  { name: "Centilitres", symbol: "cl", toBase: 10, category: "metric", kind: "linear" },
  { name: "Decilitres", symbol: "dl", toBase: 100, category: "metric", kind: "linear" },
  { name: "Cubic centimetres", symbol: "cm³", toBase: 1, category: "metric", kind: "linear" },
  { name: "Cubic metres", symbol: "m³", toBase: 1_000_000, category: "metric", kind: "linear" },
  { name: "US fluid ounces", symbol: "fl oz", toBase: 29.5735295625, category: "us", kind: "linear" },
  { name: "US cups", symbol: "cup", toBase: 236.5882365, category: "us", kind: "linear" },
  { name: "US pints", symbol: "pt", toBase: 473.176473, category: "us", kind: "linear" },
  { name: "US quarts", symbol: "qt", toBase: 946.352946, category: "us", kind: "linear" },
  { name: "US gallons", symbol: "gal", toBase: 3785.411784, category: "us", kind: "linear" },
  { name: "Tablespoons (US)", symbol: "tbsp", toBase: 14.78676478125, category: "us", kind: "linear" },
  { name: "Teaspoons (US)", symbol: "tsp", toBase: 4.92892159375, category: "us", kind: "linear" },
  { name: "Metric cups", symbol: "metric cup", toBase: 250, category: "metric", kind: "linear" },
  { name: "Imperial fluid ounces", symbol: "UK fl oz", toBase: 28.4130625, category: "imperial", kind: "linear" },
  { name: "Imperial pints", symbol: "UK pt", toBase: 568.26125, category: "imperial", kind: "linear" },
  { name: "Imperial gallons", symbol: "UK gal", toBase: 4546.09, category: "imperial", kind: "linear" },
  { name: "Cubic inches", symbol: "in³", toBase: 16.387064, category: "imperial", kind: "linear" },
  { name: "Cubic feet", symbol: "ft³", toBase: 28316.846592, category: "imperial", kind: "linear" },
  { name: "Oil barrels", symbol: "bbl", toBase: 158987.294928, category: "us", kind: "linear" },
];
