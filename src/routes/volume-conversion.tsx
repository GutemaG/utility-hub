import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { volumeUnits } from "@/features/converters/units/volume";

const volumeConverterConfig: ConverterConfig = {
  slug: "volume-conversion",
  title: "Volume Converter",
  subtitle: "Convert ml to oz, litres to gallons, cups to ml and more, for cooking and everyday use",
  convertLabel: "Convert Volume",
  units: volumeUnits,
  defaultFrom: "ml",
  defaultTo: "fl oz",
  initialValue: "250",
  examples: [1, 100, 250, 1000],
  resetValue: 250,
  resetLabel: "Reset to 250 ml",
  features: [
    "Real-time conversion as you type",
    "Metric, US customary and imperial (UK) units",
    "Kitchen units: cups, tablespoons and teaspoons",
    "Exact factors for US and UK fluid ounces and gallons",
  ],
  categories: [
    { label: "Metric", colorClass: "bg-blue-100 text-blue-700", units: "ml, L, cl, dl, cm³, m³, metric cup" },
    { label: "US", colorClass: "bg-amber-100 text-amber-700", units: "fl oz, cup, pt, qt, gal, tbsp, tsp, bbl" },
    { label: "Imperial (UK)", colorClass: "bg-violet-100 text-violet-700", units: "UK fl oz, UK pt, UK gal, in³, ft³" },
  ],
  keywords:
    "volume converter, ml to oz, oz to ml, liters to gallons, gallons to liters, cups to ml, ml to cups, tablespoon to ml, fluid ounce converter",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter volume",
};

export const Route = createFileRoute("/volume-conversion")({
  component: () => <ConverterPage config={volumeConverterConfig} />,
});
