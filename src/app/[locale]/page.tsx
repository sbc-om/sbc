import { Container } from "@/components/Container";
import { PublicPage } from "@/components/PublicPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScrollLottie } from "@/components/ScrollLottie";
import { BusinessCard } from "@/components/BusinessCard";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { FeedProfileHeader } from "@/components/FeedProfileHeader";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listBusinesses } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getCurrentUser } from "@/lib/auth/currentUser";
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
  const allBusinesses = listBusinesses({ locale: locale as Locale });
  const latestBusinesses = allBusinesses.slice(0, user ? 20 : 10);

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
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 bg-linear-to-r from-accent via-accent-2 to-accent bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {dict.home.title}
            </h1>
            <p className="max-w-3xl mx-auto text-xl leading-8 text-muted-foreground animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
              {dict.home.subtitle}
            </p>
          </div>

          {/* Scroll-controlled Lottie Animation */}
          <ScrollLottie />
        </Container>
      </section>

      {/* Search Section */}
      <Container size="lg">
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
              {dict.home.searchPlaceholder}
            </h2>
            <p className="text-base mb-6 opacity-70" style={{ color: "currentColor" }}>
              {locale === "ar" ? "ابحث عن الأعمال الموثوقة" : "Find trusted businesses"}
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
      </Container>

      {/* Latest Businesses Section */}
      {latestBusinesses.length > 0 && (
        <section className="py-16">
          <Container size="lg">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {locale === "ar" ? "أحدث الأعمال" : "Latest Businesses"}
              </h2>
              <p className="text-base text-foreground opacity-70">
                {locale === "ar"
                  ? "اكتشف أحدث الأعمال المسجلة في المنصة"
                  : "Discover the newest businesses registered on our platform"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  locale={locale as Locale}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
    </PublicPage>
  );
}
