import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  Type as TypeIcon,
  Link as LinkIcon,
  Wifi as WifiIcon,
  Contact as ContactIcon,
  Mail as MailIcon,
  MessageSquareText as SmsIcon,
  Phone as PhoneIcon,
  Facebook as FacebookIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Locate,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qr-code-generator")({
  component: RouteComponent,
});

type QrType =
  | "text"
  | "url"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "phone"
  | "facebook"
  | "pdf"
  | "telegram"
  | "whatsapp"
  | "location";

const EmptyIcon: React.ComponentType<{ className?: string }> = () => <></>;

const CONTENT_TYPES: {
  key: QrType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "text", label: "Text", desc: "Plain text", icon: TypeIcon },
  { key: "url", label: "URL", desc: "Website link", icon: LinkIcon },
  { key: "wifi", label: "Wi‑Fi", desc: "Network credentials", icon: WifiIcon },
  { key: "vcard", label: "Contact", desc: "vCard contact", icon: ContactIcon },
  { key: "email", label: "Email", desc: "mailto link", icon: MailIcon },
  { key: "sms", label: "SMS", desc: "Message link", icon: SmsIcon },
  { key: "phone", label: "Phone", desc: "Call link", icon: PhoneIcon },
  { key: "facebook", label: "Facebook", desc: "Profile/Page", icon: FacebookIcon },
  { key: "pdf", label: "PDF", desc: "URL or upload", icon: FileTextIcon },
  { key: "telegram", label: "Telegram", desc: "Telegram link", icon: EmptyIcon  },
  { key: "whatsapp", label: "WhatsApp", desc: "WhatsApp link", icon: EmptyIcon },
  { key: "location", label: "Location", desc: "Location link", icon: Locate  },
];

const PRESET_LOGOS = [
  { name: "WIFI", src: "/logos/wifi-circle.svg" },
  { name: "Telegram", src: "/logos/telegram.svg" },
  { name: "Facebook", src: "/logos/facebook.svg" },
  { name: "YouTube", src: "/logos/youtube-circle.svg" },
  { name: "Instagram", src: "/logos/instagram-circle.svg" },
  { name: "X", src: "/logos/x.svg" },
  { name: "WhatsApp", src: "/logos/whatsapp-circle.svg" },
  { name: "Bitcoin", src: "/logos/bitcoin.svg" },
  { name: "Google Play", src: "/logos/google-play.svg" },
  { name: "Phone", src: "/logos/phone.jpg" },
  { name: "PDF", src: "/logos/pdf.svg" },
  { name: "Location", src: "/logos/pdf.svg" },
];

