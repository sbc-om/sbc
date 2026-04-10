import { Container } from "@/components/Container";
import { BusinessCard } from "@/components/BusinessCard";
import { FadeInSection } from "@/components/FadeInSection";
import { listBusinesses } from "@/lib/db/businesses";
import { listActiveProgramSubscriptionsForUsers } from "@/lib/db/subscriptions";
import type { Locale } from "@/lib/i18n/locales";
import { unstable_cache } from "next/cache";

const getHomepageData = unstable_cache(
  async () => {
    const allBusinesses = await listBusinesses();
    const ownerIds = Array.from(
      new Set(allBusinesses.map((b) => b.ownerId).filter(Boolean) as string[]),
    );
    const activeSubscriptionsByUser = await listActiveProgramSubscriptionsForUsers(ownerIds);

    const ownerDirectoryPlan = new Map<string, string>();
    for (const [ownerId, subscriptions] of activeSubscriptionsByUser.entries()) {
      const matchingPlan = subscriptions.find(
        (subscription) =>
          subscription.plan === "homepage-top-yearly" || subscription.plan === "homepage-yearly",
      );
      if (matchingPlan?.plan) {
        ownerDirectoryPlan.set(ownerId, matchingPlan.plan);
      }
    }

    const manualTop = allBusinesses.filter((b) => b.homepageTop);
    const manualTopIds = new Set(manualTop.map((b) => b.id));

    const topRowBusinesses = [
      ...manualTop,
      ...allBusinesses.filter(
        (b) =>
          !!b.ownerId &&
          ownerDirectoryPlan.get(b.ownerId!) === "homepage-top-yearly" &&
          !manualTopIds.has(b.id),
      ),
    ].slice(0, 3);

    const topRowIds = new Set(topRowBusinesses.map((b) => b.id));
    const manualFeatured = allBusinesses.filter((b) => b.homepageFeatured && !topRowIds.has(b.id));
    const manualFeaturedIds = new Set(manualFeatured.map((b) => b.id));

    const featuredBusinesses = [
      ...manualFeatured,
      ...allBusinesses.filter(
        (b) =>
          !!b.ownerId &&
          ownerDirectoryPlan.get(b.ownerId!) === "homepage-yearly" &&
          !topRowIds.has(b.id) &&
          !manualFeaturedIds.has(b.id),
      ),
    ].slice(0, 12);

    const featuredIds = new Set([...topRowBusinesses, ...featuredBusinesses].map((b) => b.id));
    const latestBusinesses = allBusinesses.filter((b) => !featuredIds.has(b.id)).slice(0, 12);

    return {
      topRowBusinesses,
      featuredBusinesses,
      latestBusinesses,
    };
  },
  ["homepage-public-data"],
  { revalidate: 120 },
);

export async function HomepageBusinessSections({ locale }: { locale: Locale }) {
  const { topRowBusinesses, featuredBusinesses, latestBusinesses } = await getHomepageData();

  return (
    <>
      {topRowBusinesses.length > 0 ? (
        <section className="py-16">
          <Container size="lg">
            <FadeInSection duration={600} delay={0}>
              <div className="mb-10">
                <h2 className="mb-3 text-3xl font-bold text-foreground">
                  {locale === "ar" ? "أفضل الأنشطة التجارية" : "Top Businesses"}
                </h2>
                <p className="text-base text-foreground opacity-70">
                  {locale === "ar" ? "أنشطة تجارية موثوقة ومحبوبة لدى الناس." : "Popular and trusted businesses."}
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topRowBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={index * 100} className="h-full">
                  <BusinessCard business={business} locale={locale} noShadow noBorder />
                </FadeInSection>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {featuredBusinesses.length > 0 ? (
        <section className="py-6">
          <Container size="lg">
            <FadeInSection duration={600} delay={0}>
              <div className="mb-10">
                <h2 className="mb-3 text-3xl font-bold text-foreground">
                  {locale === "ar" ? "المقترحة" : "Recommended"}
                </h2>
                <p className="text-base text-foreground opacity-70">
                  {locale === "ar" ? "الأنشطة التجارية الأكثر توصية." : "Businesses people recommend most."}
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)} className="h-full">
                  <BusinessCard business={business} locale={locale} noShadow noBorder />
                </FadeInSection>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {latestBusinesses.length > 0 ? (
        <section className="py-16">
          <Container size="lg">
            <FadeInSection duration={600} delay={0}>
              <div className="mb-10">
                <h2 className="mb-3 text-3xl font-bold text-foreground">
                  {locale === "ar" ? "الأحدث" : "New Businesses"}
                </h2>
                <p className="text-base text-foreground opacity-70">
                  {locale === "ar" ? "الأنشطة التجارية المضافة حديثًا." : "Recently added businesses."}
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)} className="h-full">
                  <BusinessCard business={business} locale={locale} noShadow noBorder />
                </FadeInSection>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
