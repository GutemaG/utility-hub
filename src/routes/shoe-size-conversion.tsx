import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { shoeSizeUnits } from "@/features/converters/units/shoe-size";

const shoeSizeConverterConfig: ConverterConfig = {
  slug: "shoe-size-conversion",
  title: "Shoe Size Converter",
  subtitle: "Convert between major regional shoe sizing systems with half-size support",
  convertLabel: "Convert Shoe Sizes",
  units: shoeSizeUnits,
  defaultFrom: "US M",
  defaultTo: "EU",
  initialValue: "9",
  examples: [5, 7, 9, 11],
  resetValue: 9,
  resetLabel: "Reset to US Men 9",
  features: [
    "Converts between US, UK, EU, JP, AU, MX, and BR systems",
    "Half-size aware formatting for more realistic outputs",
    "Useful for shopping, sizing guides, and product listings",
    "Quick comparison view across all supported regions",
  ],
  categories: [
    { label: "North America", colorClass: "bg-blue-100 text-blue-700", units: "US M, US W, MX" },
    { label: "Europe", colorClass: "bg-amber-100 text-amber-700", units: "UK, EU" },
    { label: "Asia-Pacific", colorClass: "bg-violet-100 text-violet-700", units: "JP, AU, BR" },
  ],
  keywords:
    "shoe size converter, US to EU shoe size, UK shoe size converter, JP shoe size converter",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter shoe size",
};

export const Route = createFileRoute("/shoe-size-conversion")({
  component: () => <ConverterPage config={shoeSizeConverterConfig} />,
});
