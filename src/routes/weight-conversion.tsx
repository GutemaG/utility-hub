import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { weightUnits } from "@/features/converters/units/weight";

const weightConverterConfig: ConverterConfig = {
  slug: "weight-conversion",
  title: "Weight Converter",
  subtitle: "Convert between metric, imperial, scientific, and astronomical weight units instantly",
  convertLabel: "Convert Weight",
  units: weightUnits,
  defaultFrom: "g",
  defaultTo: "kg",
  initialValue: "1000",
  examples: [1, 100, 1000, 5000],
  resetValue: 1000,
  resetLabel: "Reset to 1000g",
  features: [
    "Real-time conversion as you type",
    "Metric, imperial, jewelry, and scientific units",
    "Consistent formatting for very large and very small values",
    "Responsive conversion cards for every unit",
  ],
  categories: [
    { label: "Metric", colorClass: "bg-blue-100 text-blue-700", units: "g, kg, mg, µg, t" },
    { label: "Imperial", colorClass: "bg-amber-100 text-amber-700", units: "lb, oz, st, US ton, UK ton, gr" },
    { label: "Scientific", colorClass: "bg-violet-100 text-violet-700", units: "u, M☉, M⊕, ct" },
  ],
  keywords:
    "weight converter, grams to kilograms, pounds to kilograms, ounces to grams, convert weight units",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter weight",
};

export const Route = createFileRoute("/weight-conversion")({
  component: () => <ConverterPage config={weightConverterConfig} />,
});
