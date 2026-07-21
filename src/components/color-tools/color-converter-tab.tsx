import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import {
  type RGBA,
  clamp,
  hexToRgba,
  rgbaToHex,
  rgbaToRgbString,
  parseRgbString,
  rgbToHsl,
  hslToString,
  parseHslString,
  rgbToHwb,
  hwbToString,
  parseHwbString,
  rgbToLch,
  lchToString,
  parseLchString,
  rgbToCmyk,
  cmykToString,
  parseCmykString,
  nearestNamedColor,
} from "@/lib/color";

interface ColorFieldProps {
  label: string;
  value: string;
  onCommit: (raw: string) => boolean;
  readOnly?: boolean;
}

function ColorField({ label, value, onCommit, readOnly }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(value);
      setInvalid(false);
    }
  }, [value, focused]);

  const handleBlur = () => {
    setFocused(false);
    if (readOnly) return;
    const ok = onCommit(draft);
    setInvalid(!ok);
    if (ok) setDraft(value);
  };

  const handleCopy = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          readOnly={readOnly}
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className={`w-full rounded-lg border bg-muted px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
            invalid ? "border-red-500" : "border-input"
          }`}
        />
        <button
          onClick={handleCopy}
          title="Copy"
          className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

interface ColorConverterTabProps {
  color: RGBA;
  onColorChange: (color: RGBA) => void;
}

export function ColorConverterTab({
  color,
  onColorChange,
}: ColorConverterTabProps) {
  const hex = rgbaToHex(color);
  const rgbString = rgbaToRgbString(color);
  const hsl = rgbToHsl(color);
  const hwb = rgbToHwb(color);
  const lch = rgbToLch(color);
  const cmyk = rgbToCmyk(color);
  const named = nearestNamedColor(color);

  const commit = (parsed: RGBA | null) => {
    if (!parsed) return false;
    onColorChange(parsed);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="color"
            value={hex.slice(0, 7)}
            onChange={(e) => {
              const parsed = hexToRgba(e.target.value);
              if (parsed) onColorChange({ ...parsed, a: color.a });
            }}
            className="h-16 w-16 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent"
          />
          <div className="flex-1">
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-foreground">
              <span>Alpha</span>
              <span className="font-mono text-muted-foreground">
                {Math.round(color.a * 100)}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(color.a * 100)}
              onChange={(e) =>
                onColorChange({ ...color, a: Number(e.target.value) / 100 })
              }
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ColorField
          label="HEX"
          value={hex}
          onCommit={(raw) => commit(hexToRgba(raw))}
        />
        <ColorField
          label="RGB"
          value={rgbString}
          onCommit={(raw) => commit(parseRgbString(raw))}
        />
        <ColorField
          label="HSL"
          value={hslToString(hsl, color.a)}
          onCommit={(raw) => commit(parseHslString(raw))}
        />
        <ColorField
          label="HWB"
          value={hwbToString(hwb, color.a)}
          onCommit={(raw) => commit(parseHwbString(raw))}
        />
        <ColorField
          label="CIE LCH"
          value={lchToString(lch, color.a)}
          onCommit={(raw) => commit(parseLchString(raw))}
        />
        <ColorField
          label="CMYK"
          value={cmykToString(cmyk)}
          onCommit={(raw) => commit(parseCmykString(raw))}
        />
        <ColorField
          label={`Nearest CSS name (Δ ${clamp(named.distance, 0, 999).toFixed(1)})`}
          value={named.name}
          onCommit={() => false}
          readOnly
        />
      </div>
    </div>
  );
}
