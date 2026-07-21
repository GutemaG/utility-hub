import { CSS_NAMED_COLORS } from "@/lib/color-names";

export interface RGBA {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HWB {
  h: number; // 0-360
  w: number; // 0-100
  b: number; // 0-100
}

export interface CMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface Lab {
  l: number; // 0-100
  a: number; // roughly -125..125
  b: number; // roughly -125..125
}

export interface LCH {
  l: number; // 0-100
  c: number; // 0-~150
  h: number; // 0-360
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "hwb" | "lch" | "cmyk" | "named";

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

// ---------------------------------------------------------------------------
// HEX
// ---------------------------------------------------------------------------

function toHexByte(n: number): string {
  return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}

export function rgbaToHex(c: RGBA, includeAlpha?: boolean): string {
  const base = `#${toHexByte(c.r)}${toHexByte(c.g)}${toHexByte(c.b)}`;
  const shouldIncludeAlpha = includeAlpha ?? c.a < 1;
  return shouldIncludeAlpha ? `${base}${toHexByte(c.a * 255)}` : base;
}

export function hexToRgba(hex: string): RGBA | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(
    hex.trim(),
  );
  if (!match) return null;

  const digits = match[1];
  const expand = (nibble: string) => parseInt(nibble + nibble, 16);

  if (digits.length === 3 || digits.length === 4) {
    const r = expand(digits[0]);
    const g = expand(digits[1]);
    const b = expand(digits[2]);
    const a = digits.length === 4 ? expand(digits[3]) / 255 : 1;
    return { r, g, b, a };
  }

