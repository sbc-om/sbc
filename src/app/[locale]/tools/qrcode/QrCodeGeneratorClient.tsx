"use client";

import Image from "next/image";
import React from "react";
import {
  AtSign,
  Copy,
  Download,
  Globe,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  TextCursorInput,
  UserRound,
  Wifi,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type QrType =
  | "url"
  | "text"
  | "wifi"
  | "phone"
  | "sms"
  | "email"
  | "whatsapp"
  | "location"
  | "vcard";
type WifiSecurity = "WPA" | "WEP" | "nopass";
type ErrorLevel = "L" | "M" | "Q" | "H";

type BuildResult = {
  value: string;
  reason: string | null;
};

type VCardData = {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  note: string;
};

type TypeOption = {
  id: QrType;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelAr: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  { id: "url", icon: Link2, labelEn: "Link URL", labelAr: "رابط" },
  { id: "text", icon: TextCursorInput, labelEn: "Plain Text", labelAr: "نص" },
  { id: "wifi", icon: Wifi, labelEn: "Wi-Fi", labelAr: "واي فاي" },
  { id: "phone", icon: Phone, labelEn: "Phone", labelAr: "هاتف" },
  { id: "sms", icon: MessageSquare, labelEn: "SMS", labelAr: "رسالة SMS" },
  { id: "email", icon: AtSign, labelEn: "Email", labelAr: "بريد إلكتروني" },
  { id: "whatsapp", icon: MessageSquare, labelEn: "WhatsApp", labelAr: "واتساب" },
  { id: "location", icon: MapPin, labelEn: "Location", labelAr: "موقع" },
  { id: "vcard", icon: UserRound, labelEn: "Contact vCard", labelAr: "جهة اتصال" },
];

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-zA-Z]{2,}/.test(trimmed) || trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const keepPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return keepPlus ? `+${digits}` : digits;
}

