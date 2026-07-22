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

// bwip-js (~1MB) renders every 2D symbology, so only fetch it once the user
// actually switches to Matrix (2D) mode instead of paying that cost upfront.
let bwipjsPromise: Promise<typeof BwipJs> | null = null;
function loadBwipJs() {
  if (!bwipjsPromise) bwipjsPromise = import("bwip-js/browser");
  return bwipjsPromise;
}

type BarcodeKind = "linear" | "matrix";

type LinearFormat =
  | "CODE128"
  | "CODE39"
  | "EAN13"
  | "EAN8"
  | "UPC"
  | "ITF14"
  | "MSI"
  | "pharmacode"
  | "codabar";

type MatrixFormat = "datamatrix" | "pdf417" | "azteccode";

type BarcodeFormat = LinearFormat | MatrixFormat;

const LINEAR_FORMATS: {
  key: LinearFormat;
  label: string;
  desc: string;
  placeholder: string;
  sample: string;
}[] = [
  { key: "CODE128", label: "CODE128", desc: "Any text/ASCII", placeholder: "Enter text or numbers", sample: "Hello-123" },
  { key: "CODE39", label: "CODE39", desc: "Letters, digits, - . $ / + % space", placeholder: "UPPERCASE TEXT", sample: "CODE39" },
  { key: "EAN13", label: "EAN-13", desc: "12 or 13 digits", placeholder: "12 or 13 digits", sample: "590123412345" },
  { key: "EAN8", label: "EAN-8", desc: "7 or 8 digits", placeholder: "7 or 8 digits", sample: "9638507" },
  { key: "UPC", label: "UPC-A", desc: "11 or 12 digits", placeholder: "11 or 12 digits", sample: "03600029145" },
  { key: "ITF14", label: "ITF-14", desc: "13 or 14 digits", placeholder: "13 or 14 digits", sample: "1234567890123" },
  { key: "MSI", label: "MSI", desc: "Digits only", placeholder: "Digits only", sample: "1234567" },
  { key: "pharmacode", label: "Pharmacode", desc: "Number 3–131070", placeholder: "3 to 131070", sample: "1234" },
  { key: "codabar", label: "Codabar", desc: "Digits with A-D start/stop", placeholder: "A12345B", sample: "A12345B" },
];

const MATRIX_FORMATS: {
  key: MatrixFormat;
  label: string;
  desc: string;
  placeholder: string;
  sample: string;
}[] = [
  { key: "datamatrix", label: "Data Matrix", desc: "Compact 2D grid, any text", placeholder: "Enter text", sample: "Data Matrix Demo" },
  { key: "pdf417", label: "PDF417", desc: "Stacked 2D, large data capacity", placeholder: "Enter text", sample: "PDF417 barcode demo" },
  { key: "azteccode", label: "Aztec Code", desc: "2D grid, no quiet zone needed", placeholder: "Enter text", sample: "Aztec Code Demo" },
];

function RouteComponent() {
  const [kind, setKind] = useState<BarcodeKind>("linear");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
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

  // Render the barcode onto the canvas (PNG export) and, for linear codes, the hidden svg (SVG export)
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(null);
      const ctx = canvasRef.current?.getContext("2d");
      if (canvasRef.current && ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (svgRef.current) svgRef.current.innerHTML = "";
      return;
    }

    if (kind === "linear") {
      const jsBarcodeOptions = {
        format,
        width: linearOptions.width,
        height: linearOptions.height,
        displayValue: linearOptions.displayValue,
        fontSize: linearOptions.fontSize,
        textMargin: linearOptions.textMargin,
        margin: linearOptions.margin,
        background: linearOptions.background,
        lineColor: linearOptions.lineColor,
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

    // Matrix (2D) formats via bwip-js, loaded on demand
    if (svgRef.current) svgRef.current.innerHTML = "";
    let cancelled = false;
    loadBwipJs()
      .then((bwipjs) => {
        if (cancelled || !canvasRef.current) return;
        bwipjs.toCanvas(canvasRef.current, {
          bcid: format,
          text: trimmed,
          scale: matrixOptions.scale,
          includetext: matrixOptions.includetext,
          paddingwidth: matrixOptions.padding,
          paddingheight: matrixOptions.padding,
          backgroundcolor: matrixOptions.background.replace("#", ""),
          barcolor: matrixOptions.lineColor.replace("#", ""),
        });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Invalid value for this barcode format");
      });
    return () => {
      cancelled = true;
    };
  }, [kind, format, value, linearOptions, matrixOptions]);

  useSEO({
    title: "Barcode Generator | Utility Hub",
    description:
      "Generate 1D barcodes (CODE128, CODE39, EAN-13, EAN-8, UPC-A, ITF-14, MSI, Pharmacode, Codabar) and 2D barcodes (Data Matrix, PDF417, Aztec Code). Customize size and colors, then export as PNG or SVG.",
    path: "/barcode-generator",
    applicationCategory: "Tool",
    featureList: [
      "Linear (1D) and matrix (2D) barcode formats",
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

  const handleFormatChange = (key: BarcodeFormat) => {
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
    if (kind === "linear") {
      const svg = svgRef.current;
      if (!svg) return;
      svgStr = new XMLSerializer().serializeToString(svg);
    } else {
      try {
        const bwipjs = await loadBwipJs();
        svgStr = bwipjs.toSVG({
          bcid: format,
          text: trimmed,
          scale: matrixOptions.scale,
          includetext: matrixOptions.includetext,
          paddingwidth: matrixOptions.padding,
          paddingheight: matrixOptions.padding,
          backgroundcolor: matrixOptions.background.replace("#", ""),
          barcolor: matrixOptions.lineColor.replace("#", ""),
        });
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
          Create linear (1D) barcodes like CODE128, CODE39, EAN, UPC, and ITF-14, or matrix (2D)
          barcodes like Data Matrix, PDF417, and Aztec Code. Customize size and colors, then
          export as PNG or SVG.
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeFormats.map((f) => {
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
            showSvgRef={kind === "linear"}
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
  showSvgRef,
  downloadPng,
  downloadSvg,
}: {
  value: string;
  error: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  showSvgRef: boolean;
  downloadPng: () => void;
  downloadSvg: () => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <>
      <div className="w-full text-center mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
        <p className="mt-1 line-clamp-2 break-all text-xs text-muted-foreground">
          Enter a value to generate a barcode
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex min-h-[160px] w-full items-center justify-center overflow-auto">
          {hasValue && !error ? (
            <canvas ref={canvasRef} />
          ) : (
            <div className="flex h-[160px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center text-sm text-muted-foreground">
              {error ? "Fix the value to preview the barcode" : "Enter a value to generate a barcode"}
            </div>
          )}
          {/* Hidden SVG for linear-format SVG download */}
          {showSvgRef ? <svg ref={svgRef} className="hidden" /> : null}
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
        EAN-13 needs digits, Data Matrix accepts any text).
      </div>
    </>
  );
}

export default RouteComponent;
