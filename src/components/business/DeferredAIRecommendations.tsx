import { AIRecommendations } from "@/components/ai/AIRecommendations";
import { listBusinesses } from "@/lib/db/businesses";
import type { Business } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";

type DeferredAIRecommendationsProps = {
  currentBusiness: Business;
  locale: Locale;
};

export async function DeferredAIRecommendations({
  currentBusiness,
  locale,
}: DeferredAIRecommendationsProps) {
  const allBusinesses = await listBusinesses();

  return (
    <AIRecommendations
      currentBusiness={currentBusiness}
      allBusinesses={allBusinesses}
      locale={locale === "ar" ? "ar" : "en"}
    />
  );
}
