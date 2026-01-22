import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { AboutLogoLottie } from "@/components/AboutLogoLottie";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { buttonVariants } from "@/components/ui/Button";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <PublicPage>
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {dict.about.title}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {dict.about.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>

        {/* Hero Section with Logo */}
        <div className="mt-8 sbc-card rounded-2xl p-8 sm:p-12 text-center">
          <div className="flex justify-center mb-6">
            <AboutLogoLottie className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            {locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center"}
          </h2>
        </div>

        {/* Mission & Vision */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <svg
                  className="h-6 w-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {dict.about.mission}
              </h3>
            </div>
            <p className="text-sm leading-7 text-(--muted-foreground)">
              {dict.about.missionText}
            </p>
          </div>

          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-2/10">
                <svg
                  className="h-6 w-6 text-accent-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {dict.about.vision}
              </h3>
            </div>
            <p className="text-sm leading-7 text-(--muted-foreground)">
              {dict.about.visionText}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            {dict.about.features}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sbc-card rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <svg
                    className="h-5 w-5 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="font-semibold mb-2">{dict.about.feature1}</h4>
              <p className="text-xs text-(--muted-foreground)">
                {dict.about.feature1Text}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10">
                  <svg
                    className="h-5 w-5 text-accent-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="font-semibold mb-2">{dict.about.feature2}</h4>
              <p className="text-xs text-(--muted-foreground)">
                {dict.about.feature2Text}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <svg
                    className="h-5 w-5 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="font-semibold mb-2">{dict.about.feature3}</h4>
              <p className="text-xs text-(--muted-foreground)">
                {dict.about.feature3Text}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/10">
                  <svg
                    className="h-5 w-5 text-accent-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="font-semibold mb-2">{dict.about.feature4}</h4>
              <p className="text-xs text-(--muted-foreground)">
                {dict.about.feature4Text}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 sbc-card rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">
            {locale === "ar"
              ? "هل أنت مستعد للبدء؟"
              : "Ready to get started?"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {locale === "ar"
              ? "استكشف الأعمال أو تواصل معنا لمعرفة المزيد"
              : "Explore businesses or contact us to learn more"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/businesses`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {dict.nav.businesses}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {locale === "ar" ? "تواصل معنا" : "Contact Us"}
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href={`/${locale}/faq`}
            className="sbc-card sbc-card--interactive rounded-2xl p-6 text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <svg
                  className="h-6 w-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h4 className="font-semibold mb-2">
              {locale === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            </h4>
            <p className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? "إجابات على الأسئلة الأكثر شيوعاً"
                : "Answers to common questions"}
            </p>
          </Link>

          <Link
            href={`/${locale}/terms`}
            className="sbc-card sbc-card--interactive rounded-2xl p-6 text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-2/10 group-hover:bg-accent-2/20 transition-colors">
                <svg
                  className="h-6 w-6 text-accent-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h4 className="font-semibold mb-2">
              {locale === "ar" ? "شروط الخدمة" : "Terms of Service"}
            </h4>
            <p className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? "الشروط والأحكام للاستخدام"
                : "Terms and conditions of use"}
            </p>
          </Link>

          <Link
            href={`/${locale}/rules`}
            className="sbc-card sbc-card--interactive rounded-2xl p-6 text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <svg
                  className="h-6 w-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <h4 className="font-semibold mb-2">
              {locale === "ar" ? "قواعد المجتمع" : "Community Rules"}
            </h4>
            <p className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? "إرشادات للحفاظ على بيئة آمنة"
                : "Guidelines for a safe environment"}
            </p>
          </Link>
        </div>
    </PublicPage>
  );
}
