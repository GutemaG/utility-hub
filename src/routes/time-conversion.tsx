import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { timeUnits } from "@/features/converters/units/time";

const timeConverterConfig: ConverterConfig = {
  slug: "time-conversion",
  title: "Time Converter",
  subtitle: "Convert between calendar, precision, and astronomical time units",
  convertLabel: "Convert Time",
  units: timeUnits,
  defaultFrom: "s",
  defaultTo: "min",
  initialValue: "3600",
  examples: [1, 60, 3600, 86400],
  resetValue: 3600,
  resetLabel: "Reset to 3600s",
  features: [
    "Handles common, scientific, and astronomical time scales",
    "Live updates across twenty different units",
    "Readable formatting for extremely large and tiny values",
    "Useful for scheduling, science, and engineering calculations",
  ],
  categories: [
    { label: "Base", colorClass: "bg-blue-100 text-blue-700", units: "s, min, h, d, wk" },
    { label: "Calendar", colorClass: "bg-amber-100 text-amber-700", units: "mo, yr, dec, cent, mill" },
    { label: "Scientific", colorClass: "bg-violet-100 text-violet-700", units: "ms, μs, ns, ps, fs, as, tP, lunar, solar, sidereal, julian" },
  ],
  keywords:
    "time converter, seconds to hours, minutes to seconds, years to days, time unit conversion",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter time",
};

export const Route = createFileRoute("/time-conversion")({
  component: () => <ConverterPage config={timeConverterConfig} />,
});
