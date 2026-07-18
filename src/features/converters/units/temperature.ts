import type { ConverterUnit } from "../types";

export const temperatureUnits: ConverterUnit[] = [
  {
    name: "Celsius",
    symbol: "°C",
    toBase: (value) => value,
    fromBase: (value) => value,
    category: "metric",
    kind: "affine",
  },
  {
    name: "Fahrenheit",
    symbol: "°F",
    toBase: (value) => ((value - 32) * 5) / 9,
    fromBase: (value) => (value * 9) / 5 + 32,
    category: "imperial",
    kind: "affine",
  },
  {
    name: "Kelvin",
    symbol: "K",
    toBase: (value) => value - 273.15,
    fromBase: (value) => value + 273.15,
    category: "scientific",
    kind: "affine",
  },
  {
    name: "Rankine",
    symbol: "°R",
    toBase: (value) => ((value - 491.67) * 5) / 9,
    fromBase: (value) => ((value + 273.15) * 9) / 5,
    category: "scientific",
    kind: "affine",
  },
  {
    name: "Réaumur",
    symbol: "°Ré",
    toBase: (value) => (value * 5) / 4,
    fromBase: (value) => (value * 4) / 5,
    category: "historical",
    kind: "affine",
  },
  {
    name: "Triple Point",
    symbol: "°T",
    toBase: (value) => value - 273.16,
    fromBase: (value) => value + 273.16,
    category: "scientific",
    kind: "affine",
  },
];
