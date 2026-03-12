import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { isLocale } from "@/lib/i18n/locales";

import { QrCodeGeneratorClient } from "./QrCodeGeneratorClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";

  return {
    title: ar ? "مولد QR احترافي" : "Professional QR Generator",
    description: ar
      ? "صفحة متقدمة لإنشاء QR للروابط والنصوص والواي فاي والهاتف والبريد والموقع مع تنزيل عالي الجودة."
      : "Advanced QR generator for links, text, Wi-Fi, phone, email, location, and high-quality downloads.",
    alternates: {
      canonical: `/${locale}/tools/qrcode`,
    },
  };
}

export default async function ToolsQrCodePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <PublicPage>
      <QrCodeGeneratorClient locale={locale} />
    </PublicPage>
  );
}
