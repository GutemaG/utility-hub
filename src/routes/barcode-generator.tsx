import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import JsBarcode from "jsbarcode";
import type * as BwipJs from "bwip-js/browser";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/barcode-generator")({
  component: RouteComponent,
});

// bwip-js (~1MB) renders every 2D symbology and the GS1 / extended linear ones,
// so only fetch it once the user actually picks one of those formats.
let bwipjsPromise: Promise<typeof BwipJs> | null = null;
function loadBwipJs() {
  if (!bwipjsPromise) bwipjsPromise = import("bwip-js/browser");
  return bwipjsPromise;
}

type BarcodeKind = "linear" | "matrix";

// Each format is drawn either by JsBarcode (fast, small) or bwip-js (GS1, 2D, extended sets)
type FormatSpec = {
  key: string;
  label: string;
  desc: string;
  group: string;
  placeholder: string;
  sample: string;
} & (
  | { engine: "jsbarcode"; jsFormat: string; jsOptions?: Record<string, unknown> }
  | {
      engine: "bwip";
      bcid: string;
      bwipOptions?: Record<string, unknown>;
      // Turns the user's input into the text bwip-js encodes
      transform?: (value: string) => string;
    }
);

// MIL-STD-130 IUID: wrap Data Identifier elements in an ISO/IEC 15434 Format 06 envelope
// ([)> RS 06 GS ... RS EOT), written with bwip-js ^NNN escapes (needs `parse: true`)
function buildIuidEnvelope(value: string) {
  const elements = value
    .split("|")
    .map((s) => s.trim().replace(/\^/g, "^094"))
    .filter(Boolean);
  return `[)>^03006^029${elements.join("^029")}^030^004`;
}

