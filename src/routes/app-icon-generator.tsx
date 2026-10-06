import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropArea } from "@/components/file-drop-area";
import { Chip, Field, Panel, Tabs, ToolHeader } from "@/components/tool-ui";
import { useSEO } from "@/hooks/use-seo";
import { copyText } from "@/lib/clipboard";
import { downloadZip } from "@/lib/files";
import { buildIco } from "@/lib/ico";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app-icon-generator")({
  component: RouteComponent,
});

// ---------------- Icon sets ----------------

type Platform = "web" | "pwa" | "ios" | "android";

const PLATFORMS: { key: Platform; title: string; desc: string }[] = [
  { key: "web", title: "Website favicon", desc: "favicon.ico, 16–48 px PNGs, Apple touch icon" },
  { key: "pwa", title: "PWA / Web app", desc: "192 & 512 px, maskable icons, site.webmanifest" },
  { key: "ios", title: "iOS / iPadOS app", desc: "Xcode AppIcon.appiconset with Contents.json, 20–1024 px" },
  { key: "android", title: "Android app", desc: "mipmap folders, round + adaptive icons, Play Store 512 px" },
];

// [point size, scale, idiom]
const IOS_ICONS: [number, number, "iphone" | "ipad" | "ios-marketing"][] = [
  [20, 2, "iphone"], [20, 3, "iphone"], [29, 2, "iphone"], [29, 3, "iphone"], [40, 2, "iphone"], [40, 3, "iphone"], [60, 2, "iphone"], [60, 3, "iphone"],
  [20, 1, "ipad"], [20, 2, "ipad"], [29, 1, "ipad"], [29, 2, "ipad"], [40, 1, "ipad"], [40, 2, "ipad"], [76, 1, "ipad"], [76, 2, "ipad"], [83.5, 2, "ipad"],
  [1024, 1, "ios-marketing"],
];

const ANDROID_DENSITIES: [string, number][] = [
  ["mdpi", 1],
  ["hdpi", 1.5],
  ["xhdpi", 2],
  ["xxhdpi", 3],
  ["xxxhdpi", 4],
];

// ---------------- Rendering ----------------

type Source =
  | { kind: "image"; bitmap: ImageBitmap; svg?: string; name: string }
  | { kind: "text"; text: string; color: string; font: string };

type Style = {
  padding: number; // 0..0.3 extra space around the logo
  background: string | null; // null = transparent
  radius: number; // 0..0.5 corner radius as a fraction of the size
};

/**
 * Draw one icon.
 * - `content`: how much of the square the logo may fill (safe zones for maskable/adaptive icons are smaller)
 * - `shape`: the outline the background is clipped to
 */
