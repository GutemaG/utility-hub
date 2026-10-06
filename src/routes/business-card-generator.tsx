import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Download, Globe, Mail, MapPin, Phone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/use-seo";
import { downloadBlob, downloadBytes, readAsDataUrl } from "@/lib/files";
import { cn } from "@/lib/utils";
import { buildVCard } from "@/lib/vcard";

export const Route = createFileRoute("/business-card-generator")({
  component: RouteComponent,
});

type Template = "classic" | "band" | "centered" | "dark";
type CardSize = "iso" | "us";
type BackStyle = "qr" | "logo" | "none";
type FontKey = "sans" | "serif" | "mono";

type CardData = {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string; // data URL
  template: Template;
  size: CardSize;
  back: BackStyle;
  qrContent: "vcard" | "website";
  primary: string;
  text: string;
  font: FontKey;
};

const DEFAULT_CARD: CardData = {
  firstName: "Abebe",
  lastName: "Kebede",
  title: "Senior Software Engineer",
  company: "Utility Hub PLC",
  tagline: "Simple tools for everyday work",
  phone: "+251 911 234 567",
  email: "abebe@example.com",
  website: "www.example.com",
  address: "Bole, Addis Ababa, Ethiopia",
  logo: "",
  template: "band",
  size: "iso",
  back: "qr",
  qrContent: "vcard",
  primary: "#1d4ed8",
  text: "#111827",
  font: "sans",
};

// Card sizes in millimetres; the SVG works in mm so it prints at exactly this size
const SIZES: Record<CardSize, { w: number; h: number; label: string }> = {
  iso: { w: 85, h: 55, label: "85 × 55 mm (Europe, Africa, most of the world)" },
  us: { w: 88.9, h: 50.8, label: '3.5 × 2 in (US / Canada)' },
};

// System fonts only: the card is rasterised through an <img>, which can't use the page's web fonts.
// Ethiopic fallbacks make Amharic names render too.
const FONTS: Record<FontKey, { label: string; family: string }> = {
  sans: { label: "Sans", family: "'Segoe UI', 'Helvetica Neue', Arial, Nyala, Ebrima, 'Noto Sans Ethiopic', sans-serif" },
  serif: { label: "Serif", family: "Georgia, 'Times New Roman', Nyala, 'Noto Serif Ethiopic', serif" },
  mono: { label: "Mono", family: "Consolas, 'Courier New', Ebrima, monospace" },
};

const TEMPLATES: { key: Template; label: string }[] = [
  { key: "band", label: "Side band" },
  { key: "classic", label: "Classic" },
  { key: "centered", label: "Centered" },
  { key: "dark", label: "Dark" },
];

const STORAGE_KEY = "utility-hub:business-card:v1";
const PRINT_DPI = 300;

function loadSaved(): CardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CARD, ...JSON.parse(raw) };
  } catch {
    /* storage can be unavailable (private mode); fall back to the sample card */
  }
  return DEFAULT_CARD;
}