function normalizeWhatsappPhone(value: string): string {
  return value.replace(/\D/g, "");
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:\"])/g, "\\$1");
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function getTypeLabel(type: QrType, ar: boolean): string {
  const match = TYPE_OPTIONS.find((item) => item.id === type);
  if (!match) return type;
  return ar ? match.labelAr : match.labelEn;
}

function makeFileSafe(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function QrCodeGeneratorClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const rtl = localeDir(locale) === "rtl";

  const [qrType, setQrType] = React.useState<QrType>("url");

  const [urlValue, setUrlValue] = React.useState("https://sbc.om");
  const [textValue, setTextValue] = React.useState("");

  const [wifiSsid, setWifiSsid] = React.useState("");
  const [wifiPassword, setWifiPassword] = React.useState("");
  const [wifiSecurity, setWifiSecurity] = React.useState<WifiSecurity>("WPA");
  const [wifiHidden, setWifiHidden] = React.useState(false);

  const [phoneValue, setPhoneValue] = React.useState("");
  const [smsPhone, setSmsPhone] = React.useState("");
  const [smsMessage, setSmsMessage] = React.useState("");

  const [emailAddress, setEmailAddress] = React.useState("");
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailBody, setEmailBody] = React.useState("");

  const [waPhone, setWaPhone] = React.useState("");
  const [waMessage, setWaMessage] = React.useState("");

  const [locationLat, setLocationLat] = React.useState("");
  const [locationLng, setLocationLng] = React.useState("");
  const [locationLabel, setLocationLabel] = React.useState("");

  const [vcard, setVcard] = React.useState<VCardData>({
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

  const [errorLevel, setErrorLevel] = React.useState<ErrorLevel>("M");
  const [margin, setMargin] = React.useState(2);
  const [foregroundColor, setForegroundColor] = React.useState("#111827");
  const [backgroundColor, setBackgroundColor] = React.useState("#ffffff");
  const [transparentBg, setTransparentBg] = React.useState(false);
  const [downloadSize, setDownloadSize] = React.useState<1024 | 2048 | 4096>(2048);

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [svgString, setSvgString] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = React.useState(false);
  const [isDownloadingSvg, setIsDownloadingSvg] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const qrConfig = React.useMemo(
    () => ({
      errorCorrectionLevel: errorLevel,
      margin,
      color: {
        dark: foregroundColor,
        light: transparentBg ? "#0000" : backgroundColor,
      },
    }),
    [backgroundColor, errorLevel, foregroundColor, margin, transparentBg],
  );

  const buildResult = React.useMemo<BuildResult>(() => {
    if (qrType === "url") {
      const normalized = normalizeUrl(urlValue);
      return normalized
        ? { value: normalized, reason: null }
        : { value: "", reason: ar ? "لطفاً لینک را وارد کنید." : "Enter a URL first." };
    }

    if (qrType === "text") {
      const trimmed = textValue.trim();
      return trimmed
        ? { value: textValue, reason: null }
        : { value: "", reason: ar ? "متن خالی است." : "Text is empty." };
    }

    if (qrType === "wifi") {
      const ssid = wifiSsid.trim();
      if (!ssid) {
        return { value: "", reason: ar ? "نام شبکه Wi-Fi لازم است." : "Wi-Fi SSID is required." };
      }
      const parts = [`WIFI:T:${wifiSecurity};`, `S:${escapeWifi(ssid)};`];
      if (wifiSecurity !== "nopass" && wifiPassword.trim()) {
        parts.push(`P:${escapeWifi(wifiPassword.trim())};`);
      }
      if (wifiHidden) {
        parts.push("H:true;");
      }
      parts.push(";");
      return { value: parts.join(""), reason: null };
    }

    if (qrType === "phone") {
      const normalized = normalizePhone(phoneValue);
      return normalized
        ? { value: `tel:${normalized}`, reason: null }
        : { value: "", reason: ar ? "شماره موبایل معتبر وارد کنید." : "Enter a valid phone number." };
    }

    if (qrType === "sms") {
      const normalized = normalizePhone(smsPhone);
      if (!normalized) {
        return {
          value: "",
          reason: ar ? "برای SMS شماره موبایل وارد کنید." : "Enter a phone number for SMS.",
        };
      }
      return { value: `SMSTO:${normalized}:${smsMessage.trim()}`, reason: null };
    }

    if (qrType === "email") {
      const email = emailAddress.trim();
      if (!email) {
        return { value: "", reason: ar ? "آدرس ایمیل لازم است." : "Email address is required." };
      }
      const params = new URLSearchParams();
      if (emailSubject.trim()) params.set("subject", emailSubject.trim());
      if (emailBody.trim()) params.set("body", emailBody.trim());
      const query = params.toString();
      return { value: query ? `mailto:${email}?${query}` : `mailto:${email}`, reason: null };
    }

    if (qrType === "whatsapp") {
      const normalized = normalizeWhatsappPhone(waPhone);
      if (!normalized) {
        return {
          value: "",
          reason: ar ? "شماره واتساب را وارد کنید." : "Enter a WhatsApp phone number.",
        };
      }
      const message = waMessage.trim();
      const query = message ? `?text=${encodeURIComponent(message)}` : "";
      return { value: `https://wa.me/${normalized}${query}`, reason: null };
    }

    if (qrType === "location") {
      const lat = Number(locationLat);
      const lng = Number(locationLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
          value: "",
          reason: ar ? "عرض و طول جغرافیایی معتبر وارد کنید." : "Enter valid latitude and longitude.",
        };
      }
      const hasLabel = locationLabel.trim().length > 0;
      if (!hasLabel) {
        return { value: `geo:${lat},${lng}`, reason: null };
      }
      const labelQuery = encodeURIComponent(`${lat},${lng}(${locationLabel.trim()})`);
      return { value: `geo:${lat},${lng}?q=${labelQuery}`, reason: null };
    }

    const fullName = `${vcard.firstName} ${vcard.lastName}`.trim();
    if (!fullName && !vcard.phone.trim() && !vcard.email.trim() && !vcard.organization.trim()) {
      return {
        value: "",
        reason: ar
          ? "حداقل یک مورد (نام یا تلفن یا ایمیل یا سازمان) وارد کنید."
          : "Enter at least one contact value (name, phone, email, or organization).",
      };
    }

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCard(vcard.lastName.trim())};${escapeVCard(vcard.firstName.trim())};;;`,
      `FN:${escapeVCard(fullName || (ar ? "مخاطب" : "Contact"))}`,
      vcard.organization.trim() ? `ORG:${escapeVCard(vcard.organization.trim())}` : "",
      vcard.title.trim() ? `TITLE:${escapeVCard(vcard.title.trim())}` : "",
      vcard.phone.trim() ? `TEL;TYPE=CELL:${escapeVCard(normalizePhone(vcard.phone))}` : "",
      vcard.email.trim() ? `EMAIL:${escapeVCard(vcard.email.trim())}` : "",
      vcard.website.trim() ? `URL:${escapeVCard(normalizeUrl(vcard.website))}` : "",
      vcard.address.trim() ? `ADR:;;${escapeVCard(vcard.address.trim())};;;;` : "",
      vcard.note.trim() ? `NOTE:${escapeVCard(vcard.note.trim())}` : "",
      "END:VCARD",
    ].filter(Boolean);

    return { value: lines.join("\n"), reason: null };
  }, [
    ar,
    emailAddress,
    emailBody,
    emailSubject,
    locationLabel,
    locationLat,
    locationLng,
    phoneValue,
    qrType,
    smsMessage,
    smsPhone,
    textValue,
    urlValue,
    vcard,
    waMessage,
    waPhone,
    wifiHidden,
    wifiPassword,
    wifiSecurity,
    wifiSsid,
  ]);

  const payload = buildResult.value;

  React.useEffect(() => {
    let cancelled = false;

    if (!payload) {
      setPreviewUrl(null);
      setSvgString("");
      setErrorMessage(null);
      setIsGenerating(false);
      return () => {
        cancelled = true;
      };
    }

    setIsGenerating(true);

    const run = async () => {
      try {
        const qr = await import("qrcode");
        const [dataUrl, svg] = await Promise.all([
          qr.toDataURL(payload, {
            ...qrConfig,
            width: 760,
          }),
          qr.toString(payload, {
            ...qrConfig,
            width: 1400,
            type: "svg",
          }),
        ]);

        if (cancelled) return;
        setPreviewUrl(dataUrl);
        setSvgString(svg);
        setErrorMessage(null);
      } catch {
        if (cancelled) return;
        setPreviewUrl(null);
        setSvgString("");
        setErrorMessage(ar ? "ساخت QR با خطا مواجه شد." : "Failed to generate QR code.");
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [ar, payload, qrConfig]);

  const fileBaseName = React.useMemo(() => {
    const typeLabel = makeFileSafe(qrType);
    const dateTag = new Date().toISOString().slice(0, 10);
    return `qr-${typeLabel}-${dateTag}`;
  }, [qrType]);

  function triggerDownload(href: string, fileName: string, revokeObjectUrl: boolean) {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    if (revokeObjectUrl) {
      window.setTimeout(() => {
        URL.revokeObjectURL(href);
      }, 300);
    }
  }

  async function handleDownloadPng() {
    if (!payload) return;

    setIsDownloadingPng(true);
    try {
      const qr = await import("qrcode");
      const dataUrl = await qr.toDataURL(payload, {
        ...qrConfig,
        width: downloadSize,
      });
      triggerDownload(dataUrl, `${fileBaseName}-${downloadSize}px.png`, false);
      setErrorMessage(null);
    } catch {
      setErrorMessage(ar ? "دانلود PNG ناموفق بود." : "PNG download failed.");
    } finally {
      setIsDownloadingPng(false);
    }
  }

  async function handleDownloadSvg() {
    if (!payload) return;

    setIsDownloadingSvg(true);
    try {
      const qr = await import("qrcode");
      const svg =
        svgString ||
        (await qr.toString(payload, {
          ...qrConfig,
          width: downloadSize,
          type: "svg",
        }));

      const blob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, `${fileBaseName}.svg`, true);
      setErrorMessage(null);
    } catch {
      setErrorMessage(ar ? "دانلود SVG ناموفق بود." : "SVG download failed.");
    } finally {
      setIsDownloadingSvg(false);
    }
  }

  async function handleCopyPayload() {
    if (!payload) return;

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setErrorMessage(null);
      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      setCopied(false);
      setErrorMessage(ar ? "کپی انجام نشد." : "Copy failed.");
    }
  }

  function renderTypeSpecificForm() {
    if (qrType === "url") {
      return (
        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "لینک" : "URL"}</label>
          <Input
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder={ar ? "https://example.com" : "https://example.com"}
          />
        </div>
      );
    }

    if (qrType === "text") {
      return (
        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "متن" : "Text"}</label>
          <Textarea
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            placeholder={
              ar
                ? "متن دلخواه خود را وارد کنید..."
                : "Write any plain text you want encoded..."
            }
            className="min-h-32"
          />
        </div>
      );
    }

    if (qrType === "wifi") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "نام شبکه (SSID)" : "Wi-Fi Name (SSID)"}</label>
            <Input
              value={wifiSsid}
              onChange={(event) => setWifiSsid(event.target.value)}
              placeholder={ar ? "مثال: Office-Wifi" : "Example: Office-Wifi"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{ar ? "نوع امنیت" : "Security"}</label>
              <select
                value={wifiSecurity}
                onChange={(event) => setWifiSecurity(event.target.value as WifiSecurity)}
                className="h-12 w-full rounded-xl border-2 border-(--surface-border) bg-(--background) px-3 text-sm text-foreground outline-none"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">{ar ? "بدون رمز" : "No Password"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">{ar ? "رمز عبور" : "Password"}</label>
              <Input
                value={wifiPassword}
                onChange={(event) => setWifiPassword(event.target.value)}
                placeholder={ar ? "اختیاری برای شبکه باز" : "Optional for open network"}
                disabled={wifiSecurity === "nopass"}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-(--muted-foreground)">
            <input
              type="checkbox"
              checked={wifiHidden}
              onChange={(event) => setWifiHidden(event.target.checked)}
              className="h-4 w-4 rounded border border-(--surface-border)"
            />
            {ar ? "شبکه مخفی است" : "Hidden network"}
          </label>
        </div>
      );
    }

    if (qrType === "phone") {
      return (
        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "شماره موبایل" : "Mobile Number"}</label>
          <Input
            value={phoneValue}
            onChange={(event) => setPhoneValue(event.target.value)}
            placeholder={ar ? "+9689XXXXXXX" : "+9689XXXXXXX"}
          />
        </div>
      );
    }

    if (qrType === "sms") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "شماره موبایل" : "Mobile Number"}</label>
            <Input
              value={smsPhone}
              onChange={(event) => setSmsPhone(event.target.value)}
              placeholder={ar ? "+9689XXXXXXX" : "+9689XXXXXXX"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "متن پیام" : "SMS Message"}</label>
            <Textarea
              value={smsMessage}
              onChange={(event) => setSmsMessage(event.target.value)}
              placeholder={ar ? "متن پیام را وارد کنید..." : "Type SMS body..."}
              className="min-h-28"
            />
          </div>
        </div>
      );
    }

    if (qrType === "email") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "ایمیل" : "Email"}</label>
            <Input
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "موضوع" : "Subject"}</label>
            <Input
              value={emailSubject}
              onChange={(event) => setEmailSubject(event.target.value)}
              placeholder={ar ? "موضوع ایمیل" : "Email subject"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "متن" : "Body"}</label>
            <Textarea
              value={emailBody}
              onChange={(event) => setEmailBody(event.target.value)}
              placeholder={ar ? "متن ایمیل" : "Email body"}
              className="min-h-24"
            />
          </div>
        </div>
      );
    }

    if (qrType === "whatsapp") {
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "شماره واتساب" : "WhatsApp Number"}</label>
            <Input
              value={waPhone}
              onChange={(event) => setWaPhone(event.target.value)}
              placeholder={ar ? "9689XXXXXXX" : "9689XXXXXXX"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "پیام (اختیاری)" : "Message (optional)"}</label>
            <Textarea
              value={waMessage}
              onChange={(event) => setWaMessage(event.target.value)}
              placeholder={ar ? "متن اولیه گفتگو" : "Prefilled message"}
              className="min-h-24"
            />
          </div>
        </div>
      );
    }

    if (qrType === "location") {
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{ar ? "Latitude" : "Latitude"}</label>
              <Input
                value={locationLat}
                onChange={(event) => setLocationLat(event.target.value)}
                placeholder="23.5880"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{ar ? "Longitude" : "Longitude"}</label>
              <Input
                value={locationLng}
                onChange={(event) => setLocationLng(event.target.value)}
                placeholder="58.3829"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "عنوان مکان" : "Location Label"}</label>
            <Input
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder={ar ? "مثال: فروشگاه مرکزی" : "Example: Main Store"}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "نام" : "First Name"}</label>
            <Input
              value={vcard.firstName}
              onChange={(event) => setVcard((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder={ar ? "نام" : "First name"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "نام خانوادگی" : "Last Name"}</label>
            <Input
              value={vcard.lastName}
              onChange={(event) => setVcard((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder={ar ? "نام خانوادگی" : "Last name"}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "سازمان" : "Organization"}</label>
            <Input
              value={vcard.organization}
              onChange={(event) => setVcard((prev) => ({ ...prev, organization: event.target.value }))}
              placeholder={ar ? "نام شرکت" : "Company"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "عنوان شغلی" : "Job Title"}</label>
            <Input
              value={vcard.title}
              onChange={(event) => setVcard((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={ar ? "عنوان" : "Title"}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "موبایل" : "Phone"}</label>
            <Input
              value={vcard.phone}
              onChange={(event) => setVcard((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder={ar ? "+9689XXXXXXX" : "+9689..."}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">{ar ? "ایمیل" : "Email"}</label>
            <Input
              value={vcard.email}
              onChange={(event) => setVcard((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "وب‌سایت" : "Website"}</label>
          <Input
            value={vcard.website}
            onChange={(event) => setVcard((prev) => ({ ...prev, website: event.target.value }))}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "آدرس" : "Address"}</label>
          <Input
            value={vcard.address}
            onChange={(event) => setVcard((prev) => ({ ...prev, address: event.target.value }))}
            placeholder={ar ? "نشانی" : "Address"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">{ar ? "یادداشت" : "Note"}</label>
          <Textarea
            value={vcard.note}
            onChange={(event) => setVcard((prev) => ({ ...prev, note: event.target.value }))}
            placeholder={ar ? "توضیح اضافی" : "Extra notes"}
            className="min-h-20"
          />
        </div>
      </div>
    );
  }

  const availabilityText = buildResult.reason
    ? buildResult.reason
    : ar
      ? "QR آماده دانلود با کیفیت بالا"
      : "QR ready for high-quality download";

  const payloadLabel = `${ar ? "محتوا" : "Payload"} (${getTypeLabel(qrType, ar)})`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-(--surface-border) bg-(--surface) px-5 py-6 shadow-[var(--shadow)] backdrop-blur sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className={rtl ? "relative text-right" : "relative text-left"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-(--chip-border) bg-(--chip-bg) px-3 py-1 text-xs font-semibold text-(--chip-foreground)">
            <QrCode className="h-3.5 w-3.5" />
            <span>{ar ? "QR Studio" : "QR Studio"}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {ar ? "سازنده حرفه‌ای QR Code" : "Professional QR Code Generator"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-(--muted-foreground) sm:text-base">
            {ar
              ? "لینک، متن، وای‌فای، موبایل، ایمیل، واتساب، لوکیشن و vCard بسازید. خروجی PNG و SVG با رزولوشن بالا دانلود کنید."
              : "Create QR for links, text, Wi-Fi, phone, email, WhatsApp, location, and vCard. Download crisp PNG and SVG outputs."}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="sbc-card rounded-3xl p-4 sm:p-6">
          <div className="-mx-1 overflow-x-auto pb-1 md:mx-0 md:overflow-visible">
            <div className="flex min-w-max gap-2 px-1 md:grid md:min-w-0 md:grid-cols-3 md:px-0 xl:grid-cols-4 2xl:grid-cols-5">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = option.id === qrType;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setQrType(option.id)}
                    className={[
                      "inline-flex min-w-[9.25rem] items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition md:min-w-0",
                      active
                        ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                        : "border-(--surface-border) bg-(--background) text-foreground hover:bg-(--chip-bg)",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ar ? option.labelAr : option.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-(--surface-border) bg-(--background) p-4 sm:p-5">
            {renderTypeSpecificForm()}
          </div>

          <div className="mt-7 rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4">
            <h2 className="text-sm font-semibold">{ar ? "تنظیمات کیفیت" : "Quality Settings"}</h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "Error correction" : "Error correction"}</label>
                <select
                  value={errorLevel}
                  onChange={(event) => setErrorLevel(event.target.value as ErrorLevel)}
                  className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--background) px-3 text-sm text-foreground"
                >
                  <option value="L">L (~7%)</option>
                  <option value="M">M (~15%)</option>
                  <option value="Q">Q (~25%)</option>
                  <option value="H">H (~30%)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "حاشیه" : "Margin"}</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={margin}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next)) {
                      const clamped = Math.min(10, Math.max(0, Math.trunc(next)));
                      setMargin(clamped);
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "رنگ کد" : "Code color"}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(event) => setForegroundColor(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-xl border border-(--surface-border) bg-transparent p-1"
                    aria-label={ar ? "رنگ کد" : "Code color"}
                  />
                  <Input
                    value={foregroundColor}
                    onChange={(event) => setForegroundColor(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "رنگ پس‌زمینه" : "Background"}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-xl border border-(--surface-border) bg-transparent p-1"
                    aria-label={ar ? "رنگ پس‌زمینه" : "Background color"}
                    disabled={transparentBg}
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(event) => setBackgroundColor(event.target.value)}
                    disabled={transparentBg}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "رزولوشن دانلود" : "Download resolution"}</label>
                <select
                  value={String(downloadSize)}
                  onChange={(event) => setDownloadSize(Number(event.target.value) as 1024 | 2048 | 4096)}
                  className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--background) px-3 text-sm text-foreground"
                >
                  <option value="1024">1024px</option>
                  <option value="2048">2048px</option>
                  <option value="4096">4096px</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{ar ? "شفاف" : "Transparency"}</label>
                <label className="inline-flex h-11 w-full items-center gap-2 rounded-xl border border-(--surface-border) bg-(--background) px-3 text-sm text-(--muted-foreground)">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(event) => setTransparentBg(event.target.checked)}
                    className="h-4 w-4 rounded border border-(--surface-border)"
                  />
                  {ar ? "پس‌زمینه شفاف" : "Transparent background"}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="sbc-card rounded-3xl p-4 sm:p-5 xl:sticky xl:top-24 xl:h-fit">
          <div className={rtl ? "text-right" : "text-left"}>
            <h2 className="text-base font-semibold">{ar ? "پیش‌نمایش" : "Preview"}</h2>
            <p className="mt-1 text-xs text-(--muted-foreground)">{availabilityText}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-(--surface-border) p-4">
            <div
              className="mx-auto flex h-[17rem] w-full max-w-[18rem] items-center justify-center rounded-2xl border border-(--surface-border) bg-(--background) p-3 sm:h-72"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(148,163,184,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.12) 75%)",
                backgroundSize: "18px 18px",
                backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0px",
              }}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Generated QR"
                  width={360}
                  height={360}
                  unoptimized
                  className="h-full w-full rounded-lg object-contain"
                />
              ) : (
                <div className="text-center text-sm text-(--muted-foreground)">
                  {isGenerating
                    ? ar
                      ? "در حال ساخت QR..."
                      : "Generating QR..."
                    : ar
                      ? "ابتدا اطلاعات را وارد کنید"
                      : "Enter your data to generate"}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPng}
              disabled={!payload || isDownloadingPng}
              className="w-full justify-center"
            >
              <Download className="h-4 w-4" />
              {isDownloadingPng
                ? ar
                  ? "در حال آماده‌سازی..."
                  : "Preparing..."
                : ar
                  ? "دانلود PNG"
                  : "Download PNG"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSvg}
              disabled={!payload || isDownloadingSvg}
              className="w-full justify-center"
            >
              <Globe className="h-4 w-4" />
              {isDownloadingSvg ? (ar ? "در حال آماده‌سازی..." : "Preparing...") : "Download SVG"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPayload}
              disabled={!payload}
              className="w-full justify-center"
            >
              <Copy className="h-4 w-4" />
              {copied ? (ar ? "کپی شد" : "Copied") : ar ? "کپی محتوا" : "Copy payload"}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
              {payloadLabel}
            </label>
            <Textarea
              value={payload}
              readOnly
              className="min-h-28 bg-(--background) font-mono text-xs leading-5"
            />
          </div>

          {errorMessage ? (
            <div className="mt-3 rounded-xl border border-red-400/35 bg-red-500/8 px-3 py-2 text-xs text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
