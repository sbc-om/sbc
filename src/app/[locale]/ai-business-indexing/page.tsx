import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineChat,
  HiOutlineGift,
  HiOutlineGlobeAlt,
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineViewGrid,
} from "react-icons/hi";
import { HiCheckBadge, HiOutlineCpuChip } from "react-icons/hi2";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { isLocale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function AIBusinessIndexingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const ar = locale === "ar";

  const visibilitySources = [
    ar ? "مواقع منظّمة (Structured Websites)" : "Structured websites",
    ar ? "دلائل الأعمال (Business Directories)" : "Business directories",
    ar ? "مصادر البيانات العامة (Public Data Sources)" : "Public data sources",
    ar ? "رسوم المعرفة (Knowledge Graphs)" : "Knowledge graphs",
    ar ? "قوائم الشركات الموثقة (Verified Listings)" : "Verified company listings",
  ];

  const indexingFeatures = [
    ar
      ? "تنظيم بيانات نشاطك بصيغ قابلة للفهم من أنظمة AI"
      : "Structures your business data using AI-readable formats",
    ar
      ? "نشر ملف نشاطك داخل دليل SBC العالمي للأعمال"
      : "Publishes your business profile inside the SBC global business directory",
    ar
      ? "إنشاء بيانات وصفية منظّمة (Schema / Knowledge Graph)"
      : "Creates structured business metadata (Schema / knowledge graph format)",
    ar
      ? "مساعدة محركات البحث وأنظمة AI على فهم نشاطك بدقة"
      : "Helps search engines and AI systems understand your business",
    ar
      ? "تحسين قابلية الظهور في أدوات ومساعدات البحث بالذكاء الاصطناعي"
      : "Improves discoverability in AI search tools and assistants",
    ar
      ? "ربط نشاطك بشبكات الظهور الرقمي الحديثة"
      : "Connects your business to digital visibility networks",
  ];

  const platformGroups = [
    {
      icon: HiOutlineChat,
      title: ar ? "مساعدات الذكاء الاصطناعي" : "AI Assistants",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "محركات بحث AI" : "AI Search Engines",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "رسوم معرفة الأعمال" : "Business Knowledge Graphs",
    },
    {
      icon: HiOutlineViewGrid,
      title: ar ? "دلائل أعمال عالمية" : "Global Business Directories",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "محركات البحث" : "Search Engines",
    },
  ];

  const platformExamples = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Bing Copilot", "Google Search"];

  const steps = [
    ar ? "تسجيل النشاط على SBC" : "Business registers on SBC",
    ar ? "تنظيم ملف الشركة بشكل احترافي" : "SBC structures the company profile",
    ar ? "تحسين البيانات لأنظمة AI ومحركات البحث" : "Business data is optimized for AI and search engines",
    ar ? "ظهور النشاط عبر المنصات الرقمية ومنصات AI" : "The business becomes discoverable across digital and AI platforms",
  ];

  const benefits = [
    ar ? "زيادة الظهور الرقمي" : "Increased online visibility",
    ar ? "قابلية اكتشاف أعلى في AI Search" : "Discoverability in AI search",
    ar ? "مصداقية رقمية أفضل" : "Better digital credibility",
    ar ? "حضور شركة منظّم على الإنترنت" : "Structured company presence online",
    ar ? "تموضع مستقبلي جاهز لعصر AI" : "Future-ready business positioning",
  ];

  return (
    <PublicPage>
      <section>
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-(--surface-border) bg-(--surface) px-3 py-1 text-sm font-semibold text-(--muted-foreground)">
            <HiOutlineCpuChip className="h-4 w-4" />
            {ar ? "خدمة جديدة من SBC" : "New SBC Service"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">AI Business Indexing</h1>
          <p className="mt-3 text-xl font-medium text-(--muted-foreground)">
            {ar ? "اجعل نشاطك قابلاً للاكتشاف عبر أنظمة الذكاء الاصطناعي" : "Make Your Business Discoverable by AI"}
          </p>
          <p className="mt-6 text-lg leading-8 font-medium text-(--muted-foreground)">
            {ar
              ? "العملاء اليوم يستخدمون مساعدين ذكيين للبحث أكثر من أي وقت مضى. SBC يضمن أن بيانات نشاطك تُبنى وتُنشر بصيغة منظّمة تساعد منظومات AI على اكتشافك وفهمك."
              : "Modern customers are increasingly searching with AI assistants, not just traditional search engines. SBC ensures your business data is structured and distributed so it can be discovered across the AI ecosystem."}
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{ar ? "Why AI Visibility Matters" : "Why AI Visibility Matters"}</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="sbc-card rounded-2xl p-6">
            <p className="text-base leading-8 font-medium text-(--muted-foreground)">
              {ar
                ? "أنظمة AI تجمع المعلومات من مصادر متعددة. إذا لم يكن نشاطك منظّماً رقمياً، فقد لا تتعرف عليه هذه الأنظمة بشكل صحيح."
                : "AI systems aggregate business information from multiple sources. If your business is not properly structured online, AI systems may not recognize it accurately."}
            </p>
            <p className="mt-4 text-base leading-8 font-medium text-(--muted-foreground)">
              {ar
                ? "SBC يحل هذه الفجوة عبر تنظيم بيانات نشاطك وتوزيعها عبر قنوات اكتشاف متعددة."
                : "SBC solves this by structuring and distributing your business data across multiple discovery channels."}
            </p>
          </div>
          <div className="sbc-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold">{ar ? "مصادر تعتمد عليها أنظمة AI" : "Where AI Systems Pull Signals From"}</h3>
            <ul className="mt-4 grid gap-3 text-base font-medium text-(--muted-foreground)">
              {visibilitySources.map((item) => (
                <li key={item} className="inline-flex items-start gap-2">
                  <HiCheckBadge className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{ar ? "What SBC AI Indexing Does" : "What SBC AI Indexing Does"}</h2>
        <div className="mt-5 sbc-card rounded-2xl p-6">
          <ul className="grid gap-3 text-base font-medium text-(--muted-foreground)">
            {indexingFeatures.map((feature) => (
              <li key={feature} className="inline-flex items-start gap-2">
                <HiOutlineSparkles className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{ar ? "Platforms & AI Systems" : "Platforms & AI Systems"}</h2>
        <p className="mt-3 text-base font-medium leading-8 text-(--muted-foreground)">
          {ar
            ? "SBC يساعد نشاطك على بناء إشارات ظهور قوية عبر منظومة الاكتشاف الحديثة. نحن نركز على Visibility Optimization وليس ضمان ترتيب ثابت."
            : "SBC helps your business become visible across the modern discovery ecosystem through visibility optimization. We do not guarantee fixed rankings."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="sbc-card sbc-card--interactive rounded-2xl p-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">{group.title}</h3>
              </div>
            );
          })}
        </div>
        <div className="mt-5 sbc-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold">{ar ? "أمثلة على المنصات" : "Examples"}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {platformExamples.map((name) => (
              <span key={name} className="sbc-chip rounded-full px-3 py-1.5 text-sm font-semibold">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{ar ? "How It Works" : "How It Works"}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="sbc-card sbc-card--interactive rounded-2xl p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-(--accent-foreground) text-sm font-bold">
                {index + 1}
              </div>
              <p className="mt-3 text-base font-semibold leading-7">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{ar ? "Benefits" : "Benefits"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="sbc-card rounded-2xl p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <HiOutlineGift className="h-6 w-6" />
              </div>
              <p className="mt-3 text-base font-semibold leading-7">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-10">
        <div className="sbc-card rounded-3xl p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {ar ? "Start Your AI Visibility Today" : "Start Your AI Visibility Today"}
              </h2>
              <p className="mt-3 text-lg font-medium leading-8 text-(--muted-foreground)">
                {ar
                  ? "سجّل نشاطك في SBC وتأكد أن شركتك قابلة للاكتشاف في الجيل الجديد من البحث وأنظمة الذكاء الاصطناعي."
                  : "Register your business on SBC and make sure your company can be discovered by the next generation of search and AI systems."}
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href={`/${locale}/business-request`}
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  className: "min-w-[220px]",
                })}
              >
                {ar ? "سجل نشاطك الآن" : "Register Your Business"}
                <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
