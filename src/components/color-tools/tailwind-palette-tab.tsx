import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { getContrastTextColor, hexToRgba, type RGBA } from "@/lib/color";
import {
  TAILWIND_COLORS,
  TAILWIND_FAMILIES,
  type TailwindSwatch,
} from "@/data/tailwind-colors";

interface TailwindPaletteTabProps {
  onPickColor: (color: RGBA) => void;
}

function SwatchButton({
  swatch,
  onPickColor,
}: {
  swatch: TailwindSwatch;
  onPickColor: (color: RGBA) => void;
}) {
  const [copiedWhat, setCopiedWhat] = useState<"class" | "hex" | null>(null);
  const textColor = getContrastTextColor(hexToRgba(swatch.hex)!);

  const flashCopied = (what: "class" | "hex") => {
    setCopiedWhat(what);
    setTimeout(() => setCopiedWhat((current) => (current === what ? null : current)), 1500);
  };

  const handlePick = async () => {
    const ok = await copyText(swatch.className);
    if (ok) flashCopied("class");
    const parsed = hexToRgba(swatch.hex);
    if (parsed) onPickColor(parsed);
  };

  const handleCopyHex = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyText(swatch.hex);
    if (ok) flashCopied("hex");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handlePick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handlePick();
      }}
      style={{ backgroundColor: swatch.hex, color: textColor }}
      title={`${swatch.className} — ${swatch.hex}`}
      className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {copiedWhat === "class" ? (
        <Check className="h-4 w-4" />
      ) : (
        <span>{swatch.shade ?? swatch.family}</span>
      )}
      <button
        onClick={handleCopyHex}
        title={`Copy ${swatch.hex}`}
        className="absolute right-0.5 top-0.5 hidden rounded p-0.5 opacity-80 hover:opacity-100 group-hover:block"
      >
        {copiedWhat === "hex" ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

export function TailwindPaletteTab({ onPickColor }: TailwindPaletteTabProps) {
  const chromaticFamilies = TAILWIND_FAMILIES;
  const flatSwatches = TAILWIND_COLORS.filter((s) => s.shade === null);

  return (
    <div className="space-y-4">
      {chromaticFamilies.map((family) => {
        const swatches = TAILWIND_COLORS.filter((s) => s.family === family);
        return (
          <div
            key={family}
            className="rounded-xl border border-border bg-card p-4 shadow-lg"
          >
            <h3 className="mb-3 text-sm font-semibold capitalize text-card-foreground">
              {family}
            </h3>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-11">
              {swatches.map((swatch) => (
                <SwatchButton
                  key={`${swatch.family}-${swatch.shade}`}
                  swatch={swatch}
                  onPickColor={onPickColor}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">
          Black & White
        </h3>
        <div className="flex gap-2">
          {flatSwatches.map((swatch) => (
            <div key={swatch.family} className="h-16 w-16">
              <SwatchButton swatch={swatch} onPickColor={onPickColor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
