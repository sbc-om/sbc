import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { CryptoSymbolLivePanel } from "@/components/crypto/CryptoSymbolLivePanel";
import { CryptoTradingView } from "@/components/crypto/CryptoTradingView";
import { getCryptoSymbolDetails } from "@/lib/crypto/binance";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function validSymbol(value: string): boolean {
  return /^[A-Z0-9]{5,20}$/.test(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}): Promise<Metadata> {
  const { locale, symbol } = await params;
  if (!isLocale(locale)) return {};

  const clean = normalizeSymbol(symbol);
  const ar = locale === "ar";
  return {
    title: ar ? `تفاصيل ${clean}` : `${clean} Details`,
    description: ar
      ? `تحليل لحظي كامل لزوج ${clean} مع الرسم البياني من TradingView.`
      : `Live full details for ${clean} with TradingView chart.`,
    alternates: {
      canonical: `/${locale}/crypto/${clean}`,
    },
  };
}

export default async function CryptoSymbolPage({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}) {
  const { locale, symbol } = await params;
  if (!isLocale(locale)) notFound();

  const cleanSymbol = normalizeSymbol(symbol);
  if (!validSymbol(cleanSymbol)) notFound();

  const details = await getCryptoSymbolDetails(cleanSymbol);
  if (!details) notFound();

  return (
    <PublicPage>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {locale === "ar" ? "تفاصيل العملة" : "Crypto Details"}
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "بيانات لحظية مباشرة من Binance + الرسم البياني التفاعلي من TradingView"
                : "Live data from Binance + interactive TradingView chart"}
            </p>
          </div>
          <Link
            href={`/${locale}/crypto`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {locale === "ar" ? "الرجوع للسوق" : "Back to Market"}
          </Link>
        </div>

        <CryptoSymbolLivePanel locale={locale as Locale} initial={details} />
        <CryptoTradingView symbol={cleanSymbol} />

        <section className="sbc-card rounded-2xl p-5 text-sm text-(--muted-foreground)">
          <p>
            {locale === "ar"
              ? "ملاحظة: البيانات المعروضة مرجعية وتعليمية، وليست نصيحة استثمارية."
              : "Note: Displayed data is informational and not investment advice."}
          </p>
        </section>
      </div>
    </PublicPage>
  );
}