const LINEAR_FORMATS: FormatSpec[] = [
  { key: "CODE128", group: "Code 128", label: "Code 128 (Auto)", desc: "Any ASCII, switches A/B/C automatically", placeholder: "Enter text or numbers", sample: "Hello-123", engine: "jsbarcode", jsFormat: "CODE128" },
  { key: "CODE128A", group: "Code 128", label: "Code 128 A", desc: "Uppercase, digits, control chars", placeholder: "UPPERCASE TEXT", sample: "HELLO-123", engine: "jsbarcode", jsFormat: "CODE128A" },
  { key: "CODE128B", group: "Code 128", label: "Code 128 B", desc: "Upper & lowercase ASCII", placeholder: "Enter text", sample: "Hello-123", engine: "jsbarcode", jsFormat: "CODE128B" },
  { key: "CODE128C", group: "Code 128", label: "Code 128 C", desc: "Even number of digits", placeholder: "Even number of digits", sample: "12345678", engine: "jsbarcode", jsFormat: "CODE128C" },
  { key: "gs1-128", group: "Code 128", label: "GS1-128", desc: "GS1 AIs, e.g. (01)…(17)…(10)…", placeholder: "(01)09501101530003(17)250101", sample: "(01)09501101530003(17)250101(10)ABC123", engine: "bwip", bcid: "gs1-128" },

  { key: "CODE39", group: "Code 39 / 93", label: "Code 39", desc: "A–Z, 0–9, - . $ / + % space", placeholder: "UPPERCASE TEXT", sample: "CODE39", engine: "jsbarcode", jsFormat: "CODE39" },
  { key: "CODE39-mod43", group: "Code 39 / 93", label: "Code 39 Mod 43 (LOGMARS)", desc: "MIL-STD-1189 / DoD labels, with check char", placeholder: "UPPERCASE TEXT", sample: "5340011234567", engine: "jsbarcode", jsFormat: "CODE39", jsOptions: { mod43: true } },
  { key: "code39ext", group: "Code 39 / 93", label: "Code 39 Full ASCII", desc: "Any ASCII (extended Code 39)", placeholder: "Enter text", sample: "Code39 Ext!", engine: "bwip", bcid: "code39ext" },
  { key: "CODE93", group: "Code 39 / 93", label: "Code 93", desc: "A–Z, 0–9, - . $ / + % space", placeholder: "UPPERCASE TEXT", sample: "CODE93", engine: "jsbarcode", jsFormat: "CODE93" },
  { key: "CODE93FullASCII", group: "Code 39 / 93", label: "Code 93 Full ASCII", desc: "Any ASCII", placeholder: "Enter text", sample: "Code93 Full", engine: "jsbarcode", jsFormat: "CODE93FullASCII" },

  { key: "EAN13", group: "Retail (EAN / UPC)", label: "EAN-13", desc: "12 or 13 digits", placeholder: "12 or 13 digits", sample: "590123412345", engine: "jsbarcode", jsFormat: "EAN13" },
  { key: "EAN8", group: "Retail (EAN / UPC)", label: "EAN-8", desc: "7 or 8 digits", placeholder: "7 or 8 digits", sample: "9638507", engine: "jsbarcode", jsFormat: "EAN8" },
  { key: "UPC", group: "Retail (EAN / UPC)", label: "UPC-A", desc: "11 or 12 digits", placeholder: "11 or 12 digits", sample: "03600029145", engine: "jsbarcode", jsFormat: "UPC" },
  { key: "UPCE", group: "Retail (EAN / UPC)", label: "UPC-E", desc: "6 or 8 digits (compressed UPC)", placeholder: "6 or 8 digits", sample: "123456", engine: "jsbarcode", jsFormat: "UPCE" },
  { key: "EAN5", group: "Retail (EAN / UPC)", label: "EAN-5", desc: "5-digit add-on (book prices)", placeholder: "5 digits", sample: "52495", engine: "jsbarcode", jsFormat: "EAN5" },
  { key: "EAN2", group: "Retail (EAN / UPC)", label: "EAN-2", desc: "2-digit add-on (periodicals)", placeholder: "2 digits", sample: "53", engine: "jsbarcode", jsFormat: "EAN2" },

  { key: "ITF14", group: "Interleaved 2 of 5", label: "ITF-14", desc: "13 or 14 digits (shipping cartons)", placeholder: "13 or 14 digits", sample: "1234567890123", engine: "jsbarcode", jsFormat: "ITF14" },
  { key: "ITF", group: "Interleaved 2 of 5", label: "ITF", desc: "Even number of digits", placeholder: "Even number of digits", sample: "123456", engine: "jsbarcode", jsFormat: "ITF" },

  { key: "MSI", group: "MSI", label: "MSI", desc: "Digits only, no check digit", placeholder: "Digits only", sample: "1234567", engine: "jsbarcode", jsFormat: "MSI" },
  { key: "MSI10", group: "MSI", label: "MSI Mod 10", desc: "Digits, Mod 10 check digit", placeholder: "Digits only", sample: "1234567", engine: "jsbarcode", jsFormat: "MSI10" },
  { key: "MSI11", group: "MSI", label: "MSI Mod 11", desc: "Digits, Mod 11 check digit", placeholder: "Digits only", sample: "1234567", engine: "jsbarcode", jsFormat: "MSI11" },
  { key: "MSI1010", group: "MSI", label: "MSI Mod 1010", desc: "Digits, two Mod 10 check digits", placeholder: "Digits only", sample: "1234567", engine: "jsbarcode", jsFormat: "MSI1010" },
  { key: "MSI1110", group: "MSI", label: "MSI Mod 1110", desc: "Digits, Mod 11 + Mod 10 check digits", placeholder: "Digits only", sample: "1234567", engine: "jsbarcode", jsFormat: "MSI1110" },

  { key: "pharmacode", group: "Other", label: "Pharmacode", desc: "Number 3–131070", placeholder: "3 to 131070", sample: "1234", engine: "jsbarcode", jsFormat: "pharmacode" },
  { key: "codabar", group: "Other", label: "Codabar", desc: "Digits with A-D start/stop", placeholder: "A12345B", sample: "A12345B", engine: "jsbarcode", jsFormat: "codabar" },
];

