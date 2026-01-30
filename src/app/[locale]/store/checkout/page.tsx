import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listStoreProducts } from "@/lib/store/products";

import { CheckoutClient } from "./CheckoutClient";

export const runtime = "nodejs";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  await requireUser(locale as Locale);
  const products = await listStoreProducts();

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "الدفع" : "Checkout"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "راجِع مشترياتك ثم أكمل الدفع عبر بوابة افتراضية."
              : "Review your items and complete payment via a fake gateway."}
          </p>
        </div>

        <div className="text-sm text-(--muted-foreground)">
          {dict.appName}
        </div>
      </div>

      <CheckoutClient locale={locale as Locale} products={products} />
    </AppPage>
  );
}
