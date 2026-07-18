import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { lengthUnits } from "@/features/converters/units/length";
import { createFileRoute } from "@tanstack/react-router";

const lengthConverterConfig: ConverterConfig = {
  slug: "length-conversion",
  title: "Length Converter",
  subtitle: "Convert between different length units instantly",
  convertLabel: "Convert Length",
  units: lengthUnits,
  defaultFrom: "m",
  defaultTo: "km",
  initialValue: "1",
  examples: [1, 5, 10, 100],
  resetValue: 1,
  resetLabel: "Reset to 1m",
  features: [
    "Real-time conversion as you type",
    "Supports 12 different length units",
    "Automatic formatting for very large/small numbers",
    "Responsive design for all devices",
  ],
  categories: [
    {
      label: "Metric",
      colorClass: "bg-blue-100 text-blue-700",
      units: "m, km, cm, mm",
    },
    {
      label: "Imperial",
      colorClass: "bg-amber-100 text-amber-700",
      units: "in, ft, yd, mi",
    },
    {
      label: "Astronomical",
      colorClass: "bg-violet-100 text-violet-700",
      units: "ly, AU, pc",
    },
  ],
  keywords:
    "length converter, unit conversion, meters to feet, kilometers to miles, inches to centimeters, feet to meters, length units, convert length units, measurement conversion",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter value",
};

export const Route = createFileRoute("/length-conversion")({
  component: () => <ConverterPage config={lengthConverterConfig} />,
});
