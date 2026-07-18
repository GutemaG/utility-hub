import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { temperatureUnits } from "@/features/converters/units/temperature";

const temperatureConverterConfig: ConverterConfig = {
  slug: "temperature-conversion",
  title: "Temperature Converter",
  subtitle: "Convert between common, scientific, and historical temperature scales",
  convertLabel: "Convert Temperature",
  units: temperatureUnits,
  defaultFrom: "°C",
  defaultTo: "°F",
  initialValue: "0",
  examples: [0, 25, 100, -40],
  resetValue: 0,
  resetLabel: "Reset to 0°C",
  features: [
    "Instant conversion across six temperature scales",
    "Accurate handling of negative and fractional temperatures",
    "Specialized formatting for readable scientific values",
    "Simple two-panel conversion workflow",
  ],
  categories: [
    { label: "Common", colorClass: "bg-blue-100 text-blue-700", units: "°C, °F, K" },
    { label: "Scientific", colorClass: "bg-violet-100 text-violet-700", units: "K, °R, °T" },
    { label: "Historical", colorClass: "bg-amber-100 text-amber-700", units: "°Ré" },
  ],
  keywords:
    "temperature converter, celsius to fahrenheit, fahrenheit to celsius, kelvin converter, convert temperature units",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter temperature",
};

export const Route = createFileRoute("/temperature-conversion")({
  component: () => <ConverterPage config={temperatureConverterConfig} />,
});
