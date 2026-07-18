import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { speedUnits } from "@/features/converters/units/speed";

const speedConverterConfig: ConverterConfig = {
  slug: "speed-conversion",
  title: "Speed Converter",
  subtitle: "Convert between travel, scientific, and historical speed units instantly",
  convertLabel: "Convert Speed",
  units: speedUnits,
  defaultFrom: "m/s",
  defaultTo: "km/h",
  initialValue: "10",
  examples: [1, 10, 60, 120],
  resetValue: 10,
  resetLabel: "Reset to 10m/s",
  features: [
    "Live conversion for transport and science use cases",
    "Includes knots, Mach, and speed of light references",
    "Covers metric, imperial, nautical, and novelty units",
    "Optimized for desktop and mobile screens",
  ],
  categories: [
    { label: "Metric", colorClass: "bg-blue-100 text-blue-700", units: "m/s, km/h, km/s, cm/s" },
    { label: "Imperial", colorClass: "bg-amber-100 text-amber-700", units: "mph, ft/s, yd/s, in/s, mi/s" },
    { label: "Scientific", colorClass: "bg-violet-100 text-violet-700", units: "M, c, vs, kn, nmi/h, fur/ftn" },
  ],
  keywords:
    "speed converter, kmh to mph, mph to kmh, knots converter, speed of light converter",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter speed",
};

export const Route = createFileRoute("/speed-conversion")({
  component: () => <ConverterPage config={speedConverterConfig} />,
});
