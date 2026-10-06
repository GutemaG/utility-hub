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
  Send as TelegramIcon,
  MessageCircle as WhatsAppIcon,
  MapPin,
  LocateFixed,
  Upload,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSEO } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";
import { buildVCard } from "@/lib/vcard";
import { readAsDataUrl } from "@/lib/files";

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

type Level = "L" | "M" | "Q" | "H";

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
  { key: "pdf", label: "PDF", desc: "Link to a PDF", icon: FileTextIcon },
  { key: "telegram", label: "Telegram", desc: "Telegram link", icon: TelegramIcon },
  { key: "whatsapp", label: "WhatsApp", desc: "Chat link", icon: WhatsAppIcon },
  { key: "location", label: "Location", desc: "Map pin", icon: MapPin },
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
  { name: "Location", src: "/logos/location.svg" },
];

// Maximum bytes a QR code can hold at each error-correction level (version 40, byte mode)
const CAPACITY: Record<Level, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

function RouteComponent() {
  // Basic options
  const [qrOptions, setQrOptions] = useState({
    size: 288,
    fgColor: "#111827",
    bgColor: "#ffffff",
    level: "M" as Level,
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

  // WhatsApp inputs (separate from Phone so switching types doesn't share the number)
  const [whatsapp, setWhatsapp] = useState({ number: "", message: "" });

  // Location inputs
  const [location, setLocation] = useState({ lat: "", lng: "", link: "", format: "google" as "google" | "geo" });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // PDF input
  const [pdfUrl, setPdfUrl] = useState("");

  // Logo overlay
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoSize, setLogoSize] = useState<number>(56); // px
  const [logoRadius, setLogoRadius] = useState<number>(8); // px
  const logo = usePreparedLogo(logoUrl, logoSize, logoRadius, qrOptions.bgColor);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build the QR content. Returns "" until the required fields are filled in.
  const qrValue = useMemo(() => {
    switch (type) {
      case "text":
        return text.trim();
      case "url":
        return withScheme(url);
      case "wifi": {
        if (!wifi.ssid.trim()) return "";
        const T = wifi.encryption;
        const S = escapeQr(wifi.ssid);
        const P = escapeQr(wifi.password);
        const H = wifi.hidden ? "true" : "false";
        return `WIFI:T:${T};S:${S};${T !== "nopass" ? `P:${P};` : ""}H:${H};;`;
      }
      case "vcard": {
        const { firstName, lastName, organization, phone, email } = vcard;
        if (![firstName, lastName, organization, phone, email].some((v) => v.trim())) return "";
        return buildVCard(vcard);
      }
      case "email": {
        const to = email.to.trim();
        if (!to) return "";
        const q: string[] = [];
        if (email.subject.trim()) q.push(`subject=${encodeURIComponent(email.subject.trim())}`);
        if (email.body.trim()) q.push(`body=${encodeURIComponent(email.body.trim())}`);
        return `mailto:${to}${q.length ? `?${q.join("&")}` : ""}`;
      }
      case "sms": {
        const to = cleanPhone(sms.to);
        return to ? `SMSTO:${to}:${sms.message.trim()}` : "";
      }
      case "phone": {
        const number = cleanPhone(phone.number);
        return number ? `tel:${number}` : "";
      }
      case "facebook":
        return facebookLink(facebook.profileUrl);
      case "pdf":
        return withScheme(pdfUrl);
      case "telegram":
        return telegramLink(telegram.username);
      case "whatsapp": {
        const digits = whatsapp.number.replace(/\D/g, "");
        if (!digits) return "";
        const msg = whatsapp.message.trim();
        return `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
      }
      case "location":
        return locationValue(location);
      default:
        return "";
    }
  }, [type, text, url, wifi, vcard, email, sms, phone, facebook, pdfUrl, telegram, whatsapp, location]);

  const tooLong = new TextEncoder().encode(qrValue).length > CAPACITY[qrOptions.level];

  useSEO({
    title: "QR Code Generator | Utility Hub",
    description:
      "Create QR codes for Wi‑Fi, contact vCard, email, SMS, phone, WhatsApp, Telegram, location, PDF, Facebook, and more. Add a logo and customize colors and size.",
    path: "/qr-code-generator",
    applicationCategory: "Tool",
    featureList: [
      "Clickable content type cards",
      "Wi‑Fi, vCard, Email, SMS, Phone, PDF, Facebook",
      "Telegram, WhatsApp and map location",
      "Logo overlay from presets, upload or URL, included in downloads",
      "Color, size, and margin controls",
      "High error correction levels",
      "Export PNG and SVG",
    ],
  });

  const pickLogo = (src: string) => {
    setLogoUrl(src);
    // A logo hides part of the code, so give it the most error correction
    if (src) setQrOptions((p) => (p.level === "H" || p.level === "Q" ? p : { ...p, level: "H" }));
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocation((l) => ({
          ...l,
          link: "",
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => {
        setLocating(false);
        setLocationError(err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const onLocationLink = (value: string) => {
    const coords = parseCoordinates(value);
    setLocation((l) => (coords ? { ...l, link: value, lat: coords[0], lng: coords[1] } : { ...l, link: value }));
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const selectClass = "w-full h-10 rounded-md border bg-background px-3 text-sm";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
          QR Code Generator
        </h1>
        <p className="text-muted-foreground">
          Create QR codes for text, links, Wi‑Fi, contacts (vCard), email, SMS, phone, WhatsApp, Telegram, location and more. Add a logo and customize styles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left: Builder */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
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
                        : "border-border hover:border-ring hover:bg-accent/40 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active ? "text-blue-600" : "text-muted-foreground"
                        )}
                      />
                      <div className="text-sm font-medium">{c.label}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic content fields */}
          {type === "text" && (
            <Field label="Text">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter any text"
                className="min-h-[96px]"
              />
            </Field>
          )}

          {type === "url" && (
            <Field label="URL">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </Field>
          )}

          {type === "wifi" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Network name (SSID)">
                <Input
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  placeholder="Network name"
                />
              </Field>
              <Field label="Encryption">
                <select
                  className={selectClass}
                  value={wifi.encryption}
                  onChange={(e) =>
                    setWifi({ ...wifi, encryption: e.target.value as never })
                  }
                >
                  <option value="WPA">WPA/WPA2/WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </Field>
              <Field label="Password">
                <Input
                  value={wifi.password}
                  type="text"
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  placeholder={wifi.encryption === "nopass" ? "No password" : "Network password"}
                  disabled={wifi.encryption === "nopass"}
                />
              </Field>
              <Field label="Hidden network">
                <select
                  className={selectClass}
                  value={wifi.hidden ? "yes" : "no"}
                  onChange={(e) => setWifi({ ...wifi, hidden: e.target.value === "yes" })}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
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
              <Field label="Website">
                <Input value={vcard.website} onChange={(e) => setVcard({ ...vcard, website: e.target.value })} placeholder="https://" />
              </Field>
              <Field label="Address">
                <Input value={vcard.address} onChange={(e) => setVcard({ ...vcard, address: e.target.value })} placeholder="City, Region, Country" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Note">
                  <Textarea value={vcard.note} onChange={(e) => setVcard({ ...vcard, note: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-4">
              <Field label="To">
                <Input type="email" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} placeholder="name@example.com" />
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
            <Field label="Facebook Profile/Page URL or username">
              <Input value={facebook.profileUrl} onChange={(e) => setFacebook({ profileUrl: e.target.value })} placeholder="https://facebook.com/yourpage" />
            </Field>
          )}

          {type === "pdf" && (
            <div className="space-y-2">
              <Field label="PDF link">
                <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://example.com/file.pdf" />
              </Field>
              <p className="text-xs text-muted-foreground">
                A QR code can only point to a file that is online. Upload your PDF to Google Drive, Dropbox or your website,
                set it to "anyone with the link can view", and paste the link here.
              </p>
            </div>
          )}

          {type === "telegram" && (
            <Field label="Telegram username, channel or link">
              <Input value={telegram.username} onChange={(e) => setTelegram({ username: e.target.value })} placeholder="@yourusername or https://t.me/yourchannel" />
            </Field>
          )}

          {type === "whatsapp" && (
            <div className="space-y-4">
              <Field label="WhatsApp number (with country code)">
                <Input value={whatsapp.number} onChange={(e) => setWhatsapp({ ...whatsapp, number: e.target.value })} placeholder="+251 91 234 5678" />
              </Field>
              {/^\s*0/.test(whatsapp.number) ? (
                <p className="text-xs text-amber-600">
                  WhatsApp links need the country code instead of the leading 0, e.g. 0912345678 → +251912345678.
                </p>
              ) : null}
              <Field label="Pre-filled message (optional)">
                <Textarea value={whatsapp.message} onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })} className="min-h-[72px]" />
              </Field>
            </div>
          )}

          {type === "location" && (
            <div className="space-y-4">
              <Field label="Google Maps link or coordinates">
                <Input
                  value={location.link}
                  onChange={(e) => onLocationLink(e.target.value)}
                  placeholder="https://maps.google.com/... or 9.0108, 38.7613"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <Input inputMode="decimal" value={location.lat} onChange={(e) => setLocation({ ...location, link: "", lat: e.target.value })} placeholder="9.0108" />
                </Field>
                <Field label="Longitude">
                  <Input inputMode="decimal" value={location.lng} onChange={(e) => setLocation({ ...location, link: "", lng: e.target.value })} placeholder="38.7613" />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" onClick={locateMe} disabled={locating}>
                  <LocateFixed className="h-4 w-4" /> {locating ? "Finding you…" : "Use my current location"}
                </Button>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  aria-label="Link type"
                  value={location.format}
                  onChange={(e) => setLocation({ ...location, format: e.target.value as "google" | "geo" })}
                >
                  <option value="google">Google Maps link (works on every phone)</option>
                  <option value="geo">geo: link (opens the phone's map app)</option>
                </select>
              </div>
              {locationError ? <p className="text-sm text-red-600">{locationError}</p> : null}
              {location.link && !parseCoordinates(location.link) && /^https?:\/\//i.test(location.link.trim()) ? (
                <p className="text-xs text-muted-foreground">No coordinates in this link, so the QR code will open the link as it is.</p>
              ) : null}
            </div>
          )}

          <div>
            <hr />
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 my-2">
              <Field label={`Size (${qrOptions.size}px)`}>
                <input
                  type="range"
                  min={192}
                  max={512}
                  step={16}
                  value={qrOptions.size}
                  onChange={(e) => setQrOptions((p) => ({ ...p, size: Number(e.target.value) }))}
                  className="w-full"
                />
              </Field>

              <Field label="Error Correction">
                <select
                  className={selectClass}
                  value={qrOptions.level}
                  onChange={(e) => setQrOptions((p) => ({ ...p, level: e.target.value as Level }))}
                >
                  <option value="L">L (Low)</option>
                  <option value="M">M (Medium)</option>
                  <option value="Q">Q (Quartile)</option>
                  <option value="H">H (High, best with a logo)</option>
                </select>
              </Field>

              <Field label="Foreground">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={qrOptions.fgColor}
                    onChange={(e) => setQrOptions((p) => ({ ...p, fgColor: e.target.value }))}
                    className="h-10 w-14 rounded border"
                    aria-label="Foreground colour"
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
                    aria-label="Background colour"
                  />
                  <Input value={qrOptions.bgColor} onChange={(e) => setQrOptions((p) => ({ ...p, bgColor: e.target.value }))} />
                </div>
              </Field>

              <Field label="Quiet Zone (Margin)">
                <select
                  className={selectClass}
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
            <details className="space-y-3 mt-1" open={!!logoUrl || undefined}>
              <summary className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Add Logo</span>
                </div>
                <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </summary>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {PRESET_LOGOS.map((l) => (
                  <button
                    key={l.name}
                    className={cn(
                      "border rounded-lg p-2 flex flex-col items-center gap-2 hover:shadow-md transition",
                      logoUrl === l.src ? "ring-2 ring-blue-300 border-blue-600" : ""
                    )}
                    onClick={() => pickLogo(l.src)}
                    title={l.name}
                  >
                    <img src={l.src} alt="" className="h-8 w-8 object-contain" />
                    <span className="text-[11px] text-foreground">{l.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent/50">
                  <Upload className="h-4 w-4" /> Upload your logo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) pickLogo(await readAsDataUrl(file));
                    }}
                  />
                </label>
                {logoUrl ? (
                  <Button variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
                    <X className="h-4 w-4" /> Remove logo
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <Field label="Logo URL">
                  <Input
                    placeholder={logoUrl.startsWith("data:") ? "Using your uploaded image" : "https://…/logo.png"}
                    value={logoUrl.startsWith("data:") ? "" : logoUrl}
                    onChange={(e) => pickLogo(e.target.value.trim())}
                  />
                </Field>
                <Field label={`Logo Size (${logoSize}px)`}>
                  <input
                    type="range"
                    min={24}
                    max={Math.floor(qrOptions.size * 0.3)}
                    step={2}
                    value={Math.min(logoSize, Math.floor(qrOptions.size * 0.3))}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="w-full"
                  />
                </Field>
                <Field label={`Logo Radius (${logoRadius}px)`}>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={logoRadius}
                    onChange={(e) => setLogoRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </Field>
              </div>
              {logo.error ? <p className="text-sm text-red-600">{logo.error}</p> : null}
            </details>
          </div>
        </div>

        {/* Right: Preview / Download */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <QRPreview
            qrValue={tooLong ? "" : qrValue}
            message={tooLong ? `Too much content for one QR code (max ${CAPACITY[qrOptions.level]} bytes at level ${qrOptions.level}). Shorten it or lower the error correction.` : null}
            qrOptions={qrOptions}
            logo={logo.dataUrl ? { src: logo.dataUrl, size: Math.min(logoSize, Math.floor(qrOptions.size * 0.3)) } : null}
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
  const id = React.useId();
  const ref = useRef<HTMLDivElement>(null);
  // Name the first control after the label so screen readers announce it
  useEffect(() => {
    const control = ref.current?.querySelector<HTMLElement>("input, select, textarea");
    if (control && !control.hasAttribute("aria-label") && !control.hasAttribute("aria-labelledby")) {
      control.setAttribute("aria-labelledby", id);
    }
  });
  return (
    <div className="space-y-2" ref={ref}>
      <Label id={id}>{label}</Label>
      {children}
    </div>
  );
}

// Helpers
function escapeQr(v: string) {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

function withScheme(v: string) {
  const s = v.trim();
  if (!s) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
}

function cleanPhone(v: string) {
  return v.replace(/[^\d+*#]/g, "");
}

function facebookLink(v: string) {
  const s = v.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\//i.test(s)) return `https://${s}`;
  return `https://facebook.com/${s.replace(/^@/, "")}`;
}

function telegramLink(v: string) {
  const s = v
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me|telegram\.dog)\//i, "")
    .replace(/^@/, "");
  return s ? `https://t.me/${s}` : "";
}

/** Find "lat, lng" in plain text or a Google/Apple/OSM maps URL. */
function parseCoordinates(v: string): [string, string] | null {
  const s = decodeURIComponent(v.trim());
  const patterns = [
    /@(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/, // google.com/maps/@9.01,38.76,15z
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/, // google place data
    /[?&](?:q|query|ll|daddr|destination)=(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/, // ?q=9.01,38.76
    /^geo:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/i,
    /^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/, // 9.01, 38.76
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m && Math.abs(Number(m[1])) <= 90 && Math.abs(Number(m[2])) <= 180) return [m[1], m[2]];
  }
  return null;
}

function locationValue(loc: { lat: string; lng: string; link: string; format: "google" | "geo" }) {
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  const valid = loc.lat.trim() !== "" && loc.lng.trim() !== "" && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (valid) {
    return loc.format === "geo" ? `geo:${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  // A short maps link (maps.app.goo.gl/...) has no coordinates, so encode it as it is
  return /^https?:\/\//i.test(loc.link.trim()) ? loc.link.trim() : "";
}

/**
 * Draw the logo onto a rounded tile in the QR background colour and return it as a data URL.
 * qrcode.react then paints it into both the canvas and the SVG, so it is part of the downloads.
 */
function usePreparedLogo(src: string, size: number, radius: number, background: string) {
  const [state, setState] = useState<{ dataUrl: string | null; error: string | null }>({ dataUrl: null, error: null });

  useEffect(() => {
    if (!src) {
      setState({ dataUrl: null, error: null });
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        try {
          const scale = 4; // draw at 4× so the logo stays sharp when the PNG is zoomed
          const px = size * scale;
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = px;
          const ctx = canvas.getContext("2d")!;
          const r = Math.min(radius * scale, px / 2);
          ctx.fillStyle = background;
          ctx.beginPath();
          ctx.roundRect(0, 0, px, px, r);
          ctx.fill();
          const pad = px * 0.08;
          const inner = px - pad * 2;
          const fit = Math.min(inner / (img.naturalWidth || inner), inner / (img.naturalHeight || inner));
          const w = (img.naturalWidth || inner) * fit;
          const h = (img.naturalHeight || inner) * fit;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pad, pad, inner, inner, Math.max(0, r - pad));
          ctx.clip();
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
          ctx.restore();
          setState({ dataUrl: canvas.toDataURL("image/png"), error: null });
        } catch {
          // The image loaded but its server doesn't allow it to be copied into a download
          setState({ dataUrl: null, error: "This website doesn't allow its image to be used. Download the logo and use “Upload your logo” instead." });
        }
      };
      img.onerror = () => {
        if (!cancelled) setState({ dataUrl: null, error: "Could not load this logo. Check the link, or download it and use “Upload your logo” instead." });
      };
      img.src = src;
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [src, size, radius, background]);

  return state;
}

function QRPreview(
  { qrValue, message, qrOptions, logo,
    canvasRef, svgRef,
    downloadPng, downloadSvg
  }: {
    qrValue: string;
    message: string | null;
    qrOptions: {
      size: number;
      fgColor: string;
      bgColor: string;
      level: Level;
      includeMargin: boolean;
    };
    logo: { src: string; size: number } | null;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    svgRef: React.RefObject<SVGSVGElement | null>;
    downloadPng: () => void;
    downloadSvg: () => void;
  }
) {
  const imageSettings = logo ? { src: logo.src, width: logo.size, height: logo.size, excavate: true } : undefined;

  return <>
    <div className="w-full text-center mb-4">
      <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
      <p className="mt-1 line-clamp-2 break-all text-xs text-muted-foreground" data-testid="qr-value">
        {qrValue || "Enter content to generate a QR code"}
      </p>
    </div>

    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="relative max-w-full"
        style={{ width: qrOptions.size, aspectRatio: "1 / 1" }}
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
              imageSettings={imageSettings}
              style={{ width: "100%", height: "100%" }}
            />
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
                imageSettings={imageSettings}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            {message ?? "Enter content to generate a QR code"}
          </div>
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

    <div className="mt-6 w-full rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 p-4 text-sm text-indigo-700 dark:text-indigo-200">
      • Choose a content card above. • Add a logo from the presets or upload your own; it's included in the PNG and SVG downloads.
      • Always test-scan the code with your phone before printing.
    </div>
  </>
}

export default RouteComponent;