function RouteComponent() {
  const [card, setCard] = useState<CardData>(loadSaved);
  const [busy, setBusy] = useState(false);
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  useSEO({
    title: "Business Card Generator | Utility Hub",
    description:
      "Design a business card with your logo and a scannable contact QR code, then download print-ready PNG, SVG or PDF, including an A4 sheet of 10 cards with crop marks.",
    path: "/business-card-generator",
    keywords: "business card generator, business card maker, visiting card design, qr code business card, printable business cards a4, vcard qr",
    applicationCategory: "DesignApplication",
    featureList: [
      "Four templates with custom colors and fonts",
      "Logo upload",
      "QR code back side that saves your contact (vCard)",
      "Standard 85×55 mm and US 3.5×2 in sizes",
      "Print-ready 300 DPI PNG, SVG and PDF",
      "A4 print sheet with 10 cards and crop marks",
    ],
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
    } catch {
      /* ignore: saving is only a convenience */
    }
  }, [card]);

  const set = <K extends keyof CardData>(key: K, value: CardData[K]) => setCard((c) => ({ ...c, [key]: value }));

  const fileBase = slug([card.firstName, card.lastName].filter(Boolean).join(" ") || "business-card");
  const sides = () => [frontRef.current, card.back === "none" ? null : backRef.current].filter(Boolean) as SVGSVGElement[];

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const downloadPng = () =>
    run(async () => {
      const [front, back] = sides();
      downloadBlob(await rasterize(front, card, PRINT_DPI), `${fileBase}-front.png`);
      if (back) downloadBlob(await rasterize(back, card, PRINT_DPI), `${fileBase}-back.png`);
    });

  const downloadSvg = () => {
    sides().forEach((svg, i) =>
      downloadBlob(new Blob([serialize(svg, card)], { type: "image/svg+xml" }), `${fileBase}-${i === 0 ? "front" : "back"}.svg`)
    );
  };

  const downloadPdf = (sheet: boolean) =>
    run(async () => {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const { w, h } = SIZES[card.size];
      const pt = (mm: number) => (mm * 72) / 25.4;
      const images = [];
      for (const svg of sides()) {
        const png = await rasterize(svg, card, PRINT_DPI);
        images.push(await doc.embedPng(new Uint8Array(await png.arrayBuffer())));
      }

      if (!sheet) {
        for (const img of images) {
          const page = doc.addPage([pt(w), pt(h)]);
          page.drawImage(img, { x: 0, y: 0, width: pt(w), height: pt(h) });
        }
      } else {
        // A4 sheet, 2 columns × 5 rows, centered, with crop marks outside the grid
        const [pw, ph] = [210, 297];
        const cols = 2;
        const rows = 5;
        const ox = (pw - cols * w) / 2;
        const oy = (ph - rows * h) / 2;
        images.forEach((img, side) => {
          const page = doc.addPage([pt(pw), pt(ph)]);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              // Backs are mirrored left↔right so they line up when printed double-sided (flip on long edge)
              const col = side === 1 ? cols - 1 - c : c;
              page.drawImage(img, { x: pt(ox + col * w), y: pt(oy + r * h), width: pt(w), height: pt(h) });
            }
          }
          const mark = 4;
          const gap = 1;
          const line = { thickness: 0.4, color: rgb(0.4, 0.4, 0.4) };
          for (let c = 0; c <= cols; c++) {
            const x = pt(ox + c * w);
            page.drawLine({ start: { x, y: pt(oy - gap - mark) }, end: { x, y: pt(oy - gap) }, ...line });
            page.drawLine({ start: { x, y: pt(oy + rows * h + gap) }, end: { x, y: pt(oy + rows * h + gap + mark) }, ...line });
          }
          for (let r = 0; r <= rows; r++) {
            const y = pt(oy + r * h);
            page.drawLine({ start: { x: pt(ox - gap - mark), y }, end: { x: pt(ox - gap), y }, ...line });
            page.drawLine({ start: { x: pt(ox + cols * w + gap), y }, end: { x: pt(ox + cols * w + gap + mark), y }, ...line });
          }
        });
      }
      downloadBytes(await doc.save(), `${fileBase}${sheet ? "-a4-sheet" : ""}.pdf`, "application/pdf");
    });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">Business Card Generator</h1>
        <p className="text-muted-foreground">
          Design a card, add your logo and a contact QR code, then download it ready to print.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-5 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <Section title="Details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name"><Input value={card.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
              <Field label="Last name"><Input value={card.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
              <Field label="Job title"><Input value={card.title} onChange={(e) => set("title", e.target.value)} /></Field>
              <Field label="Company"><Input value={card.company} onChange={(e) => set("company", e.target.value)} /></Field>
              <Field label="Phone"><Input value={card.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={card.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Website"><Input value={card.website} onChange={(e) => set("website", e.target.value)} /></Field>
              <Field label="Address"><Input value={card.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Field label="Tagline (back side)"><Input value={card.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
              </div>
            </div>
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) set("logo", await readAsDataUrl(file));
                    e.target.value = "";
                  }}
                />
                {card.logo ? (
                  <Button variant="ghost" size="sm" onClick={() => set("logo", "")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">PNG or SVG with a transparent background looks best.</p>
            </Field>
          </Section>

          <Section title="Design">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((t) => (
                <Chip key={t.key} active={card.template === t.key} onClick={() => set("template", t.key)}>
                  {t.label}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Brand color">
                <ColorInput value={card.primary} onChange={(v) => set("primary", v)} />
              </Field>
              <Field label="Text color">
                <ColorInput value={card.text} onChange={(v) => set("text", v)} />
              </Field>
              <Field label="Font">
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={card.font} onChange={(e) => set("font", e.target.value as FontKey)}>
                  {Object.entries(FONTS).map(([k, f]) => (
                    <option key={k} value={k}>{f.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Size">
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={card.size} onChange={(e) => set("size", e.target.value as CardSize)}>
                  {Object.entries(SIZES).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Back side">
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={card.back} onChange={(e) => set("back", e.target.value as BackStyle)}>
                  <option value="qr">QR code + logo</option>
                  <option value="logo">Logo / company only</option>
                  <option value="none">No back side</option>
                </select>
              </Field>
              {card.back === "qr" ? (
                <Field label="QR code opens">
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={card.qrContent} onChange={(e) => set("qrContent", e.target.value as CardData["qrContent"])}>
                    <option value="vcard">Save contact (vCard)</option>
                    <option value="website">Website</option>
                  </select>
                </Field>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCard(DEFAULT_CARD)}>
              Reset to sample
            </Button>
          </Section>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Front</p>
              <CardFront ref={frontRef} card={card} />
            </div>
            {card.back !== "none" ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Back</p>
                <CardBack ref={backRef} card={card} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={busy} onClick={() => downloadPdf(true)}>
              <Download className="h-4 w-4" /> A4 print sheet (PDF)
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => downloadPdf(false)}>
              Card PDF
            </Button>
            <Button variant="secondary" disabled={busy} onClick={downloadPng}>
              PNG (300 DPI)
            </Button>
            <Button variant="secondary" disabled={busy} onClick={downloadSvg}>
              SVG
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The A4 sheet holds 10 cards. For double-sided printing, print page 1, put the paper back in and print page 2
            (flip on long edge), then cut along the crop marks.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------- Card rendering (SVG in millimetres) ----------------

type SideProps = { card: CardData };

const CardFront = forwardRef<SVGSVGElement, SideProps>(function CardFront({ card }, ref) {
  const { w, h } = SIZES[card.size];
  const name = [card.firstName, card.lastName].filter(Boolean).join(" ");
  const font = FONTS[card.font].family;
  const contacts = contactLines(card);
  const dark = card.template === "dark";
  const bg = dark ? "#111827" : "#ffffff";
  const fg = dark ? "#f9fafb" : card.text;
  const muted = dark ? "#d1d5db" : mix(card.text, "#ffffff", 0.35);

  let body: ReactNode;
  if (card.template === "band") {
    const bandW = w * 0.36;
    const x = bandW + 5;
    const room = w - x - 4;
    body = (
      <>
        <rect width={bandW} height={h} fill={card.primary} />
        {card.logo ? (
          <image href={card.logo} x={5} y={h / 2 - 12} width={bandW - 10} height={15} preserveAspectRatio="xMidYMid meet" />
        ) : null}
        <FitText x={bandW / 2} y={card.logo ? h / 2 + 10 : h / 2 + 1.5} max={bandW - 6} size={3.4} anchor="middle" fill="#ffffff" weight={700} font={font} text={card.company} />
        <FitText x={x} y={13} max={room} size={5} weight={700} fill={fg} font={font} text={name} />
        <FitText x={x} y={18.5} max={room} size={2.8} fill={card.primary} font={font} text={card.title} />
        <rect x={x} y={21.5} width={10} height={0.5} fill={card.primary} />
        <ContactList lines={contacts} x={x} y={h - 6 - (contacts.length - 1) * 4.6} max={room} color={muted} iconColor={card.primary} font={font} />
      </>
    );
  } else if (card.template === "centered") {
    const top = card.logo ? 20 : 15;
    body = (
      <>
        <rect width={w} height={2} fill={card.primary} />
        {card.logo ? <image href={card.logo} x={w / 2 - 15} y={5} width={30} height={9} preserveAspectRatio="xMidYMid meet" /> : null}
        <FitText x={w / 2} y={top + 2} max={w - 12} size={5} anchor="middle" weight={700} fill={fg} font={font} text={name} />
        <FitText x={w / 2} y={top + 7} max={w - 12} size={2.7} anchor="middle" fill={card.primary} font={font} text={[card.title, card.company].filter(Boolean).join(" · ")} />
        <rect x={w / 2 - 6} y={top + 10} width={12} height={0.4} fill={card.primary} />
        <FitText
          x={w / 2}
          y={top + 16}
          max={w - 8}
          size={2.3}
          anchor="middle"
          fill={muted}
          font={font}
          text={[card.phone, card.email].filter(Boolean).join("   ·   ")}
        />
        <FitText x={w / 2} y={top + 20.5} max={w - 8} size={2.3} anchor="middle" fill={muted} font={font} text={[card.website, card.address].filter(Boolean).join("   ·   ")} />
      </>
    );
  } else {
    // classic & dark share a layout: accent bar, name block top-left, logo top-right, contacts bottom-left
    body = (
      <>
        <rect width={2.2} height={h} fill={card.primary} />
        {card.logo ? <image href={card.logo} x={w - 27} y={5} width={22} height={11} preserveAspectRatio="xMaxYMid meet" /> : null}
        <FitText x={8} y={12} max={card.logo ? w - 38 : w - 14} size={5} weight={700} fill={fg} font={font} text={name} />
        <FitText x={8} y={17.5} max={w - 14} size={2.8} fill={dark ? mix(card.primary, "#ffffff", 0.45) : card.primary} font={font} text={card.title} />
        <FitText x={8} y={21.5} max={w - 14} size={2.5} fill={muted} font={font} text={card.company} />
        <ContactList lines={contacts} x={8} y={h - 6 - (contacts.length - 1) * 4.6} max={w - 14} color={muted} iconColor={dark ? mix(card.primary, "#ffffff", 0.45) : card.primary} font={font} />
      </>
    );
  }

  return (
    <CardSvg ref={ref} w={w} h={h} bg={bg}>
      {body}
    </CardSvg>
  );
});

const CardBack = forwardRef<SVGSVGElement, SideProps>(function CardBack({ card }, ref) {
  const { w, h } = SIZES[card.size];
  const font = FONTS[card.font].family;
  const showQr = card.back === "qr";
  const qrValue =
    card.qrContent === "website" && card.website
      ? /^https?:\/\//i.test(card.website) ? card.website : `https://${card.website}`
      : buildVCard({
          firstName: card.firstName,
          lastName: card.lastName,
          organization: card.company,
          title: card.title,
          phone: card.phone,
          email: card.email,
          website: card.website,
          address: card.address,
          note: "",
        });
  const qrSize = h * 0.62;
  const leftW = showQr ? w - qrSize - 10 : w;
  const cx = leftW / 2 + (showQr ? 2 : 0);

  return (
    <CardSvg ref={ref} w={w} h={h} bg={card.primary}>
      {card.logo ? (
        <image href={card.logo} x={cx - leftW * 0.35} y={h / 2 - 13} width={leftW * 0.7} height={14} preserveAspectRatio="xMidYMid meet" />
      ) : null}
      <FitText x={cx} y={card.logo ? h / 2 + 7 : h / 2} max={leftW - 8} size={card.logo ? 3.4 : 4.8} anchor="middle" weight={700} fill="#ffffff" font={font} text={card.company} />
      <FitText x={cx} y={card.logo ? h / 2 + 12 : h / 2 + 6} max={leftW - 8} size={2.4} anchor="middle" fill={mix(card.primary, "#ffffff", 0.75)} font={font} text={card.tagline} />
      {showQr ? (
        <>
          <rect x={w - qrSize - 7} y={(h - qrSize) / 2 - 2} width={qrSize + 4} height={qrSize + 4} rx={1.5} fill="#ffffff" />
          <QRCodeSVG value={qrValue} size={qrSize} x={w - qrSize - 5} y={(h - qrSize) / 2} level="M" fgColor="#111827" bgColor="#ffffff" />
          <text x={w - qrSize / 2 - 5} y={(h + qrSize) / 2 + 4.6} fontSize={1.9} textAnchor="middle" fill="#ffffff" fontFamily={font}>
            {card.qrContent === "website" && card.website ? "Visit website" : "Scan to save contact"}
          </text>
        </>
      ) : null}
    </CardSvg>
  );
});

const CardSvg = forwardRef<SVGSVGElement, { w: number; h: number; bg: string; children: ReactNode }>(function CardSvg({ w, h, bg, children }, ref) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full rounded-lg shadow-md ring-1 ring-black/5"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <rect width={w} height={h} fill={bg} />
      {children}
    </svg>
  );
});

type ContactLine = { icon: typeof Phone; text: string };

function contactLines(card: CardData): ContactLine[] {
  return [
    { icon: Phone, text: card.phone },
    { icon: Mail, text: card.email },
    { icon: Globe, text: card.website },
    { icon: MapPin, text: card.address },
  ].filter((l) => l.text.trim());
}

function ContactList({ lines, x, y, max, color, iconColor, font }: { lines: ContactLine[]; x: number; y: number; max: number; color: string; iconColor: string; font: string }) {
  return (
    <>
      {lines.map((l, i) => {
        const Icon = l.icon;
        const ly = y + i * 4.6;
        return (
          <g key={i}>
            <Icon x={x} y={ly - 2.5} width={3} height={3} color={iconColor} strokeWidth={2.2} />
            <FitText x={x + 4.6} y={ly} max={max - 4.6} size={2.4} fill={color} font={font} text={l.text} />
          </g>
        );
      })}
    </>
  );
}

// Text that shrinks to fit its box. Width is estimated (no DOM measuring) so it renders the same
// in the preview and in exports.
function FitText({ x, y, max, size, text, fill, font, weight = 400, anchor = "start" }: { x: number; y: number; max: number; size: number; text: string; fill: string; font: string; weight?: number; anchor?: "start" | "middle" | "end" }) {
  if (!text) return null;
  const estimated = text.length * size * (weight >= 600 ? 0.58 : 0.53);
  const fontSize = estimated > max ? size * (max / estimated) : size;
  return (
    <text x={x} y={y} fontSize={fontSize} fontWeight={weight} fill={fill} fontFamily={font} textAnchor={anchor}>
      {text}
    </text>
  );
}

// ---------------- Export helpers ----------------

function serialize(svg: SVGSVGElement, card: CardData) {
  const { w, h } = SIZES[card.size];
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("width", `${w}mm`);
  clone.setAttribute("height", `${h}mm`);
  return new XMLSerializer().serializeToString(clone);
}

async function rasterize(svg: SVGSVGElement, card: CardData, dpi: number): Promise<Blob> {
  const { w, h } = SIZES[card.size];
  const pw = Math.round((w / 25.4) * dpi);
  const ph = Math.round((h / 25.4) * dpi);
  const url = URL.createObjectURL(new Blob([serialize(svg, card)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render the card."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pw;
    canvas.height = ph;
    canvas.getContext("2d")!.drawImage(img, 0, 0, pw, ph);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Blend two hex colors; t=0 → a, t=1 → b
function mix(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
    const n = m ? parseInt(m[1], 16) : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const ca = parse(a);
  const cb = parse(b);
  return `#${ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "business-card";
}

// ---------------- UI helpers ----------------

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 shrink-0 rounded border" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1.5 text-sm font-medium transition",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-border hover:bg-accent/50"
      )}
    >
      {children}
    </button>
  );
}

export default RouteComponent;