const MATRIX_FORMATS: FormatSpec[] = [
  { key: "qrcode", group: "General", label: "QR Code", desc: "Most common 2D code, any text", placeholder: "Enter text", sample: "QR Code Demo", engine: "bwip", bcid: "qrcode" },
  { key: "datamatrix", group: "General", label: "Data Matrix", desc: "Compact 2D grid, any text", placeholder: "Enter text", sample: "Data Matrix Demo", engine: "bwip", bcid: "datamatrix" },
  { key: "azteccode", group: "General", label: "Aztec Code", desc: "2D grid, no quiet zone needed", placeholder: "Enter text", sample: "Aztec Code Demo", engine: "bwip", bcid: "azteccode" },
  { key: "pdf417", group: "General", label: "PDF417", desc: "Stacked 2D; IDs, MIL-STD-129 labels", placeholder: "Enter text", sample: "PDF417 barcode demo", engine: "bwip", bcid: "pdf417" },
  { key: "micropdf417", group: "General", label: "MicroPDF417", desc: "Smaller PDF417 for short data", placeholder: "Enter text", sample: "MicroPDF417", engine: "bwip", bcid: "micropdf417" },
  { key: "maxicode", group: "General", label: "MaxiCode", desc: "Parcel sorting (UPS), up to ~93 chars", placeholder: "Enter text", sample: "MaxiCode Demo", engine: "bwip", bcid: "maxicode", bwipOptions: { mode: 4 } },

  { key: "gs1datamatrix", group: "GS1", label: "GS1 DataMatrix", desc: "GS1 AIs, e.g. (01)…(17)…(10)…", placeholder: "(01)09501101530003(17)250101", sample: "(01)09501101530003(17)250101(10)ABC123", engine: "bwip", bcid: "gs1datamatrix" },
  { key: "gs1qrcode", group: "GS1", label: "GS1 QR Code", desc: "GS1 AIs in a QR Code", placeholder: "(01)09501101530003(17)250101", sample: "(01)09501101530003(17)250101", engine: "bwip", bcid: "gs1qrcode" },

  { key: "iuid", group: "Military / DoD", label: "IUID Data Matrix (MIL-STD-130)", desc: "UII marking, ISO/IEC 15434 Format 06. Separate data elements with |", placeholder: "17V<CAGE>|1P<part no>|S<serial>", sample: "17V0CVA5|1P1234-56|S786950", engine: "bwip", bcid: "datamatrix", bwipOptions: { parse: true }, transform: buildIuidEnvelope },
];

function groupFormats(formats: FormatSpec[]) {
  const groups: { name: string; formats: FormatSpec[] }[] = [];
  for (const f of formats) {
    const group = groups.find((g) => g.name === f.group);
    if (group) group.formats.push(f);
    else groups.push({ name: f.group, formats: [f] });
  }
  return groups;
}

