import { Container } from "@/components/Container";
import { PublicPage } from "@/components/PublicPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScrollLottie } from "@/components/ScrollLottie";
import { BusinessCard } from "@/components/BusinessCard";
import { FadeInSection } from "@/components/FadeInSection";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listBusinesses } from "@/lib/db/businesses";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import Link from "next/link";
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

      {/* Search Section */}
      <Container size="lg">
        <FadeInSection duration={700} delay={0}>
          <div className="max-w-4xl mx-auto pb-20">
          <div 
            className="relative rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
            style={{
              background: "rgba(var(--surface-rgb, 255, 255, 255), 0.6)",
              border: "2px solid",
              borderColor: "var(--surface-border)",
            }}
          >
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              {locale === "ar" ? "ابحث في الدليل" : "Search the directory"}
            </h2>
            <p className="text-base mb-6 opacity-70" style={{ color: "currentColor" }}>
              {locale === "ar"
                ? "ابحث بالاسم أو التصنيف أو المدينة."
                : "Search by name, category, or city."}
            </p>
            
            <form
              className="flex flex-col gap-4 sm:flex-row"
              action={`/${locale}/businesses`}
            >
              <Input
                className="flex-1"
                placeholder={dict.home.searchPlaceholder}
                name="q"
              />
              <Button 
                type="submit"
                className="shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                {dict.home.browseAll}
              </Button>
            </form>
          </div>
          </div>
        </FadeInSection>
      </Container>

      {/* Products Section */}
      <section className="py-10">
        <Container size="lg">
          <FadeInSection duration={600} delay={0}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {locale === "ar" ? "الحلول" : "Solutions"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "وحدات أعمال احترافية يمكن تفعيلها: دليل الأعمال، بطاقة الولاء، ومنصة التسويق."
                  : "Professional business modules you can activate: Business Directory, Loyalty Card, and Marketing Platform."}
              </p>
            </div>
          </FadeInSection>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FadeInSection duration={500} delay={0}>
              <div className="sbc-card rounded-2xl p-6">
              <div className="text-lg font-semibold">
                {locale === "ar" ? "دليل الأعمال" : "Business Directory"}
              </div>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
                {locale === "ar"
                  ? "استكشف الأعمال الموثوقة والتصنيفات والملفات التعريفية." 
                  : "Explore trusted businesses, categories, and profiles."}
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/businesses`}
                  className="inline-flex items-center text-sm font-medium text-accent hover:underline"
                >
                  {locale === "ar" ? "فتح" : "Open"}
                </Link>
              </div>
            </div>
            </FadeInSection>

            <FadeInSection duration={500} delay={100}>
            <div className="sbc-card rounded-2xl p-6">
              <div className="text-lg font-semibold">
                {locale === "ar" ? "بطاقة الولاء" : "Loyalty Card"}
              </div>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
                {locale === "ar"
                  ? "أصدر بطاقات ولاء رقمية (Apple/Google Wallet) وأدر العملاء والمكافآت." 
                  : "Issue digital loyalty cards (Apple/Google Wallet) and manage customers & rewards."}
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/loyalty`}
                  className="inline-flex items-center text-sm font-medium text-accent hover:underline"
                >
                  {locale === "ar" ? "فتح" : "Open"}
                </Link>
              </div>
            </div>
            </FadeInSection>

            <FadeInSection duration={500} delay={200}>
            <div className="sbc-card rounded-2xl p-6">
              <div className="text-lg font-semibold">
                {locale === "ar" ? "منصة التسويق" : "Marketing Platform"}
              </div>
              <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
                {locale === "ar"
                  ? "واجهات واتساب وتلغرام قابلة للتخصيص للحملات والأتمتة." 
                  : "Customizable WhatsApp + Telegram APIs for campaigns and automation."}
              </p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/marketing-platform`}
                  className="inline-flex items-center text-sm font-medium text-accent hover:underline"
                >
                  {locale === "ar" ? "فتح" : "Open"}
                </Link>
              </div>
            </div>
            </FadeInSection>
          </div>
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
                    ? "أفضل 3 أعمال مميزة"
                    : "Top 3 featured businesses"}
                </h2>
                <p className="text-base text-foreground opacity-70">
                  {locale === "ar"
                    ? "مختارات من الأعمال لعرضها في أعلى الصفحة الرئيسية."
                    : "Hand-picked businesses highlighted at the top of the homepage."}
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRowBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={index * 100}>
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
                {locale === "ar" ? "مميّز في الصفحة الرئيسية" : "Featured on the homepage"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "قائمة منتقاة من الأعمال المميزة على الصفحة الرئيسية."
                  : "A curated selection of businesses featured on the homepage."}
              </p>
            </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)}>
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
                {locale === "ar" ? "أحدث الأعمال" : "Latest Businesses"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "اكتشف أحدث الأعمال المضافة إلى الدليل"
                  : "Discover the latest businesses added to the directory"}
              </p>
            </div>
            </FadeInSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBusinesses.map((business, index) => (
                <FadeInSection key={business.id} duration={500} delay={Math.min(index * 80, 800)}>
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
