"use client";

import Link from "next/link";
import {
  Bot,
  QrCode,
  CandlestickChart,
  FileText,
  Wrench,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";

interface Tool {
  key: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  tone: "accent" | "accent-2";
  badge?: string;
}

export function ToolsListClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const dir = localeDir(locale);

  const tools: Tool[] = [
    {
      key: "qrcode",
      href: `/${locale}/tools/qrcode`,
      icon: <QrCode className="h-7 w-7" />,
      label: ar ? "مولد QR" : "QR Generator",
      description: ar
        ? "إنشاء رموز QR احترافية للروابط، النصوص، الواي فاي، الهاتف، البريد والموقع الجغرافي مع تنزيل بجودة عالية."
        : "Create professional QR codes for URLs, text, Wi-Fi, phone, email, and location with high-quality downloads.",
      tone: "accent",
    },
    {
      key: "crypto",
      href: `/${locale}/tools/crypto`,
      icon: <CandlestickChart className="h-7 w-7" />,
      label: ar ? "أسعار العملات الرقمية" : "Crypto Market",
      description: ar
        ? "متابعة لحظية لأسعار أهم العملات الرقمية من Binance مع تحديثات فورية."
        : "Live tracking of top cryptocurrency prices from Binance with real-time updates.",
      tone: "accent-2",
    },
    {
      key: "pdf-to-word",
      href: `/${locale}/tools/pdf-to-word`,
      icon: <FileText className="h-7 w-7" />,
      label: ar ? "تحويل PDF إلى Word" : "PDF to Word",
      description: ar
        ? "حوّل ملفات PDF إلى مستندات Word قابلة للتعديل مع دعم كامل للغة العربية والإنجليزية."
        : "Convert PDF files to editable Word documents with full Arabic & English support.",
      tone: "accent",
    },
    {
      key: "mcp-business-review",
      href: `/${locale}/mcp-business-review`,
      icon: <Bot className="h-7 w-7" />,
      label: ar ? "مراجعة الأعمال بالـ MCP" : "MCP Business Review",
      description: ar
        ? "اربط SBC مع Claude أو Cursor أو أي عميل MCP لمراجعة الأنشطة التجارية وتحليل جاهزية ملفاتها."
        : "Connect SBC to Claude, Cursor, or any MCP client to review member businesses and analyze profile readiness.",
      tone: "accent-2",
      badge: ar ? "AI" : "AI",
    },
  ];

  return (
    <section dir={dir} className="mx-auto max-w-5xl py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Wrench className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {ar ? "أدوات SBC" : "SBC Tools"}
        </h1>
        <p className="mt-3 text-base text-(--muted-foreground)">
          {ar
            ? "مجموعة أدوات مجانية واحترافية لمساعدتك في إدارة أعمالك بشكل أفضل."
            : "A collection of free, professional tools to help you manage your business better."}
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.key}
            href={tool.href}
            className="sbc-card sbc-card--interactive flex flex-col rounded-2xl p-6 transition-all !border-0"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
                  tool.tone === "accent"
                    ? "bg-accent/15 text-accent"
                    : "bg-accent-2/15 text-accent-2"
                }`}
              >
                {tool.icon}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {tool.label}
                  </h2>
                  {tool.badge ? (
                    <span className="inline-flex items-center rounded-full bg-accent-2/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-2">
                      {tool.badge}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-(--muted-foreground)">
              {tool.description}
            </p>
            <span
              className={`mt-4 inline-flex items-center text-sm font-medium ${
                tool.tone === "accent" ? "text-accent" : "text-accent-2"
              }`}
            >
              {ar ? "ابدأ الآن ←" : "Open tool →"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
