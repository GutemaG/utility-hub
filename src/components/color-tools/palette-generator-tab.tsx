import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import {
  type RGBA,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  labToRgb,
  rgbaToHex,
  hexToRgba,
  getContrastTextColor,
} from "@/lib/color";

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function rotateHue(color: RGBA, degrees: number): RGBA {
  const hsl = rgbToHsl(color);
  return hslToRgb(
    { h: normalizeHue(hsl.h + degrees), s: hsl.s, l: hsl.l },
    color.a,
  );
}

const RAMP_LIGHTNESS_STEPS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];

function buildShadeRamp(color: RGBA): RGBA[] {
  const lab = rgbToLab(color);
  return RAMP_LIGHTNESS_STEPS.map((targetL) => {
    const scale = Math.max(0, 1 - Math.abs(targetL - lab.l) / 100);
    return labToRgb(
      { l: targetL, a: lab.a * scale, b: lab.b * scale },
      color.a,
    );
  });
}

function Swatch({
  color,
  onPick,
}: {
  color: RGBA;
  onPick: () => void;
}) {
  const hex = rgbaToHex(color);
  const [copied, setCopied] = useState(false);
  const textColor = getContrastTextColor(color);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyText(hex);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={onPick}
      style={{ backgroundColor: hex, color: textColor }}
      className="flex h-16 min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-transform hover:scale-105"
    >
      <span>{hex}</span>
      <span onClick={handleCopy} className="opacity-70 hover:opacity-100">
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}

function SchemeSection({
  title,
  colors,
  onPick,
}: {
  title: string;
  colors: RGBA[];
  onPick: (color: RGBA) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <h3 className="mb-3 text-sm font-semibold text-card-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <Swatch key={i} color={c} onPick={() => onPick(c)} />
        ))}
      </div>
    </div>
  );
}

interface PaletteGeneratorTabProps {
  color: RGBA;
  onColorChange: (color: RGBA) => void;
}

export function PaletteGeneratorTab({
  color,
  onColorChange,
}: PaletteGeneratorTabProps) {
  const ramp = buildShadeRamp(color);
  const complementary = [color, rotateHue(color, 180)];
  const analogous = [
    rotateHue(color, -30),
    color,
    rotateHue(color, 30),
  ];
  const triadic = [color, rotateHue(color, 120), rotateHue(color, 240)];
  const splitComplementary = [
    color,
    rotateHue(color, 150),
    rotateHue(color, 210),
  ];
  const tetradic = [
    color,
    rotateHue(color, 90),
    rotateHue(color, 180),
    rotateHue(color, 270),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
          Base Color
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={rgbaToHex(color).slice(0, 7)}
            onChange={(e) => {
              const parsed = hexToRgba(e.target.value);
              if (parsed) onColorChange({ ...parsed, a: color.a });
            }}
            className="h-12 w-12 cursor-pointer rounded-lg border border-input bg-transparent"
          />
          <span className="font-mono text-sm text-muted-foreground">
            {rgbaToHex(color)}
          </span>
        </div>
      </div>

      <SchemeSection
        title="Shade & Tint Ramp"
        colors={ramp}
        onPick={onColorChange}
      />
      <SchemeSection
        title="Complementary"
        colors={complementary}
        onPick={onColorChange}
      />
      <SchemeSection
        title="Analogous"
        colors={analogous}
        onPick={onColorChange}
      />
      <SchemeSection title="Triadic" colors={triadic} onPick={onColorChange} />
      <SchemeSection
        title="Split-Complementary"
        colors={splitComplementary}
        onPick={onColorChange}
      />
      <SchemeSection
        title="Tetradic (Square)"
        colors={tetradic}
        onPick={onColorChange}
      />
    </div>
  );
}
