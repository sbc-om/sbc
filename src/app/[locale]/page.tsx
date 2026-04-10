import { Container } from "@/components/Container";
import { HomepageBusinessSections } from "@/components/home/HomepageBusinessSections";
import { HomepageBusinessSectionsSkeleton } from "@/components/home/HomepageBusinessSectionsSkeleton";
import { PublicPage } from "@/components/PublicPage";
import { FadeInSection } from "@/components/FadeInSection";
import { LazyScrollLottie } from "@/components/LazyScrollLottie";
import { TypewriterText } from "@/components/TypewriterText";
import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";
  const title = ar ? "مركز الأعمال الذكية" : "Smart Business Center";
  const description = ar
    ? "منصة أعمال ثنائية اللغة لاكتشاف الأنشطة التجارية، التسويق، وبطاقات الولاء."
    : "A bilingual business platform to discover businesses, marketing services, and loyalty solutions.";
  const canonical = `/${locale}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: ar ? "ar_OM" : "en_US",
      url: canonical,
      title,
      description,
      images: [
        {
          url: "/images/sbc.svg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/sbc.svg"],
    },
  };
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <PublicPage>
    <div className="min-h-screen">
      {/* Hero Section with Lottie Animation */}
      <section className="relative pt-6 pb-16 overflow-hidden">
        <Container size="lg">
          <FadeInSection duration={800} delay={0}>
            <div className="text-center mb-12">
              <h1 className="mb-6 whitespace-nowrap text-[clamp(1.45rem,7vw,4.5rem)] font-bold leading-tight tracking-tight bg-linear-to-r from-accent via-accent-2 to-accent bg-clip-text text-transparent">
                <TypewriterText text={dict.home.title} speedMs={70} />
              </h1>
              <p className="max-w-3xl mx-auto text-xl leading-8 text-muted-foreground">
                {dict.home.subtitle}
              </p>
            </div>
          </FadeInSection>

          {/* Scroll-controlled Lottie Animation */}
          <FadeInSection duration={1000} delay={200}>
            <LazyScrollLottie scrollFactor={1.2} />
          </FadeInSection>

          <FadeInSection duration={700} delay={260}>
            <div className="mt-6 grid items-stretch gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2">
              <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-linear-to-br from-amber-500/12 via-rose-500/10 to-fuchsia-500/12 p-4 shadow-[0_24px_70px_rgba(244,63,94,0.14)] sm:rounded-3xl sm:p-6 lg:p-7">
                <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-rose-400/18 blur-3xl" />
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {locale === "ar" ? "نظام الولاء" : "Loyalty System"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground) sm:text-base sm:leading-7">
                  {locale === "ar"
                    ? "نقاط وبطاقات العملاء."
                    : "Points and customer cards."}
                </p>
                <div className="mt-auto pt-4">
                  <Link
                    href={`/${locale}/loyalty`}
                    className={buttonVariants({ variant: "primary", size: "md", className: "w-full justify-center sm:w-auto" })}
                  >
                    {locale === "ar" ? "فتح الولاء" : "Open Loyalty"}
                  </Link>
                </div>
              </article>

              <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-linear-to-br from-sky-500/12 via-cyan-500/10 to-emerald-500/12 p-4 shadow-[0_24px_70px_rgba(6,182,212,0.14)] sm:rounded-3xl sm:p-6 lg:p-7">
                <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-cyan-400/18 blur-3xl" />
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {locale === "ar" ? "دليل الأعمال" : "Business Directory"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-(--muted-foreground) sm:text-base sm:leading-7">
                  {locale === "ar"
                    ? "اكتشف الأنشطة التجارية في مكان واحد."
                    : "Discover businesses in one place."}
                </p>
                <div className="mt-auto pt-4">
                  <Link
                    href={`/${locale}/businesses`}
                    className={buttonVariants({ variant: "secondary", size: "md", className: "w-full justify-center sm:w-auto" })}
                  >
                    {locale === "ar" ? "فتح دليل الأعمال" : "Open Business Directory"}
                  </Link>
                </div>
              </article>
            </div>
          </FadeInSection>
        </Container>
      </section>

      <Suspense fallback={<HomepageBusinessSectionsSkeleton />}>
        <HomepageBusinessSections locale={locale as Locale} />
      </Suspense>
    </div>
    </PublicPage>
  );
}
