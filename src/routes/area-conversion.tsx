import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { areaUnits } from "@/features/converters/units/area";

const areaConverterConfig: ConverterConfig = {
  slug: "area-conversion",
  title: "Area Converter",
  subtitle: "Convert between land, geometric, and scientific area units instantly",
  convertLabel: "Convert Area",
  units: areaUnits,
  defaultFrom: "m²",
  defaultTo: "ft²",
  initialValue: "1",
  examples: [1, 10, 100, 1000],
  resetValue: 1,
  resetLabel: "Reset to 1m²",
  features: [
    "Supports everyday, land, nautical, and astronomical units",
    "Live conversion with readable number formatting",
    "Useful for property, construction, and science tasks",
    "Clear card layout for comparing many units at once",
  ],
  categories: [
    { label: "Metric", colorClass: "bg-blue-100 text-blue-700", units: "m², km², cm², mm², ha" },
    { label: "Imperial", colorClass: "bg-amber-100 text-amber-700", units: "ft², yd², in², mi², ac" },
    { label: "Scientific", colorClass: "bg-violet-100 text-violet-700", units: "nmi², AU², ly², pc², b, Å²" },
  ],
  keywords:
    "area converter, square meters to square feet, hectares to acres, square miles converter, area unit conversion",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter area",
};

export const Route = createFileRoute("/area-conversion")({
  component: () => <ConverterPage config={areaConverterConfig} />,
});
