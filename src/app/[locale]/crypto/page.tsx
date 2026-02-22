import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { CryptoListClient } from "@/components/crypto/CryptoListClient";
import { getTopCryptoPairs } from "@/lib/crypto/binance";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";
  return {
    title: ar ? "العملات الرقمية" : "Crypto Market",
    description: ar
      ? "قائمة بأهم العملات الرقمية مع أسعار لحظية من Binance."
      : "Top crypto market pairs with live prices from Binance.",
    alternates: {
      canonical: `/${locale}/crypto`,
    },
  };
}

export default async function CryptoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const pairs = await getTopCryptoPairs(10);

  return (
    <PublicPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {locale === "ar" ? "سوق الكريبتو" : "Crypto Market"}
          </h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "أهم أزواج السوق حسب حجم التداول، مع تحديث لحظي مباشر من WebSocket بایننس."
              : "Top market pairs by trading volume with real-time updates via Binance websocket."}
          </p>
        </div>

        {pairs.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "تعذر تحميل بيانات السوق حالياً."
              : "Unable to load market data right now."}
          </div>
        ) : (
          <CryptoListClient locale={locale as Locale} initialPairs={pairs} />
        )}
      </div>
    </PublicPage>
  );
}
