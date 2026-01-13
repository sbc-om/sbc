/**
 * Client-safe utility functions for store products
 * These functions work with product objects and don't access the database
 */

import type { Locale } from "@/lib/i18n/locales";
import type { StoreProduct, StoreProductPrice } from "./types";

/**
 * Get localized text for a product
 */
export function getStoreProductText(product: StoreProduct, locale: Locale) {
  const ar = locale === "ar";
  return {
    name: ar ? product.name.ar : product.name.en,
    description: ar ? product.description.ar : product.description.en,
    features: ar ? product.features.ar : product.features.en,
  };
}

/**
 * Format product price with currency and interval
 */
export function formatStorePrice(price: StoreProductPrice, locale: Locale): string {
  // OMR uses 3 minor units; default Intl formatting is correct but we pin it for consistency.
  const fractionDigits = price.currency === "OMR" ? 3 : 0;
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const base = nf.format(price.amount);
  if (!price.interval) return base;

  const suffix =
    locale === "ar"
      ? price.interval === "month"
        ? " / شهر"
        : price.interval === "6mo"
          ? " / 6 أشهر"
          : " / سنة"
      : price.interval === "month"
        ? " / mo"
        : price.interval === "6mo"
          ? " / 6 mo"
          : " / yr";

  return base + suffix;
}