function RouteComponent() {
  // Basic options
  const [qrOptions, setQrOptions] = useState({
    size: 288,
    fgColor: "#111827",
    bgColor: "#ffffff",
    level: "M" as "L" | "M" | "Q" | "H",
    includeMargin: true,
  });

  // Selected type
  const [type, setType] = useState<QrType>("text");

  // Common inputs
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  // WiFi inputs
  const [wifi, setWifi] = useState({
    ssid: "",
    password: "",
    encryption: "WPA" as "WPA" | "WEP" | "nopass",
    hidden: false,
  });

  // vCard inputs
  const [vcard, setVcard] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    note: "",
  });

  // Email inputs
  const [email, setEmail] = useState({ to: "", subject: "", body: "" });

  // SMS inputs
  const [sms, setSms] = useState({ to: "", message: "" });

  // Phone inputs
  const [phone, setPhone] = useState({ number: "" });

  // Facebook inputs
  const [facebook, setFacebook] = useState({ profileUrl: "" });

  // Telegram inputs
    const [telegram, setTelegram] = useState({ username: "" });

  // PDF inputs (URL or local file)
  const [pdf, setPdf] = useState<{ url: string; file?: File | null; fileUrl?: string }>({
    url: "",
    file: null,
    fileUrl: undefined,
  });

  // Logo overlay
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoSize, setLogoSize] = useState<number>(24); // px
  const [logoRadius, setLogoRadius] = useState<number>(8); // px

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  


  // Build the QR content
  const qrValue = useMemo(() => {
    switch (type) {
      case "text":
        return text.trim();
      case "url":
        return url.trim();
      case "wifi": {
        const T = wifi.encryption;
        const S = escapeQr(wifi.ssid);
        const P = escapeQr(wifi.password);
        const H = wifi.hidden ? "true" : "false";
        return `WIFI:T:${T};S:${S};${T !== "nopass" ? `P:${P};` : ""}H:${H};;`;
      }
      case "vcard":
        return buildVCard(vcard);
      case "email": {
        const to = email.to.trim();
        const q = new URLSearchParams();
        if (email.subject.trim()) q.set("subject", email.subject.trim());
        if (email.body.trim()) q.set("body", email.body.trim());
        const query = q.toString();
        return `mailto:${to}${query ? `?${query}` : ""}`;
      }
      case "sms":
        return `SMSTO:${sms.to.trim()}:${sms.message.trim()}`;
      case "phone":
        return `tel:${phone.number.trim()}`;
      case "facebook":
        return facebook.profileUrl.trim() || "https://facebook.com/";
      case "pdf":
        return (pdf.fileUrl && pdf.fileUrl.trim()) || pdf.url.trim();
      case "telegram":
        return `https://t.me/${telegram.username}`;
      case "whatsapp":
        return `https://wa.me/${phone.number.trim()}`;
      case "location":
        return "";
      default:
        return "";
    }
  }, [type, text, url, wifi, vcard, email, sms, phone, facebook, pdf, telegram]);

  // Local PDF cleanup
  useEffect(() => {
    return () => {
      if (pdf.fileUrl) URL.revokeObjectURL(pdf.fileUrl);
    };
  }, [pdf.fileUrl]);

  useSEO({
    title: "QR Code Generator | Utility Hub",
    description:
      "Create dynamic QR codes for Wi‑Fi, contact vCard, email, SMS, PDF, phone, Facebook, and more. Add a logo and customize colors and size.",
    path: "/qr-code-generator",
    applicationCategory: "Tool",
    featureList: [
      "Clickable content type cards",
      "Wi‑Fi, vCard, Email, SMS, Phone, PDF, Facebook",
      "Logo overlay via URL or presets",
      "Color, size, and margin controls",
      "High error correction levels",
      "Telegram and WhatsApp",
      "Export PNG and SVG",
    ],
  });

  const handlePdfFile = (file?: File | null) => {
    if (!file) {
      if (pdf.fileUrl) URL.revokeObjectURL(pdf.fileUrl);
      setPdf({ url: "", file: null, fileUrl: undefined });
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    if (pdf.fileUrl) URL.revokeObjectURL(pdf.fileUrl);
    setPdf({ ...pdf, file, fileUrl: blobUrl });
  };

  // Downloads
  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          QR Code Generator
        </h1>
        <p className="text-gray-600">
          Create dynamic QR codes for text, links, Wi‑Fi, contacts (vCard), email, SMS, phone, Facebook, and PDF. Add a logo and customize styles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left: Builder */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
          {/* Content type cards */}
          <div className="space-y-3">
            <Label className="text-sm">QR Content Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONTENT_TYPES.map((c) => {
                const Icon = c.icon;
                const active = type === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setType(c.key)}
                    className={cn(
                      "group h-full rounded-lg border p-3 text-left shadow-sm transition",
                      active
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "hover:shadow-md hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active ? "text-blue-600" : "text-gray-600"
                        )}
                      />
                      <div className="text-sm font-medium">{c.label}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic content fields */}
          {type === "text" && (
            <div className="space-y-2">
              <Label>Text</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter any text"
                className="min-h-[96px]"
              />
            </div>
          )}

          {type === "url" && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SSID</Label>
                <Input
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  placeholder="Network name"
                />
              </div>
              <div className="space-y-2">
                <Label>Encryption</Label>
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm"
                  value={wifi.encryption}
                  onChange={(e) =>
                    setWifi({ ...wifi, encryption: e.target.value as never })
                  }
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  value={wifi.password}
                  type="text"
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  placeholder={wifi.encryption === "nopass" ? "No password" : "Network password"}
                  disabled={wifi.encryption === "nopass"}
                />
              </div>
              <div className="space-y-2">
                <Label>Hidden SSID</Label>
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm"
                  value={wifi.hidden ? "yes" : "no"}
                  onChange={(e) => setWifi({ ...wifi, hidden: e.target.value === "yes" })}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name">
                <Input value={vcard.firstName} onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })} />
              </Field>
              <Field label="Last Name">
                <Input value={vcard.lastName} onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })} />
              </Field>
              <Field label="Organization">
                <Input value={vcard.organization} onChange={(e) => setVcard({ ...vcard, organization: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={vcard.title} onChange={(e) => setVcard({ ...vcard, title: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={vcard.phone} onChange={(e) => setVcard({ ...vcard, phone: e.target.value })} placeholder="+2519..." />
              </Field>
              <Field label="Email">
                <Input type="email" value={vcard.email} onChange={(e) => setVcard({ ...vcard, email: e.target.value })} />
              </Field>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Website">
                  <Input value={vcard.website} onChange={(e) => setVcard({ ...vcard, website: e.target.value })} placeholder="https://" />
                </Field>
                <Field label="Address">
                  <Input value={vcard.address} onChange={(e) => setVcard({ ...vcard, address: e.target.value })} placeholder="City, Region, Country" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Label>Note</Label>
                <Textarea value={vcard.note} onChange={(e) => setVcard({ ...vcard, note: e.target.value })} />
              </div>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-4">
              <Field label="To">
                <Input type="email" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} />
              </Field>
              <Field label="Subject">
                <Input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
              </Field>
              <Field label="Body">
                <Textarea value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} className="min-h-[96px]" />
              </Field>
            </div>
          )}

          {type === "sms" && (
            <div className="space-y-4">
              <Field label="Phone Number">
                <Input value={sms.to} onChange={(e) => setSms({ ...sms, to: e.target.value })} placeholder="+2519..." />
              </Field>
              <Field label="Message">
                <Textarea value={sms.message} onChange={(e) => setSms({ ...sms, message: e.target.value })} className="min-h-[96px]" />
              </Field>
            </div>
          )}

          {type === "phone" && (
            <Field label="Phone Number">
              <Input value={phone.number} onChange={(e) => setPhone({ number: e.target.value })} placeholder="+2519..." />
            </Field>
          )}

          {type === "facebook" && (
            <Field label="Facebook Profile/Page URL">
              <Input value={facebook.profileUrl} onChange={(e) => setFacebook({ profileUrl: e.target.value })} placeholder="https://facebook.com/yourpage" />
            </Field>
          )}

          {type === "pdf" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="PDF URL">
                <Input value={pdf.url} onChange={(e) => setPdf({ ...pdf, url: e.target.value })} placeholder="https://example.com/file.pdf" />
              </Field>
              <Field label="Or Upload PDF coming soong...">
                <Input type="file" accept="application/pdf" onChange={(e) => handlePdfFile(e.target.files?.[0])} disabled />
                {pdf.file && <p className="text-xs text-gray-500 mt-1">Selected: {pdf.file.name}</p>}
              </Field>
            </div>
          )}
        {type === "telegram" && (
            <Field label="Telegram Username or Link">
                <Input value={telegram.username} onChange={(e) => setTelegram({ username: e.target.value })} placeholder="https://t.me/yourusername" />
            </Field>
          )}
          {type === "whatsapp" && (
            <Field label="WhatsApp Phone Number">
              <Input value={phone.number} onChange={(e) => setPhone({ number: e.target.value })} placeholder="+2519..." />
            </Field>
          )}
            {type === "location" && (
            <div className="">coming soon...</div>
            )}  
          <div>
            <hr />
          {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 my-2">
                <Field label="Size">
                <input
                    type="range"
                    min={192}
                    max={512}
                    step={16}
                    value={qrOptions.size}
                    onChange={(e) => setQrOptions((p) => ({ ...p, size: Number(e.target.value) }))}
                    className="w-full"
                />
                <div className="text-xs text-gray-500">{qrOptions.size}px</div>
                </Field>

                <Field label="Error Correction">
                <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={qrOptions.level}
                    onChange={(e) =>
                    setQrOptions((p) => ({ ...p, level: e.target.value as "L" | "M" | "Q" | "H" }))
                    }
                >
                    <option value="L">L (Low)</option>
                    <option value="M">M (Medium)</option>
                    <option value="Q">Q (Quartile)</option>
                    <option value="H">H (High)</option>
                </select>
                </Field>

                <Field label="Foreground">
                <div className="flex items-center gap-3">
                    <input
                    type="color"
                    value={qrOptions.fgColor}
                    onChange={(e) => setQrOptions((p) => ({ ...p, fgColor: e.target.value }))}
                    className="h-10 w-14 rounded border"
                    />
                    <Input value={qrOptions.fgColor} onChange={(e) => setQrOptions((p) => ({ ...p, fgColor: e.target.value }))} />
                </div>
                </Field>

                <Field label="Background">
                <div className="flex items-center gap-3">
                    <input
                    type="color"
                    value={qrOptions.bgColor}
                    onChange={(e) => setQrOptions((p) => ({ ...p, bgColor: e.target.value }))}
                    className="h-10 w-14 rounded border"
                    />
                    <Input value={qrOptions.bgColor} onChange={(e) => setQrOptions((p) => ({ ...p, bgColor: e.target.value }))} />
                </div>
                </Field>

                <Field label="Quiet Zone (Margin)">
                <select
                    className="w-full h-10 rounded-md border px-3 text-sm"
                    value={qrOptions.includeMargin ? "yes" : "no"}
                    onChange={(e) => setQrOptions((p) => ({ ...p, includeMargin: e.target.value === "yes" }))}
                >
                    <option value="yes">Include</option>
                    <option value="no">None</option>
                </select>
                </Field>
            </div>
            <hr />
          {/* Logo options */}
            <details className="space-y-3 mt-1">
                <summary className="flex items-center justify-between cursor-pointer rounded-md px-3 py-2 border hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-gray-600" />
                        <Label className="text-sm">Add Logo</Label>
                    </div>
                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                    </svg>
                </summary>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_LOGOS.map((l) => (
                        <button
                            key={l.name}
                            className={cn(
                                "border rounded-lg p-2 flex flex-col items-center gap-2 hover:shadow-md transition",
                                logoUrl === l.src ? "ring-2 ring-blue-300 border-blue-600" : ""
                            )}
                            onClick={() => setLogoUrl(l.src)}
                            title={l.name}
                        >
                            <img src={l.src} alt={l.name} className="h-8 w-8 object-contain" />
                            <span className="text-[11px] text-gray-700">{l.name}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <Field label="Logo URL">
                        <Input
                            placeholder="https://…/logo.png"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                        />
                    </Field>
                    <Field label={`Logo Size (${logoSize}px)`}>
                        <input
                            type="range"
                            min={16}
                            max={Math.max(48, Math.floor(qrOptions.size * 0.35))}
                            step={2}
                            value={logoSize}
                            onChange={(e) => setLogoSize(Number(e.target.value))}
                            className="w-full"
                        />
                    </Field>
                    <Field label={`Logo Radius (${logoRadius}px)`}>
                        <input
                            type="range"
                            min={0}
                            max={24}
                            step={1}
                            value={logoRadius}
                            onChange={(e) => setLogoRadius(Number(e.target.value))}
                            className="w-full"
                        />
                    </Field>
                </div>
            </details>
          </div>
        </div>

        {/* Right: Preview / Download */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-between">
            <QRPreview
                qrValue={qrValue}
                qrOptions={qrOptions}
                logoUrl={logoUrl}
                logoSize={logoSize}
                logoRadius={logoRadius}
                downloadPng={downloadPng}
                downloadSvg={downloadSvg}
                canvasRef={canvasRef}
                svgRef={svgRef}
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

// Helpers
function escapeQr(v: string) {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

function buildVCard(v: {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  note: string;
}) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${v.lastName};${v.firstName};;;`,
    `FN:${[v.firstName, v.lastName].filter(Boolean).join(" ")}`,
    v.organization ? `ORG:${v.organization}` : "",
    v.title ? `TITLE:${v.title}` : "",
    v.phone ? `TEL;TYPE=CELL:${v.phone}` : "",
    v.email ? `EMAIL;TYPE=INTERNET:${v.email}` : "",
    v.website ? `URL:${v.website}` : "",
    v.address ? `ADR;TYPE=HOME:;;${v.address};;;;` : "",
    v.note ? `NOTE:${v.note.replace(/\r?\n/g, "\\n")}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

function QRPreview(
    { qrValue, qrOptions, logoUrl, logoSize, logoRadius,
      canvasRef, svgRef,
      downloadPng, downloadSvg
    }: {
    qrValue: string;
    qrOptions: {
      size: number;
      fgColor: string;
      bgColor: string;
      level: "L" | "M" | "Q" | "H";
      includeMargin: boolean;
    };
    logoUrl: string;
    logoSize: number;
    logoRadius: number;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    svgRef: React.RefObject<SVGSVGElement | null>;
    downloadPng: () => void;
    downloadSvg: () => void;
}
) {

    return<>

          <div className="w-full text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            <p className="text-xs text-gray-500 mt-1 break-all line-clamp-2">
              { "Enter content to generate a QR code"}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div
              className="relative"
              style={{ width: qrOptions.size, height: qrOptions.size }}
            >
              {qrValue ? (
                <>
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={qrValue}
                    size={qrOptions.size}
                    level={qrOptions.level}
                    bgColor={qrOptions.bgColor}
                    fgColor={qrOptions.fgColor}
                    includeMargin={qrOptions.includeMargin}
                  />
                  {logoUrl ? (
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-white"
                      style={{ borderRadius: logoRadius }}
                    >
                      <img
                        src={logoUrl}
                        alt="logo"
                        className="object-contain"
                        style={{
                          width: logoSize,
                          height: logoSize,
                          borderRadius: logoRadius,
                        }}
                      />
                    </div>
                  ) : null}
                  {/* Hidden SVG for SVG download */}
                  <div className="hidden">
                    <QRCodeSVG
                      ref={svgRef}
                      value={qrValue}
                      size={qrOptions.size}
                      level={qrOptions.level}
                      bgColor={qrOptions.bgColor}
                      fgColor={qrOptions.fgColor}
                      includeMargin={qrOptions.includeMargin}
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500">
                  Enter content to generate a QR code
                </div>
              )}
              {qrValue ? null : (
                <div className="absolute inset-0" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={downloadPng} className="bg-blue-600 hover:bg-blue-700" disabled={!qrValue}>
                Download PNG
              </Button>
              <Button onClick={downloadSvg} variant="secondary" disabled={!qrValue}>
                Download SVG
              </Button>
            </div>
          </div>

          <div className="w-full mt-6 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-800">
            • Choose a content card above. • Add a logo via URL or quick presets.
          </div>
    </>
}

export default RouteComponent;