  const r = parseInt(digits.slice(0, 2), 16);
  const g = parseInt(digits.slice(2, 4), 16);
  const b = parseInt(digits.slice(4, 6), 16);
  const a = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

// ---------------------------------------------------------------------------
// RGB(A) string
// ---------------------------------------------------------------------------

export function rgbaToRgbString(c: RGBA): string {
  const r = Math.round(c.r);
  const g = Math.round(c.g);
  const b = Math.round(c.b);
  return c.a < 1
    ? `rgba(${r}, ${g}, ${b}, ${round(c.a, 2)})`
    : `rgb(${r}, ${g}, ${b})`;
}

function parseComponent(raw: string, max: number): number {
  if (raw.endsWith("%")) {
    return clamp((parseFloat(raw) / 100) * max, 0, max);
  }
  return clamp(parseFloat(raw), 0, max);
}

function parseAlphaComponent(raw: string | undefined): number {
  if (raw === undefined) return 1;
  if (raw.endsWith("%")) return clamp(parseFloat(raw) / 100, 0, 1);
  return clamp(parseFloat(raw), 0, 1);
}

export function parseRgbString(s: string): RGBA | null {
  const match =
    /^rgba?\(\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i.exec(
      s.trim(),
    );
  if (!match) return null;

  return {
    r: parseComponent(match[1], 255),
    g: parseComponent(match[2], 255),
    b: parseComponent(match[3], 255),
    a: parseAlphaComponent(match[4]),
  };
}

// ---------------------------------------------------------------------------
// HSL(A)
// ---------------------------------------------------------------------------

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

export function rgbToHsl(c: RGBA): HSL {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  h *= 60;

  return { h: normalizeHue(h), s: s * 100, l: l * 100 };
}

export function hslToRgb(hsl: HSL, a = 1): RGBA {
  const h = normalizeHue(hsl.h) / 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray, a };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return { r: r * 255, g: g * 255, b: b * 255, a };
}

export function hslToString(hsl: HSL, a = 1): string {
  const h = round(hsl.h);
  const s = round(hsl.s);
  const l = round(hsl.l);
  return a < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${round(a, 2)})`
    : `hsl(${h}, ${s}%, ${l}%)`;
}

export function parseHslString(s: string): RGBA | null {
  const match =
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i.exec(
      s.trim(),
    );
  if (!match) return null;

  return hslToRgb(
    {
      h: parseFloat(match[1]),
      s: clamp(parseFloat(match[2]), 0, 100),
      l: clamp(parseFloat(match[3]), 0, 100),
    },
    parseAlphaComponent(match[4]),
  );
}

// ---------------------------------------------------------------------------
// HWB
// ---------------------------------------------------------------------------

export function rgbToHwb(c: RGBA): HWB {
  const { h } = rgbToHsl(c);
  const w = Math.min(c.r, c.g, c.b) / 255;
  const bl = 1 - Math.max(c.r, c.g, c.b) / 255;
  return { h, w: w * 100, b: bl * 100 };
}

export function hwbToRgb(hwb: HWB, a = 1): RGBA {
  const w = clamp(hwb.w, 0, 100) / 100;
  const bl = clamp(hwb.b, 0, 100) / 100;

  if (w + bl >= 1) {
    const gray = (w / (w + bl)) * 255;
    return { r: gray, g: gray, b: gray, a };
  }

  const rgb = hslToRgb({ h: hwb.h, s: 100, l: 50 }, a);
  const factor = 1 - w - bl;
  return {
    r: (rgb.r / 255) * factor * 255 + w * 255,
    g: (rgb.g / 255) * factor * 255 + w * 255,
    b: (rgb.b / 255) * factor * 255 + w * 255,
    a,
  };
}

export function hwbToString(hwb: HWB, a = 1): string {
  const h = round(hwb.h);
  const w = round(hwb.w);
  const bl = round(hwb.b);
  return a < 1
    ? `hwb(${h} ${w}% ${bl}% / ${round(a, 2)})`
    : `hwb(${h} ${w}% ${bl}%)`;
}

export function parseHwbString(s: string): RGBA | null {
  const match =
    /^hwb\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i.exec(
      s.trim(),
    );
  if (!match) return null;

  return hwbToRgb(
    {
      h: parseFloat(match[1]),
      w: clamp(parseFloat(match[2]), 0, 100),
      b: clamp(parseFloat(match[3]), 0, 100),
    },
    parseAlphaComponent(match[4]),
  );
}

// ---------------------------------------------------------------------------
// CMYK
// ---------------------------------------------------------------------------

export function rgbToCmyk(c: RGBA): CMYK {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const cy = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return { c: cy * 100, m: m * 100, y: y * 100, k: k * 100 };
}

export function cmykToRgb(cmyk: CMYK, a = 1): RGBA {
  const c = clamp(cmyk.c, 0, 100) / 100;
  const m = clamp(cmyk.m, 0, 100) / 100;
  const y = clamp(cmyk.y, 0, 100) / 100;
  const k = clamp(cmyk.k, 0, 100) / 100;

  return {
    r: 255 * (1 - c) * (1 - k),
    g: 255 * (1 - m) * (1 - k),
    b: 255 * (1 - y) * (1 - k),
    a,
  };
}

export function cmykToString(cmyk: CMYK): string {
  return `cmyk(${round(cmyk.c)}%, ${round(cmyk.m)}%, ${round(cmyk.y)}%, ${round(cmyk.k)}%)`;
}

export function parseCmykString(s: string): RGBA | null {
  const match =
    /^cmyk\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i.exec(
      s.trim(),
    );
  if (!match) return null;

  return cmykToRgb({
    c: clamp(parseFloat(match[1]), 0, 100),
    m: clamp(parseFloat(match[2]), 0, 100),
    y: clamp(parseFloat(match[3]), 0, 100),
    k: clamp(parseFloat(match[4]), 0, 100),
  });
}

// ---------------------------------------------------------------------------
// CIE Lab / LCH
// ---------------------------------------------------------------------------

const D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return c * 255;
}

function labF(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
}

function labFInv(t: number): number {
  const delta = 6 / 29;
  return t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29);
}

export function rgbToLab(c: RGBA): Lab {
  const r = srgbToLinear(c.r);
  const g = srgbToLinear(c.g);
  const b = srgbToLinear(c.b);

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  const fx = labF(x / D65.x);
  const fy = labF(y / D65.y);
  const fz = labF(z / D65.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function labToRgb(lab: Lab, a = 1): RGBA {
  const fy = (lab.l + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;

  const x = D65.x * labFInv(fx);
  const y = D65.y * labFInv(fy);
  const z = D65.z * labFInv(fz);

  const rLin = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const gLin = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const bLin = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return {
    r: clamp(linearToSrgb(rLin), 0, 255),
    g: clamp(linearToSrgb(gLin), 0, 255),
    b: clamp(linearToSrgb(bLin), 0, 255),
    a,
  };
}

export function labToLch(lab: Lab): LCH {
  const c = Math.hypot(lab.a, lab.b);
  // sRGB<->XYZ matrix round-trips leave a/b with float noise (~1e-5) even for
  // exactly achromatic colors, which would otherwise produce a meaningless hue.
  const h = c < 1e-2 ? 0 : normalizeHue(Math.atan2(lab.b, lab.a) * (180 / Math.PI));
  return { l: lab.l, c, h };
}

export function lchToLab(lch: LCH): Lab {
  const hRad = (lch.h * Math.PI) / 180;
  return {
    l: lch.l,
    a: lch.c * Math.cos(hRad),
    b: lch.c * Math.sin(hRad),
  };
}

export function rgbToLch(c: RGBA): LCH {
  return labToLch(rgbToLab(c));
}

export function lchToRgb(lch: LCH, a = 1): RGBA {
  return labToRgb(lchToLab(lch), a);
}

export function lchToString(lch: LCH, a = 1): string {
  const l = round(lch.l, 2);
  const c = round(lch.c, 2);
  const h = round(lch.h, 2);
  return a < 1
    ? `lch(${l}% ${c} ${h} / ${round(a, 2)})`
    : `lch(${l}% ${c} ${h})`;
}

export function parseLchString(s: string): RGBA | null {
  const match =
    /^lch\(\s*([\d.]+)%\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i.exec(
      s.trim(),
    );
  if (!match) return null;

  return lchToRgb(
    {
      l: clamp(parseFloat(match[1]), 0, 100),
      c: Math.max(0, parseFloat(match[2])),
      h: parseFloat(match[3]),
    },
    parseAlphaComponent(match[4]),
  );
}

// ---------------------------------------------------------------------------
// Named colors
// ---------------------------------------------------------------------------

export function namedColorToRgb(name: string): RGBA | null {
  const normalized = name.trim().toLowerCase();
  const entry = CSS_NAMED_COLORS.find((c) => c.name === normalized);
  return entry ? hexToRgba(entry.hex) : null;
}

export function nearestNamedColor(c: RGBA): {
  name: string;
  hex: string;
  distance: number;
} {
  let best = CSS_NAMED_COLORS[0];
  let bestDistance = Infinity;

  for (const candidate of CSS_NAMED_COLORS) {
    const rgb = hexToRgba(candidate.hex)!;
    const distance = Math.hypot(c.r - rgb.r, c.g - rgb.g, c.b - rgb.b);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return { name: best.name, hex: best.hex, distance: bestDistance };
}

// ---------------------------------------------------------------------------
// Universal parser
// ---------------------------------------------------------------------------

export function parseColor(
  input: string,
): { rgba: RGBA; format: ColorFormat } | null {
  const s = input.trim();
  if (!s) return null;

  const hex = hexToRgba(s);
  if (hex) return { rgba: hex, format: "hex" };

  const rgb = parseRgbString(s);
  if (rgb) return { rgba: rgb, format: "rgb" };

  const hsl = parseHslString(s);
  if (hsl) return { rgba: hsl, format: "hsl" };

  const hwb = parseHwbString(s);
  if (hwb) return { rgba: hwb, format: "hwb" };

  const lch = parseLchString(s);
  if (lch) return { rgba: lch, format: "lch" };

  const cmyk = parseCmykString(s);
  if (cmyk) return { rgba: cmyk, format: "cmyk" };

  const named = namedColorToRgb(s);
  if (named) return { rgba: named, format: "named" };

  return null;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function getContrastTextColor(c: RGBA): "#000000" | "#ffffff" {
  // Relative luminance per WCAG.
  const toLinear = (v: number) => {
    const c8 = v / 255;
    return c8 <= 0.03928 ? c8 / 12.92 : ((c8 + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
