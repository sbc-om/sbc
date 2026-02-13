import { Container } from "@/components/Container";
import { PublicPage } from "@/components/PublicPage";
import { ScrollLottie } from "@/components/ScrollLottie";
import { BusinessCard } from "@/components/BusinessCard";
import { FadeInSection } from "@/components/FadeInSection";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listBusinesses } from "@/lib/db/businesses";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();
  
  // Get latest businesses
  const allBusinesses = await listBusinesses();
  // Homepage placements (manual flags + paid directory plans)
  const ownerIds = Array.from(
    new Set(allBusinesses.map((b) => b.ownerId).filter(Boolean) as string[]),
  );

  const ownerDirectoryPlan = new Map<string, string>();
  for (const ownerId of ownerIds) {
    const sub = await getProgramSubscriptionByUser(ownerId);
    if (!sub || !(await isProgramSubscriptionActive(ownerId))) continue;
    ownerDirectoryPlan.set(ownerId, sub.plan!);
  }

  const manualTop = allBusinesses.filter((b) => b.homepageTop);
  const manualTopIds = new Set(manualTop.map((b) => b.id));

  const topRowBusinesses = [
    ...manualTop,
    ...allBusinesses.filter(
      (b) => !!b.ownerId
        && ownerDirectoryPlan.get(b.ownerId!) === "homepage-top-yearly"
        && !manualTopIds.has(b.id),
    ),
  ].slice(0, 3);

  const topRowIds = new Set(topRowBusinesses.map((b) => b.id));
  const manualFeatured = allBusinesses.filter((b) => b.homepageFeatured && !topRowIds.has(b.id));
  const manualFeaturedIds = new Set(manualFeatured.map((b) => b.id));

  const featuredBusinesses = [
    ...manualFeatured,
    ...allBusinesses.filter(
      (b) => !!b.ownerId
        && ownerDirectoryPlan.get(b.ownerId!) === "homepage-yearly"
        && !topRowIds.has(b.id)
        && !manualFeaturedIds.has(b.id),
    ),
  ].slice(0, 12);

  const featuredIds = new Set([...topRowBusinesses, ...featuredBusinesses].map((b) => b.id));
  const latestBusinesses = allBusinesses
    .filter((b) => !featuredIds.has(b.id))
    .slice(0, 12);

  // Logged in users land on the followed feed.
  if (user) {
    redirect(`/${locale}/home`);
  }

  return (
    <PublicPage>
    <div className="min-h-screen">
      {/* Hero Section with Lottie Animation */}
      <section className="relative pt-6 pb-16 overflow-hidden">
        <Container size="lg">
          <FadeInSection duration={800} delay={0}>
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 bg-linear-to-r from-accent via-accent-2 to-accent bg-clip-text text-transparent">
                {dict.home.title}
              </h1>
              <p className="max-w-3xl mx-auto text-xl leading-8 text-muted-foreground">
                {dict.home.subtitle}
              </p>
            </div>
          </FadeInSection>

          {/* Scroll-controlled Lottie Animation */}
          <FadeInSection duration={1000} delay={200}>
            <ScrollLottie />
          </FadeInSection>
        </Container>
      </section>

      {/* Latest Businesses Section */}
      {topRowBusinesses.length > 0 ? (
        <section className="py-16">
          <Container size="lg">
            <FadeInSection duration={600} delay={0}>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  {locale === "ar"
                    ? "برترین کسب‌وکارها"
                    : "Top Businesses"}
                </h2>
                <p className="text-base text-foreground opacity-70">
                  {locale === "ar"
                    ? "کسب‌وکارهای محبوب و مورد اعتماد مردم."
                    : "Popular and trusted businesses."}
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRowBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={index * 100} className="h-full">
                  <BusinessCard
                    business={business}
                    locale={locale as Locale}
                  />
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
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {locale === "ar" ? "پیشنهادی‌ها" : "Recommended"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "کسب‌وکارهایی که بیشتر پیشنهاد شده‌اند."
                  : "Businesses people recommend most."}
              </p>
            </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)} className="h-full">
                  <BusinessCard
                    business={business}
                    locale={locale as Locale}
                  />
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
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {locale === "ar" ? "جدیدترین‌ها" : "New Businesses"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "کسب‌وکارهایی که به تازگی اضافه شده‌اند."
                  : "Recently added businesses."}
              </p>
            </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)} className="h-full">
                  <BusinessCard
                    business={business}
                    locale={locale as Locale}
                  />
                </FadeInSection>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </div>
    </PublicPage>
  );
}
