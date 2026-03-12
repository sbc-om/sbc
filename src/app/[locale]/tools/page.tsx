import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { isLocale } from "@/lib/i18n/locales";

import { ToolsListClient } from "./ToolsListClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";

  return {
    title: ar ? "أدوات SBC" : "SBC Tools",
    description: ar
      ? "مجموعة أدوات احترافية مجانية لأصحاب الأعمال – مولد QR، أسعار العملات الرقمية، وأكثر."
      : "Free professional tools for business owners – QR generator, crypto prices, and more.",
    alternates: {
      canonical: `/${locale}/tools`,
    },
  };
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <PublicPage>
      <ToolsListClient locale={locale} />
    </PublicPage>
  );
}
