import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { isLocale } from "@/lib/i18n/locales";

import { PdfToWordClient } from "./PdfToWordClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";

  return {
    title: ar ? "تحويل PDF إلى Word" : "PDF to Word Converter",
    description: ar
      ? "حوّل ملفات PDF إلى مستندات Word قابلة للتعديل مع دعم كامل للغة العربية والإنجليزية."
      : "Convert PDF files to editable Word documents with full Arabic and English support.",
    alternates: {
      canonical: `/${locale}/tools/pdf-to-word`,
    },
  };
}

export default async function PdfToWordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <PublicPage>
      <PdfToWordClient locale={locale} />
    </PublicPage>
  );
}