function RouteComponent() {
  const [kind, setKind] = useState<BarcodeKind>("linear");
  const [format, setFormat] = useState<string>("CODE128");
  const [value, setValue] = useState("Hello-123");
  const [error, setError] = useState<string | null>(null);

  const [linearOptions, setLinearOptions] = useState({
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 18,
    textMargin: 4,
    margin: 10,
    background: "#ffffff",
    lineColor: "#111827",
  });

  const [matrixOptions, setMatrixOptions] = useState({
    scale: 4,
    includetext: false,
    padding: 10,
    background: "#ffffff",
    lineColor: "#111827",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeFormats = kind === "linear" ? LINEAR_FORMATS : MATRIX_FORMATS;
  const activeFormat = useMemo(
    () => activeFormats.find((f) => f.key === format) ?? activeFormats[0],
    [activeFormats, format]
  );

  // Options for bwip-js formats (all 2D codes, plus GS1-128 / Code 39 Full ASCII in 1D)
  const buildBwipOptions = (spec: FormatSpec, text: string): BwipJs.RenderOptions => {
    if (spec.engine !== "bwip") throw new Error(`${spec.label} is not a bwip-js format`);
    const encoded = spec.transform ? spec.transform(text) : text;

    if (kind === "linear") {
      // Mirror the JsBarcode controls: bwip-js measures bar height in mm at 72dpi (~2.835px/mm) before scaling
      const scale = linearOptions.width;
      return {
        bcid: spec.bcid,
        text: encoded,
        scale,
        height: linearOptions.height / (2.835 * scale),
        includetext: linearOptions.displayValue,
        paddingwidth: Math.round(linearOptions.margin / scale),
        paddingheight: Math.round(linearOptions.margin / scale),
        backgroundcolor: linearOptions.background.replace("#", ""),
        barcolor: linearOptions.lineColor.replace("#", ""),
        ...spec.bwipOptions,
      };
    }

    return {
      bcid: spec.bcid,
      text: encoded,
      scale: matrixOptions.scale,
      includetext: matrixOptions.includetext,
      paddingwidth: matrixOptions.padding,
      paddingheight: matrixOptions.padding,
      backgroundcolor: matrixOptions.background.replace("#", ""),
      barcolor: matrixOptions.lineColor.replace("#", ""),
      ...spec.bwipOptions,
    };
  };

  // Render the barcode onto the canvas (PNG export) and, for JsBarcode formats, the hidden svg (SVG export)
  useEffect(() => {
    const trimmed = value.trim();
    if (svgRef.current) svgRef.current.innerHTML = "";
    if (!trimmed) {
      setError(null);
      const ctx = canvasRef.current?.getContext("2d");
      if (canvasRef.current && ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    if (activeFormat.engine === "jsbarcode") {
      const jsBarcodeOptions = {
        format: activeFormat.jsFormat,
        width: linearOptions.width,
        height: linearOptions.height,
        displayValue: linearOptions.displayValue,
        fontSize: linearOptions.fontSize,
        textMargin: linearOptions.textMargin,
        margin: linearOptions.margin,
        background: linearOptions.background,
        lineColor: linearOptions.lineColor,
        ...activeFormat.jsOptions,
      };

      try {
        if (canvasRef.current) {
          JsBarcode(canvasRef.current, trimmed, jsBarcodeOptions);
        }
        if (svgRef.current) {
          JsBarcode(svgRef.current, trimmed, jsBarcodeOptions);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid value for this barcode format");
      }
      return;
    }

    // bwip-js formats, loaded on demand
    let cancelled = false;
    loadBwipJs()
      .then((bwipjs) => {
        if (cancelled || !canvasRef.current) return;
        bwipjs.toCanvas(canvasRef.current, buildBwipOptions(activeFormat, trimmed));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Invalid value for this barcode format");
      });
    return () => {
      cancelled = true;
    };
    // buildBwipOptions only reads state already listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, activeFormat, value, linearOptions, matrixOptions]);

  useSEO({
    title: "Barcode Generator | Utility Hub",
    description:
      "Generate 1D barcodes (Code 128 A/B/C, GS1-128, Code 39, LOGMARS, Code 93, EAN-13/8, UPC-A/E, ITF-14, MSI, Pharmacode, Codabar) and 2D barcodes (QR Code, Data Matrix, GS1 DataMatrix, MIL-STD-130 IUID, PDF417, MicroPDF417, Aztec, MaxiCode). Customize size and colors, then export as PNG or SVG.",
    path: "/barcode-generator",
    applicationCategory: "Tool",
    featureList: [
      "Linear (1D) and matrix (2D) barcode formats",
      "GS1-128, GS1 DataMatrix and GS1 QR Code",
      "Military formats: LOGMARS Code 39 and MIL-STD-130 IUID Data Matrix",
      "Live validation per format",
      "Size and color controls",
      "Export PNG and SVG",
    ],
  });

  const handleKindChange = (nextKind: BarcodeKind) => {
    if (nextKind === kind) return;
    setKind(nextKind);
    const formats = nextKind === "linear" ? LINEAR_FORMATS : MATRIX_FORMATS;
    setFormat(formats[0].key);
    setValue(formats[0].sample);
  };

  const handleFormatChange = (key: string) => {
    setFormat(key);
    const f = activeFormats.find((fmt) => fmt.key === key);
    if (f) setValue(f.sample);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || error) return;
    const link = document.createElement("a");
    link.download = "barcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSvg = async () => {
    const trimmed = value.trim();
    if (!trimmed || error) return;

    let svgStr: string;
    if (activeFormat.engine === "jsbarcode") {
      const svg = svgRef.current;
      if (!svg) return;
      svgStr = new XMLSerializer().serializeToString(svg);
    } else {
      try {
        const bwipjs = await loadBwipJs();
        svgStr = bwipjs.toSVG(buildBwipOptions(activeFormat, trimmed));
      } catch {
        return;
      }
    }

    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "barcode.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
          Barcode Generator
        </h1>
        <p className="text-muted-foreground">
          Create linear (1D) barcodes like Code 128, GS1-128, Code 39, EAN, UPC, and ITF-14, or
          matrix (2D) barcodes like QR Code, Data Matrix, GS1 DataMatrix, MIL-STD-130 IUID, and
          PDF417. Customize size and colors, then export as PNG or SVG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left: Builder */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Kind toggle */}
          <div className="inline-flex rounded-lg border border-border p-1">
            {(["linear", "matrix"] as const).map((k) => (
              <button
                key={k}
                onClick={() => handleKindChange(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  kind === k
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {k === "linear" ? "Linear (1D)" : "Matrix (2D)"}
              </button>
            ))}
          </div>

          {/* Format cards */}
          <div className="space-y-3">
            <Label className="text-sm">Barcode Format</Label>
            {groupFormats(activeFormats).map((g) => (
              <div key={g.name} className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {g.name}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {g.formats.map((f) => {
                    const active = format === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => handleFormatChange(f.key)}
                        className={cn(
                          "group h-full rounded-lg border p-3 text-left shadow-sm transition",
                          active
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-border hover:border-ring hover:bg-accent/40 hover:shadow-md"
                        )}
                      >
                        <div className="text-sm font-medium">{f.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Value input */}
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={activeFormat.placeholder}
            />
            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{activeFormat.desc}</p>
            )}
          </div>

          <div>
            <hr />
            {/* Options */}
            {kind === "linear" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 my-2">
                <Field label={`Bar Width (${linearOptions.width}px)`}>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={linearOptions.width}
                    onChange={(e) =>
                      setLinearOptions((p) => ({ ...p, width: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </Field>

                <Field label={`Height (${linearOptions.height}px)`}>
                  <input
                    type="range"
                    min={40}
                    max={240}
                    step={10}
                    value={linearOptions.height}
                    onChange={(e) =>
                      setLinearOptions((p) => ({ ...p, height: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </Field>

                <Field label="Bar Color">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={linearOptions.lineColor}
                      onChange={(e) =>
                        setLinearOptions((p) => ({ ...p, lineColor: e.target.value }))
                      }
                      className="h-10 w-14 rounded border"
                    />
                    <Input
                      value={linearOptions.lineColor}
                      onChange={(e) =>
                        setLinearOptions((p) => ({ ...p, lineColor: e.target.value }))
                      }
                    />
                  </div>
                </Field>

                <Field label="Background">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={linearOptions.background}
                      onChange={(e) =>
                        setLinearOptions((p) => ({ ...p, background: e.target.value }))
                      }
                      className="h-10 w-14 rounded border"
                    />
                    <Input
                      value={linearOptions.background}
                      onChange={(e) =>
                        setLinearOptions((p) => ({ ...p, background: e.target.value }))
                      }
                    />
                  </div>
                </Field>

                <Field label="Show Text">
                  <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={linearOptions.displayValue ? "yes" : "no"}
                    onChange={(e) =>
                      setLinearOptions((p) => ({ ...p, displayValue: e.target.value === "yes" }))
                    }
                  >
                    <option value="yes">Show</option>
                    <option value="no">Hide</option>
                  </select>
                </Field>

                <Field label={`Quiet Zone (${linearOptions.margin}px)`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={2}
                    value={linearOptions.margin}
                    onChange={(e) =>
                      setLinearOptions((p) => ({ ...p, margin: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 my-2">
                <Field label={`Scale (${matrixOptions.scale}x)`}>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={matrixOptions.scale}
                    onChange={(e) =>
                      setMatrixOptions((p) => ({ ...p, scale: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </Field>

                <Field label={`Padding (${matrixOptions.padding}px)`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={2}
                    value={matrixOptions.padding}
                    onChange={(e) =>
                      setMatrixOptions((p) => ({ ...p, padding: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </Field>

                <Field label="Module Color">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={matrixOptions.lineColor}
                      onChange={(e) =>
                        setMatrixOptions((p) => ({ ...p, lineColor: e.target.value }))
                      }
                      className="h-10 w-14 rounded border"
                    />
                    <Input
                      value={matrixOptions.lineColor}
                      onChange={(e) =>
                        setMatrixOptions((p) => ({ ...p, lineColor: e.target.value }))
                      }
                    />
                  </div>
                </Field>

                <Field label="Background">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={matrixOptions.background}
                      onChange={(e) =>
                        setMatrixOptions((p) => ({ ...p, background: e.target.value }))
                      }
                      className="h-10 w-14 rounded border"
                    />
                    <Input
                      value={matrixOptions.background}
                      onChange={(e) =>
                        setMatrixOptions((p) => ({ ...p, background: e.target.value }))
                      }
                    />
                  </div>
                </Field>

                <Field label="Show Text">
                  <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={matrixOptions.includetext ? "yes" : "no"}
                    onChange={(e) =>
                      setMatrixOptions((p) => ({ ...p, includetext: e.target.value === "yes" }))
                    }
                  >
                    <option value="no">Hide</option>
                    <option value="yes">Show</option>
                  </select>
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview / Download */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-6 shadow-sm">
          <BarcodePreview
            value={value}
            error={error}
            canvasRef={canvasRef}
            svgRef={svgRef}
            formatLabel={activeFormat.label}
            downloadPng={downloadPng}
            downloadSvg={downloadSvg}
          />
        </div>
      </div>
    </div>
  );
}

// Small helper
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function BarcodePreview({
  value,
  error,
  canvasRef,
  svgRef,
  formatLabel,
  downloadPng,
  downloadSvg,
}: {
  value: string;
  error: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  formatLabel: string;
  downloadPng: () => void;
  downloadSvg: () => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <>
      <div className="w-full text-center mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
        <p className="mt-1 line-clamp-2 break-all text-xs text-muted-foreground">
          {formatLabel}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex min-h-[160px] w-full items-center justify-center overflow-auto">
          {/* Keep the canvas mounted so it can be redrawn as soon as the value becomes valid again */}
          <canvas ref={canvasRef} className={hasValue && !error ? "" : "hidden"} />
          {hasValue && !error ? null : (
            <div className="flex h-[160px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center text-sm text-muted-foreground">
              {error ? "Fix the value to preview the barcode" : "Enter a value to generate a barcode"}
            </div>
          )}
          {/* Hidden SVG for JsBarcode-format SVG download */}
          <svg ref={svgRef} className="hidden" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={downloadPng}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!hasValue || !!error}
          >
            Download PNG
          </Button>
          <Button onClick={downloadSvg} variant="secondary" disabled={!hasValue || !!error}>
            Download SVG
          </Button>
        </div>
      </div>

      <div className="mt-6 w-full rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 p-4 text-sm text-indigo-700 dark:text-indigo-200">
        • Pick 1D or 2D, then a format. • Each format validates its value differently (e.g.
        EAN-13 needs digits, GS1 formats need (AI)value pairs, Data Matrix accepts any text).
      </div>
    </>
  );
}

export default RouteComponent;