function renderIcon(
  source: Source,
  size: number,
  opts: { content: number; background: string | null; shape: "square" | "rounded" | "circle"; radius?: number }
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  if (opts.shape !== "square") {
    ctx.beginPath();
    if (opts.shape === "circle") ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else ctx.roundRect(0, 0, size, size, (opts.radius ?? 0) * size);
    ctx.clip();
  }
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, size, size);
  }
  // Letters look cramped edge-to-edge, so text gets a little extra margin
  const box = size * opts.content * (source.kind === "text" ? 0.86 : 1);
  const x0 = (size - box) / 2;
  if (source.kind === "image") {
    const { bitmap } = source;
    const scale = Math.min(box / bitmap.width, box / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  } else {
    const text = source.text.trim() || "A";
    ctx.fillStyle = source.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    // Find the largest font size whose rendered glyphs fit in the box
    let fontSize = box;
    ctx.font = `700 ${fontSize}px ${source.font}`;
    for (let i = 0; i < 20; i++) {
      const m = ctx.measureText(text);
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const fit = Math.min(box / w, box / h);
      if (fit > 0.98 && fit < 1.02) break;
      fontSize *= fit;
      ctx.font = `700 ${fontSize}px ${source.font}`;
    }
    const m = ctx.measureText(text);
    const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const glyphX = x0 + box / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
    ctx.fillText(text, glyphX, x0 + (box - glyphH) / 2 + m.actualBoundingBoxAscent);
  }
  return canvas;
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create PNG."))), "image/png"));

// Variants used by the generator and the previews
function variants(source: Source, s: Style) {
  const content = 1 - s.padding * 2;
  const solid = s.background ?? "#ffffff";
  return {
    // Favicons and PWA "any" icons keep the user's shape and transparency
    web: (size: number) => renderIcon(source, size, { content, background: s.background, shape: s.radius ? "rounded" : "square", radius: s.radius }),
    // iOS masks the icon itself and shows black behind transparency, so it must be a full, opaque square
    ios: (size: number) => renderIcon(source, size, { content, background: solid, shape: "square" }),
    // Maskable / adaptive icons can be cropped to a circle: keep the logo inside the central safe zone
    maskable: (size: number) => renderIcon(source, size, { content: 0.62 * (1 - s.padding), background: solid, shape: "square" }),
    adaptiveForeground: (size: number) => renderIcon(source, size, { content: 0.58 * (1 - s.padding), background: null, shape: "square" }),
    androidLegacy: (size: number) => renderIcon(source, size, { content: content * 0.9, background: solid, shape: "rounded", radius: Math.max(s.radius, 0.12) }),
    androidRound: (size: number) => renderIcon(source, size, { content: content * 0.78, background: solid, shape: "circle" }),
  };
}

// ---------------- Files ----------------

const HEAD_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

function manifestJson(name: string, background: string) {
  return JSON.stringify(
    {
      name: name || "My App",
      short_name: (name || "App").slice(0, 12),
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      theme_color: background,
      background_color: background,
      display: "standalone",
      start_url: "/",
    },
    null,
    2
  );
}

const ADAPTIVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

function readme(platforms: Set<Platform>) {
  const parts = ["Icons generated with Utility Hub (App Icon Generator).", ""];
  if (platforms.has("web") || platforms.has("pwa")) {
    parts.push(
      "WEB (folder web/)",
      "  Copy everything in web/ to the root of your site (e.g. /public), then add to <head>:",
      ...HEAD_SNIPPET.split("\n").map((l) => "    " + l),
      ""
    );
  }
  if (platforms.has("ios")) {
    parts.push(
      "iOS (folder ios/AppIcon.appiconset)",
      "  In Xcode, open Assets.xcassets, delete the existing AppIcon and drag AppIcon.appiconset in.",
      "  React Native: ios/<YourApp>/Images.xcassets/AppIcon.appiconset  ·  Flutter: ios/Runner/Assets.xcassets/AppIcon.appiconset",
      ""
    );
  }
  if (platforms.has("android")) {
    parts.push(
      "ANDROID (folder android/res)",
      "  Copy the mipmap-* and values folders into app/src/main/res/ (replace existing ic_launcher files).",
      "  Flutter: android/app/src/main/res  ·  React Native: android/app/src/main/res",
      "  playstore-icon.png (512×512) is for the Google Play Console listing.",
      ""
    );
  }
  return parts.join("\n");
}

async function buildFiles(source: Source, style: Style, platforms: Set<Platform>, appName: string) {
  const v = variants(source, style);
  const solid = style.background ?? "#ffffff";
  const files: { name: string; data: Blob }[] = [];
  const png = async (name: string, canvas: HTMLCanvasElement) => files.push({ name, data: await toBlob(canvas) });
  const text = (name: string, body: string, type = "text/plain") => files.push({ name, data: new Blob([body], { type }) });

  if (platforms.has("web") || platforms.has("pwa")) {
    const icoParts = await Promise.all([16, 32, 48].map(async (size) => ({ size, blob: await toBlob(v.web(size)) })));
    files.push({ name: "web/favicon.ico", data: await buildIco(icoParts) });
    files.push({ name: "web/favicon-16x16.png", data: icoParts[0].blob });
    files.push({ name: "web/favicon-32x32.png", data: icoParts[1].blob });
    await png("web/apple-touch-icon.png", v.ios(180));
    if (source.kind === "image" && source.svg) text("web/favicon.svg", source.svg, "image/svg+xml");
  }
  if (platforms.has("pwa")) {
    await png("web/icon-192.png", v.web(192));
    await png("web/icon-512.png", v.web(512));
    await png("web/icon-maskable-192.png", v.maskable(192));
    await png("web/icon-maskable-512.png", v.maskable(512));
    text("web/site.webmanifest", manifestJson(appName, solid), "application/manifest+json");
  }
  if (platforms.has("web") || platforms.has("pwa")) text("web/head-snippet.html", HEAD_SNIPPET + "\n");

  if (platforms.has("ios")) {
    const images: Record<string, string>[] = [];
    const made = new Map<number, string>();
    for (const [pt, scale, idiom] of IOS_ICONS) {
      const px = Math.round(pt * scale);
      const filename = `icon-${px}.png`;
      if (!made.has(px)) {
        await png(`ios/AppIcon.appiconset/${filename}`, v.ios(px));
        made.set(px, filename);
      }
      images.push({ size: `${pt}x${pt}`, idiom, filename, scale: `${scale}x` });
    }
    text("ios/AppIcon.appiconset/Contents.json", JSON.stringify({ images, info: { version: 1, author: "xcode" } }, null, 2), "application/json");
  }

  if (platforms.has("android")) {
    for (const [density, m] of ANDROID_DENSITIES) {
      await png(`android/res/mipmap-${density}/ic_launcher.png`, v.androidLegacy(48 * m));
      await png(`android/res/mipmap-${density}/ic_launcher_round.png`, v.androidRound(48 * m));
      await png(`android/res/mipmap-${density}/ic_launcher_foreground.png`, v.adaptiveForeground(108 * m));
    }
    text("android/res/mipmap-anydpi-v26/ic_launcher.xml", ADAPTIVE_XML, "text/xml");
    text("android/res/mipmap-anydpi-v26/ic_launcher_round.xml", ADAPTIVE_XML, "text/xml");
    text(
      "android/res/values/ic_launcher_background.xml",
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${solid}</color>\n</resources>\n`,
      "text/xml"
    );
    await png("android/playstore-icon.png", v.ios(512));
  }

  text("README.txt", readme(platforms));
  return files;
}

// ---------------- Page ----------------

const FONTS = [
  { label: "Sans", value: "system-ui, 'Segoe UI', Roboto, Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, Consolas, monospace" },
  { label: "Ethiopic", value: "'Nyala', 'Ebrima', 'Noto Sans Ethiopic', sans-serif" },
];

function RouteComponent() {
  const [mode, setMode] = useState<"image" | "text">("image");
  const [image, setImage] = useState<Extract<Source, { kind: "image" }> | null>(null);
  const [textSource, setTextSource] = useState({ text: "UH", color: "#ffffff", font: FONTS[0].value });
  const [style, setStyle] = useState<Style>({ padding: 0.08, background: "#2563eb", radius: 0.18 });
  const [transparent, setTransparent] = useState(false);
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["web", "pwa", "ios", "android"]));
  const [appName, setAppName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useSEO({
    title: "App Icon & Favicon Generator: iOS, Android, PWA and Website | Utility Hub",
    description:
      "Turn one logo into every icon size you need: favicon.ico, Apple touch icon, PWA and maskable icons, the iOS AppIcon set for Xcode and Android mipmap/adaptive icons. Free, runs in your browser.",
    path: "/app-icon-generator",
    keywords:
      "app icon generator, favicon generator, ios app icon sizes, android app icon generator, adaptive icon, maskable icon, pwa icons, appiconset, mipmap icons, apple touch icon",
    applicationCategory: "DesignApplication",
    featureList: [
      "favicon.ico with 16, 32 and 48 px",
      "PWA icons with maskable versions and site.webmanifest",
      "iOS AppIcon.appiconset with Contents.json (all iPhone/iPad sizes + 1024 px)",
      "Android mipmap icons: legacy, round and adaptive foreground",
      "Live previews for browser tab, iPhone, Android and maskable",
      "Logo upload or text/letter icon",
    ],
  });

  const effectiveStyle = useMemo(() => ({ ...style, background: transparent ? null : style.background }), [style, transparent]);
  const source: Source | null = mode === "image" ? image : { kind: "text", ...textSource };

  const loadImage = async (file: File) => {
    setError(null);
    try {
      const bitmap = await createImageBitmap(file);
      const svg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg") ? await file.text() : undefined;
      image?.bitmap.close();
      setImage({ kind: "image", bitmap, svg, name: file.name });
      if (bitmap.width < 512 || bitmap.height < 512) {
        setError(`This image is ${bitmap.width}×${bitmap.height}. Use at least 1024×1024 (or an SVG) so the large icons stay sharp.`);
      }
    } catch {
      setError("Could not read this image.");
    }
  };

  const generate = async () => {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      const files = await buildFiles(source, effectiveStyle, platforms, appName.trim());
      await downloadZip(files, "app-icons.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the icons.");
    } finally {
      setBusy(false);
    }
  };

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <ToolHeader
        title="App Icon & Favicon Generator"
        subtitle="Upload your logo once and get every size for websites, PWAs, iPhone/iPad and Android apps."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel>
          <Tabs
            value={mode}
            onChange={setMode}
            options={[
              { value: "image", label: "From logo" },
              { value: "text", label: "From text" },
            ]}
          />
          {mode === "image" ? (
            <FileDropArea
              accept="image/*,.svg"
              listenToPaste
              onFiles={(f) => loadImage(f[0])}
              hint={image ? `Using ${image.name} (${image.bitmap.width}×${image.bitmap.height}). Drop another to replace.` : "A square PNG or SVG, at least 1024×1024, works best."}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Letters or emoji">
                <Input maxLength={4} value={textSource.text} onChange={(e) => setTextSource({ ...textSource, text: e.target.value })} />
              </Field>
              <Field label="Text colour">
                <ColorInput value={textSource.color} onChange={(color) => setTextSource({ ...textSource, color })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Font">
                  <div className="flex flex-wrap gap-2">
                    {FONTS.map((f) => (
                      <Chip key={f.label} active={textSource.font === f.value} onClick={() => setTextSource({ ...textSource, font: f.value })}>
                        <span style={{ fontFamily: f.value }}>{f.label}</span>
                      </Chip>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}

          <Field label="Background">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
              Transparent (website and PWA only; app icons need a solid colour)
            </label>
            <ColorInput value={style.background ?? "#ffffff"} onChange={(background) => setStyle({ ...style, background })} />
          </Field>
          <Field label={`Padding (${Math.round(style.padding * 100)}%)`}>
            <input
              type="range"
              min={0}
              max={30}
              value={Math.round(style.padding * 100)}
              onChange={(e) => setStyle({ ...style, padding: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </Field>
          <Field label={`Corner radius for favicons (${Math.round(style.radius * 200)}%)`} hint="iOS and Android round the corners themselves.">
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(style.radius * 100)}
              onChange={(e) => setStyle({ ...style, radius: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </Field>
          <Field label="App name (for site.webmanifest)">
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="My App" />
          </Field>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <h2 className="text-sm font-semibold">Preview</h2>
            {source ? <Previews source={source} style={effectiveStyle} /> : <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">Upload a logo to see previews</div>}
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold">Include</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PLATFORMS.map((p) => (
                <label
                  key={p.key}
                  className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition", platforms.has(p.key) ? "border-blue-600 bg-blue-600/5" : "border-border")}
                >
                  <input type="checkbox" className="mt-1" checked={platforms.has(p.key)} onChange={() => togglePlatform(p.key)} />
                  <span>
                    <span className="block text-sm font-medium">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">{p.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={generate} disabled={!source || !platforms.size || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download icons (.zip)
            </Button>
            {error ? <p className="text-sm text-amber-600">{error}</p> : null}
            {platforms.has("web") || platforms.has("pwa") ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Add to your HTML &lt;head&gt;</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (await copyText(HEAD_SNIPPET)) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">{HEAD_SNIPPET}</pre>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">The zip includes a README with where each folder goes (Xcode, Android Studio, Flutter, React Native).</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border" aria-label="Pick colour" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

const CHECKER = "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 12px 12px";

function Previews({ source, style }: { source: Source; style: Style }) {
  const [urls, setUrls] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    const timer = setTimeout(async () => {
      const v = variants(source, style);
      const make = async (canvas: HTMLCanvasElement) => {
        const u = URL.createObjectURL(await toBlob(canvas));
        created.push(u);
        return u;
      };
      const next = {
        fav16: await make(v.web(16)),
        fav32: await make(v.web(32)),
        web: await make(v.web(128)),
        ios: await make(v.ios(180)),
        maskable: await make(v.maskable(192)),
        androidRound: await make(v.androidRound(144)),
      };
      if (!cancelled) setUrls(next);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setTimeout(() => created.forEach((u) => URL.revokeObjectURL(u)), 2000);
    };
  }, [source, style]);

  if (!urls) return <div className="h-40" />;

  return (
    <div className="space-y-4" data-testid="icon-previews">
      {/* Browser tab */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-end gap-1 bg-muted px-2 pt-2">
          <div className="flex w-52 items-center gap-2 rounded-t-md bg-background px-3 py-1.5 text-xs">
            <img src={urls.fav16} alt="" className="h-4 w-4" />
            <span className="truncate">{"My website"}</span>
          </div>
        </div>
        <div className="h-3 bg-background" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PreviewTile label="Favicon / PWA">
          <img src={urls.web} alt="" className="h-16 w-16" style={{ background: CHECKER }} />
        </PreviewTile>
        <PreviewTile label="iPhone">
          {/* iOS applies its own rounded mask */}
          <img src={urls.ios} alt="" className="h-16 w-16 rounded-[22.5%]" />
        </PreviewTile>
        <PreviewTile label="Android">
          <img src={urls.androidRound} alt="" className="h-16 w-16" />
        </PreviewTile>
        <PreviewTile label="Maskable (circle crop)">
          <img src={urls.maskable} alt="" className="h-16 w-16 rounded-full" />
        </PreviewTile>
      </div>
    </div>
  );
}

function PreviewTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 p-4">
      {children}
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
