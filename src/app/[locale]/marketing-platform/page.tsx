import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineChat,
  HiOutlineGift,
  HiOutlineGlobeAlt,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineViewGrid,
} from "react-icons/hi";

import { PublicPage } from "@/components/PublicPage";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getProgramSubscriptionByUser,
  isProgramSubscriptionActive,
} from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  formatStorePrice,
  getStoreProductText,
  listStoreProducts,
} from "@/lib/store/products";

export const runtime = "nodejs";

export default async function MarketingPlatformPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  const ar = locale === "ar";
  const user = await getCurrentUser();
  if (user) {
    await getProgramSubscriptionByUser(user.id);
  }
  const isActive = user ? await isProgramSubscriptionActive(user.id) : false;

  const marketingProducts = (await listStoreProducts()).filter(
    (product) => product.program === "marketing",
  );

  const copy = {
    title: ar ? "خدمات ماركتينج" : "Marketing Services",
    subtitle: ar
      ? "خدمات كاملة للبزنس في صفحة واحدة: Business Directory، واجهات API خاصة لواتساب وتلغرام من تطويرنا، Website Builder، Business Email، وLoyalty Card."
      : "Everything your business needs in one place: Directory, our in-house WhatsApp & Telegram APIs, Website Builder, Business Email, and Loyalty Card.",
    ctaPrimary: ar ? "ابدأ الآن" : "Get Started",
    ctaDemo: ar ? "اطلب عرضاً" : "Request Demo",
    ctaHome: ar ? "الرئيسية" : "Back Home",
    sectionServices: ar ? "الخدمات الأساسية" : "Core Services",
    sectionWhy: ar ? "ليش هذي المنصة؟" : "Why It Helps",
    sectionIncludes: ar ? "ماذا ستحصل؟" : "What You Get",
    sectionPackages: ar ? "الباقات" : "Packages",
    sectionNotes: ar ? "ملاحظات" : "Notes",
  };

  const services = [
    {
      icon: HiOutlineViewGrid,
      title: ar ? "Business Directory" : "Business Directory",
      desc: ar
        ? "عرض نشاطك في دليل منظم يساعد العملاء يوصلوا لك بسرعة حسب التصنيف والموقع."
        : "Show your business in a clear directory so people can find you fast.",
      href: `/${locale}/businesses`,
      hrefLabel: ar ? "افتح الدليل" : "Open Directory",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineChat,
      title: ar ? "واتساب + تلغرام" : "WhatsApp + Telegram",
      desc: ar
        ? "واجهات API خاصة بواتساب وتلغرام من تطويرنا لإرسال الرسائل، إدارة المحادثات، وتشغيل الحملات من مكان واحد."
        : "Proprietary WhatsApp and Telegram APIs built by our team to run messaging, chat management, and campaigns from one place.",
      href: `/${locale}/marketing-platform/app`,
      hrefLabel: ar ? "افتح لوحة الرسائل" : "Open Messaging App",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "Website Builder" : "Website Builder",
      desc: ar
        ? "أنشئ موقع أعمالك بسرعة وعدّل المحتوى بسهولة بدون تعقيد تقني."
        : "Build your website quickly and update content anytime without hassle.",
      href: `/${locale}/dashboard/websites`,
      hrefLabel: ar ? "ابدأ بناء الموقع" : "Start Building",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineMail,
      title: ar ? "Business Email" : "Business Email",
      desc: ar
        ? "إيميل رسمي باسم نشاطك يعطي ثقة أعلى وتواصل احترافي مع العملاء."
        : "Use a professional email with your business name to build trust.",
      href: `/${locale}/email/manage`,
      hrefLabel: ar ? "إدارة الإيميل" : "Manage Email",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "Loyalty Card" : "Loyalty Card",
      desc: ar
        ? "نظام نقاط بسيط يشجع العملاء يرجعوا ويشتروا أكثر."
        : "Give points and rewards so customers come back more often.",
      href: `/${locale}/loyalty`,
      hrefLabel: ar ? "الذهاب لصفحة الولاء" : "Go to Loyalty Page",
      tone: "bg-accent/15 text-accent",
    },
  ];

  const highlights = [
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "بداية سريعة" : "Quick Start",
      desc: ar ? "ابدأ خلال دقائق." : "Set things up in minutes and start right away.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة سهلة" : "Simple UI",
      desc: ar
        ? "واجهة واضحة وسهلة لفريقك وعملائك."
        : "Simple and clean interface for your team and your customers.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "نمو أفضل" : "Better Growth",
      desc: ar
        ? "الدليل + الرسائل + الولاء = عملاء راجعين أكثر."
        : "Directory + messaging + loyalty helps you get more repeat customers.",
      tone: "bg-accent/15 text-accent",
    },
  ];

  return (
    <PublicPage>
      <section>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-(--muted-foreground)">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {user && isActive ? (
            <Link
              href={`/${locale}/marketing-platform/app`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {copy.ctaPrimary}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
          ) : (
            <Link
              href={`/${locale}/store?q=marketing`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {ar ? "اشترك الآن" : "Buy Subscription"}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
          )}
          <Link
            href={`/${locale}/contact`}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "min-w-[180px]",
            })}
          >
            <HiOutlineSparkles className="h-5 w-5" />
            {copy.ctaDemo}
          </Link>
          <Link
            href={`/${locale}`}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "min-w-[180px]",
            })}
          >
            <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "" : "rotate-180")} />
            {copy.ctaHome}
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionServices}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="sbc-card sbc-card--interactive rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${service.tone}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="font-semibold leading-6">{service.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">{service.desc}</p>
                <Link
                  href={service.href}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "md",
                    className: "mt-4 w-full",
                  })}
                >
                  {service.hrefLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionWhy}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="sbc-card sbc-card--interactive rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-(--muted-foreground)">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionIncludes}</h3>
        <ul className="mt-3 grid gap-2 text-sm leading-7 text-(--muted-foreground)">
          <li>
            {ar
              ? "• Business Directory: عرض نشاطك في الدليل لزيادة الوصول."
              : "• Business Directory: get discovered by more local customers."}
          </li>
          <li>
            {ar
              ? "• WhatsApp + Telegram: واجهات API خاصة مبنية من فريقنا للحملات والرسائل ومتابعة المحادثات."
              : "• WhatsApp + Telegram: in-house APIs built by our team for campaigns, messaging, and customer conversations."}
          </li>
          <li>
            {ar
              ? "• Website Builder: بناء موقعك بسرعة وبدون تعقيد."
              : "• Website Builder: launch your site fast and edit it easily."}
          </li>
          <li>
            {ar
              ? "• Business Email: إيميل رسمي لبزنسك بثقة أعلى."
              : "• Business Email: look more professional with branded email."}
          </li>
          <li>
            {ar
              ? "• Loyalty Card: نظام نقاط بسيط يزيد ولاء العملاء."
              : "• Loyalty Card: reward customers and increase repeat orders."}{" "}
            <Link href={`/${locale}/loyalty`} className="text-accent hover:underline">
              {ar ? "اذهب لصفحة الولاء" : "Open Loyalty Page"}
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionPackages}</h3>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          {ar
            ? "اختر باقة شهرية أو 6 أشهر أو سنوية، وتقدر تمدد أو تغيّر الباقة بأي وقت."
            : "Choose monthly, 6-month, or yearly plans. You can switch or renew anytime."}
        </p>

        {!user ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/marketing-platform`)}`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {ar ? "سجّل الدخول للشراء" : "Login to Buy"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/marketing-platform`)}`}
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {ar ? "إنشاء حساب" : "Create Account"}
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {marketingProducts.map((product) => {
              const productText = getStoreProductText(product, locale as Locale);
              return (
                <div key={product.slug} className="sbc-card rounded-2xl p-5">
                  <div className="font-semibold">{productText.name}</div>
                  <div className="mt-1 text-sm text-(--muted-foreground)">
                    {formatStorePrice(product.price, locale as Locale)}
                  </div>
                  <p className="mt-3 text-sm text-(--muted-foreground)">{productText.description}</p>
                  <div className="mt-4">
                    <AddToCartButton productSlug={product.slug} locale={locale as Locale} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 text-xs text-(--muted-foreground)">
        {ar
          ? "ملاحظة: تفاصيل التنفيذ النهائي لتكامل واتساب/تلغرام تعتمد على احتياج نشاطك."
          : "Note: WhatsApp and Telegram setup details depend on what your business needs."}
      </div>
    </PublicPage>
  );
}
