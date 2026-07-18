import { createFileRoute } from "@tanstack/react-router";

import { ConverterPage } from "@/features/converters/components/converter-page";
import type { ConverterConfig } from "@/features/converters/types";
import { dataStorageUnits } from "@/features/converters/units/data-storage";

const dataStorageConverterConfig: ConverterConfig = {
  slug: "data-storage-conversion",
  title: "Data Storage Converter",
  subtitle: "Convert between bytes, bits, binary units, and computer storage scales",
  convertLabel: "Convert Data Storage",
  units: dataStorageUnits,
  defaultFrom: "B",
  defaultTo: "KB",
  initialValue: "1024",
  examples: [1, 1024, 1048576, 1073741824],
  resetValue: 1024,
  resetLabel: "Reset to 1024B",
  features: [
    "Supports bytes, bits, metric, binary, and computer-word units",
    "Optimized formatting for large storage values",
    "Useful for networking, files, and hardware sizing",
    "Instant conversion across modern and legacy units",
  ],
  categories: [
    { label: "Base", colorClass: "bg-blue-100 text-blue-700", units: "B, b" },
    { label: "Metric", colorClass: "bg-amber-100 text-amber-700", units: "KB, MB, GB, TB, PB, EB, ZB, YB, Kb, Mb, Gb, Tb, Pb" },
    { label: "Binary", colorClass: "bg-violet-100 text-violet-700", units: "KiB, MiB, GiB, TiB, PiB, EiB, ZiB, YiB, word, word64, nibble" },
  ],
  keywords:
    "data storage converter, bytes to kb, mb to gb, gibibytes converter, bits to bytes",
  applicationCategory: "Tool",
  inputPlaceholder: "Enter data size",
};

export const Route = createFileRoute("/data-storage-conversion")({
  component: () => <ConverterPage config={dataStorageConverterConfig} />,
});
