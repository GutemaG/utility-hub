import { useSEO } from "@/hooks/use-seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { RGBA } from "@/lib/color";
import { ColorConverterTab } from "@/components/color-tools/color-converter-tab";
import { TailwindPaletteTab } from "@/components/color-tools/tailwind-palette-tab";
import { GradientGeneratorTab } from "@/components/color-tools/gradient-generator-tab";
import { PaletteGeneratorTab } from "@/components/color-tools/palette-generator-tab";

export const Route = createFileRoute("/color-tools")({
  component: RouteComponent,
});

type TabId = "converter" | "tailwind" | "gradient" | "palette";

const TABS: { id: TabId; label: string }[] = [
  { id: "converter", label: "Converter" },
  { id: "tailwind", label: "Tailwind Palette" },
  { id: "gradient", label: "Gradient Generator" },
  { id: "palette", label: "Palette Generator" },
];

function RouteComponent() {
  const [color, setColor] = useState<RGBA>({ r: 59, g: 130, b: 246, a: 1 });
  const [activeTab, setActiveTab] = useState<TabId>("converter");

  useSEO({
    title: "Color Tools | Utility Hub",
    description:
      "Convert colors between HEX, RGB, HSL, HWB, CIE LCH, and CMYK, browse the Tailwind palette, and generate gradients and color schemes.",
    path: "/color-tools",
    keywords:
      "color picker, color converter, hex to rgb, hsl, hwb, cmyk, cie lch, tailwind colors, gradient generator, palette generator",
    applicationCategory: "Tool",
    featureList: [
      "Color format converter (HEX, RGB, HSL, HWB, CIE LCH, CMYK)",
      "Nearest CSS named color",
      "Tailwind v4 palette browser",
      "CSS gradient generator",
      "Color palette & scheme generator",
    ],
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
          Color Tools
        </h1>
        <p className="text-muted-foreground">
          Convert colors, browse the Tailwind palette, and build gradients and
          color schemes
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "converter" && (
        <ColorConverterTab color={color} onColorChange={setColor} />
      )}
      {activeTab === "tailwind" && (
        <TailwindPaletteTab onPickColor={setColor} />
      )}
      {activeTab === "gradient" && <GradientGeneratorTab color={color} />}
      {activeTab === "palette" && (
        <PaletteGeneratorTab color={color} onColorChange={setColor} />
      )}

      <div className="rounded-xl border border-border bg-gradient-to-r from-muted/60 to-muted/30 p-6">
        <h3 className="mb-3 text-lg font-semibold text-card-foreground">
          How it works
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Converter:</strong> Edit any field — HEX, RGB, HSL, HWB,
            CIE LCH, or CMYK — and the rest update automatically, plus the
            nearest CSS named color
          </p>
          <p>
            • <strong>Tailwind Palette:</strong> Browse the full Tailwind v4
            default palette and copy a class name or hex value with one click
          </p>
          <p>
            • <strong>Gradient Generator:</strong> Build linear or radial CSS
            gradients from multiple color stops and copy the output
          </p>
          <p>
            • <strong>Palette Generator:</strong> Generate a shade/tint ramp
            and hue-based color schemes from a base color
          </p>
          <p>
            • Picking a color in any tab loads it into the shared color used
            across the Converter and Palette Generator tabs
          </p>
        </div>
      </div>
    </div>
  );
}
