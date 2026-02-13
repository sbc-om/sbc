import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { buttonVariants } from "@/components/ui/Button";
import { FadeInSection } from "@/components/FadeInSection";

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {locale === "ar" ? "قواعد المجتمع" : "Community Rules"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {locale === "ar"
              ? "إرشادات للحفاظ على بيئة آمنة ومحترمة للجميع"
              : "Guidelines for maintaining a safe and respectful environment for everyone"}
          </p>
        </div>
        <Link
          href={`/${locale}/about`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة" : "Back"}
        </Link>
      </div>

      {/* Hero Card */}
      <FadeInSection duration={600} delay={0}>
        <div className="sbc-card rounded-2xl p-8 mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2">
              <svg
                className="h-8 w-8 text-white"
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
          <h2 className="text-2xl font-bold mb-3">
            {locale === "ar"
              ? "بناء مجتمع أفضل معاً"
              : "Building a Better Community Together"}
          </h2>
          <p className="text-base leading-7 text-(--muted-foreground) max-w-2xl mx-auto">
            {locale === "ar"
              ? "هذه القواعد تضمن أن تكون Smart Business Center منصة آمنة ومفيدة للجميع. نتوقع من جميع المستخدمين احترام هذه الإرشادات."
              : "These rules ensure that Smart Business Center remains a safe and useful platform for everyone. We expect all users to respect these guidelines."}
          </p>
        </div>
      </FadeInSection>

      {/* Core Values */}
      <FadeInSection duration={600} delay={100}>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">
            {locale === "ar" ? "قيمنا الأساسية" : "Our Core Values"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                ),
                title: locale === "ar" ? "الأمان" : "Safety",
                desc:
                  locale === "ar"
                    ? "حماية المستخدمين والبيانات"
                    : "Protecting users and data",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                ),
                title: locale === "ar" ? "الاحترام" : "Respect",
                desc:
                  locale === "ar"
                    ? "معاملة الجميع بكرامة"
                    : "Treating everyone with dignity",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ),
                title: locale === "ar" ? "الشفافية" : "Transparency",
                desc:
                  locale === "ar"
                    ? "معلومات واضحة وصادقة"
                    : "Clear and honest information",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                ),
                title: locale === "ar" ? "الجودة" : "Quality",
                desc:
                  locale === "ar"
                    ? "محتوى عالي الجودة دائماً"
                    : "Always high-quality content",
              },
            ].map((value, index) => (
              <div key={index} className="sbc-card rounded-2xl p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <svg
                      className="h-6 w-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {value.icon}
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-xs text-(--muted-foreground)">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* Rules Sections */}
      <div className="space-y-6">
        <FadeInSection duration={600} delay={150}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar" ? "1. كن محترماً ومهذباً" : "1. Be Respectful and Courteous"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "التزم بالاحترام في جميع التفاعلات"
                    : "Maintain respect in all interactions"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "تعامل مع الآخرين كما تحب أن يُعاملوك"
                    : "Treat others as you would like to be treated"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "استخدم لغة مهذبة ومهنية"
                    : "Use polite and professional language"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للتحرش أو التنمر أو الإساءة"
                    : "No harassment, bullying, or abuse"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للتمييز على أساس العرق أو الدين أو الجنس أو غيره"
                    : "No discrimination based on race, religion, gender, etc."}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={200}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-2/10">
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
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar"
                    ? "2. قدم معلومات دقيقة وصادقة"
                    : "2. Provide Accurate and Honest Information"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "الصدق والشفافية أساسيان"
                    : "Honesty and transparency are essential"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "تحقق من دقة المعلومات قبل نشرها"
                    : "Verify information accuracy before posting"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "حدّث معلومات عملك بانتظام"
                    : "Keep your business information up to date"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للمعلومات المضللة أو الكاذبة"
                    : "No misleading or false information"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للادعاءات الكاذبة أو المبالغ فيها"
                    : "No false or exaggerated claims"}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={250}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar"
                    ? "3. احترم الخصوصية والأمان"
                    : "3. Respect Privacy and Security"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "احم معلوماتك الشخصية ومعلومات الآخرين"
                    : "Protect your personal information and others'"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "استخدم كلمات مرور قوية وآمنة"
                    : "Use strong and secure passwords"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "احترم خصوصية معلومات العملاء"
                    : "Respect customer information privacy"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا تشارك معلومات شخصية للآخرين"
                    : "Don't share others' personal information"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا لمحاولات الاختراق أو الوصول غير المصرح"
                    : "No hacking or unauthorized access attempts"}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={300}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-2/10">
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
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar"
                    ? "4. نشر محتوى مناسب وقانوني"
                    : "4. Post Appropriate and Legal Content"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "المحتوى يجب أن يكون مناسباً لجميع الأعمار"
                    : "Content must be appropriate for all ages"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "المحتوى يجب أن يكون متعلقاً بالأعمال"
                    : "Content should be business-related"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "استخدم صور عالية الجودة ومناسبة"
                    : "Use high-quality and appropriate images"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للمحتوى غير اللائق أو المسيء"
                    : "No inappropriate or offensive content"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للمحتوى الذي ينتهك حقوق الملكية"
                    : "No content that violates intellectual property"}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={350}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar"
                    ? "5. لا للبريد المزعج والتلاعب"
                    : "5. No Spam or Manipulation"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "استخدم المنصة بطريقة عادلة"
                    : "Use the platform fairly"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للرسائل المزعجة المتكررة"
                    : "No repeated spam messages"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا لإنشاء حسابات وهمية متعددة"
                    : "No creating multiple fake accounts"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا للتلاعب بالتقييمات أو التعليقات"
                    : "No manipulating ratings or reviews"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500 shrink-0">✗</span>
                <span>
                  {locale === "ar"
                    ? "لا لاستخدام bots أو أدوات أتمتة"
                    : "No using bots or automation tools"}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection duration={600} delay={400}>
          <div className="sbc-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-2/10">
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
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">
                  {locale === "ar"
                    ? "6. الإبلاغ عن الانتهاكات"
                    : "6. Report Violations"}
                </h2>
                <p className="text-sm text-(--muted-foreground)">
                  {locale === "ar"
                    ? "ساعدنا في الحفاظ على المجتمع آمناً"
                    : "Help us keep the community safe"}
                </p>
              </div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-(--muted-foreground)">
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "أبلغ عن أي محتوى مخالف للقواعد"
                    : "Report any content that violates rules"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "ساعد الأعضاء الجدد على فهم القواعد"
                    : "Help new members understand the rules"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent shrink-0">✓</span>
                <span>
                  {locale === "ar"
                    ? "تواصل مع الدعم الفني عند الحاجة"
                    : "Contact support when needed"}
                </span>
              </li>
            </ul>
          </div>
        </FadeInSection>
      </div>

      {/* Consequences */}
      <FadeInSection duration={600} delay={450}>
        <div className="mt-8 sbc-card rounded-2xl p-8 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-3 text-red-600 dark:text-red-400">
                {locale === "ar" ? "عواقب انتهاك القواعد" : "Consequences of Rule Violations"}
              </h2>
              <p className="text-sm leading-7 text-(--muted-foreground) mb-4">
                {locale === "ar"
                  ? "انتهاك هذه القواعد قد يؤدي إلى:"
                  : "Violating these rules may result in:"}
              </p>
              <ul className="space-y-2 text-sm leading-7 text-(--muted-foreground)">
                <li className="flex gap-3">
                  <span className="text-red-500 shrink-0">⚠</span>
                  <span>
                    {locale === "ar" ? "تحذير رسمي" : "Official warning"}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 shrink-0">⚠</span>
                  <span>
                    {locale === "ar"
                      ? "تعليق مؤقت للحساب"
                      : "Temporary account suspension"}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 shrink-0">⚠</span>
                  <span>
                    {locale === "ar"
                      ? "حذف المحتوى المخالف"
                      : "Removal of violating content"}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 shrink-0">⚠</span>
                  <span>
                    {locale === "ar"
                      ? "إنهاء دائم للحساب في الحالات الخطيرة"
                      : "Permanent account termination in serious cases"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Bottom CTA */}
      <FadeInSection duration={700} delay={0}>
        <div className="mt-12 sbc-card rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">
            {locale === "ar"
              ? "لنبني مجتمعاً أفضل معاً"
              : "Let's Build a Better Community Together"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mb-6 max-w-lg mx-auto">
            {locale === "ar"
              ? "باتباع هذه القواعد، نساهم جميعاً في جعل Smart Business Center منصة آمنة ومفيدة للجميع."
              : "By following these rules, we all contribute to making Smart Business Center a safe and useful platform for everyone."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/contact`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {locale === "ar" ? "الإبلاغ عن مشكلة" : "Report an Issue"}
            </Link>
            <Link
              href={`/${locale}/faq`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {locale === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            </Link>
          </div>
        </div>
      </FadeInSection>
    </PublicPage>
  );
}
