import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineChat,
  HiOutlineGlobeAlt,
  HiOutlineGift,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineViewGrid,
} from "react-icons/hi";
import { HiOutlineCpuChip } from "react-icons/hi2";

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
    title: ar ? "منصة نمو SBC" : "SBC Growth Platform",
    subtitle: ar
      ? "منصة متكاملة لزيادة المبيعات: اكتشاف عملاء جدد، التواصل السريع، رفع تكرار الشراء، وأتمتة التسويق."
      : "A complete growth system to get discovered, talk to customers, increase repeat sales, and automate marketing.",
    ctaPrimary: ar ? "افتح منصة النمو" : "Open Growth App",
    ctaDemo: ar ? "تحدث مع المبيعات" : "Talk to Sales",
    ctaHome: ar ? "الرئيسية" : "Back Home",
    sectionServices: ar ? "أعمدة النمو" : "Growth Pillars",
    sectionWhy: ar ? "مصممة لزيادة المبيعات" : "Built for Sales",
    sectionIncludes: ar ? "SBC يساعد نشاطك على:" : "SBC helps your business:",
    sectionPackages: ar ? "الباقات" : "Packages",
  };

  const services = [
    {
      icon: HiOutlineViewGrid,
      title: ar ? "اكتشفك عملاء أكثر" : "Get discovered",
      desc: ar
        ? "خلّي نشاطك يظهر في الدليل والموقع حتى يجدك العملاء القريبون بسرعة."
        : "Show up in SBC Directory and your website so nearby customers can find you fast.",
      href: `/${locale}/businesses`,
      hrefLabel: ar ? "زِد الظهور" : "Boost Visibility",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineChat,
      title: ar ? "تواصل مع العملاء" : "Talk to customers",
      desc: ar
        ? "شغّل واتساب وتلغرام من مكان واحد للرد السريع، إدارة المحادثات، وتنفيذ الحملات."
        : "Run WhatsApp and Telegram from one place for replies, conversations, and campaigns.",
      href: `/${locale}/services/app`,
      hrefLabel: ar ? "افتح الرسائل" : "Open Messaging",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "أعدهم للشراء" : "Bring them back",
      desc: ar
        ? "فعّل الولاء والمكافآت ليعود العملاء للشراء أكثر."
        : "Launch loyalty rewards so customers return more often and spend more.",
      href: `/${locale}/loyalty`,
      hrefLabel: ar ? "افتح الولاء" : "Open Loyalty",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "أتمتة التسويق" : "Automate marketing",
      desc: ar
        ? "ابنِ حملات وتسلسلات متابعة مرة واحدة ودع SBC يديرها تلقائياً."
        : "Set campaigns once, then let SBC run follow-ups and reminders automatically.",
      href: `/${locale}/services/app`,
      hrefLabel: ar ? "ابدأ الأتمتة" : "Start Automation",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "SBC Smart Card" : "SBC Smart Card",
      desc: ar
        ? "بطاقة ولاء مشتركة بين الأنشطة المشاركة: استخدمها في أي مكان، اكسب نقاط، واصرف نقاط."
        : "A shared loyalty card ecosystem: use anywhere, earn points, spend points.",
      href: `/${locale}/loyalty`,
      hrefLabel: ar ? "استكشف Smart Card" : "Explore Smart Card",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "موقع أعمالك" : "Website Builder",
      desc: ar
        ? "أنشئ موقعاً احترافياً بسرعة وحوّل الزيارات إلى فرص بيع."
        : "Launch a professional website fast and turn traffic into leads.",
      href: `/${locale}/dashboard/websites`,
      hrefLabel: ar ? "افتح منشئ المواقع" : "Open Website Builder",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineMail,
      title: ar ? "Business Email" : "Business Email",
      desc: ar
        ? "إيميل رسمي باسم نشاطك لثقة أعلى وتواصل احترافي."
        : "Branded business email to build trust and look professional.",
      href: `/${locale}/email/manage`,
      hrefLabel: ar ? "افتح البريد" : "Open Email",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineCpuChip,
      title: ar ? "AI Agent Builder" : "AI Agent Builder",
      desc: ar
        ? "أنشئ وكلاء ذكاء اصطناعي بدون كود لأتمتة المهام وعمليات المتابعة."
        : "Build no-code AI agents to automate operations and follow-ups.",
      href: `/${locale}/ai`,
      hrefLabel: ar ? "افتح AI Builder" : "Open AI Builder",
      tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
  ];

  const highlights = [
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "عملاء جدد أكثر" : "More new customers",
      desc: ar
        ? "الظهور في القنوات الصحيحة يجلب طلباً مستمراً لنشاطك."
        : "Discovery channels bring you steady, qualified local demand.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مبيعات تكرارية أعلى" : "Higher repeat sales",
      desc: ar
        ? "الولاء والحملات يرفعان احتمالية رجوع العميل والشراء مرة أخرى."
        : "Loyalty and campaigns increase customer return rate and basket size.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineMail,
      title: ar ? "ماركتينغ أبسط" : "Simpler marketing ops",
      desc: ar
        ? "بدل أدوات متفرقة، فريقك يدير كل شيء من منصة واحدة."
        : "Your team runs discovery, messaging, and retention from one platform.",
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
          <p className="mt-3 text-lg leading-8 font-medium text-(--muted-foreground)">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {user && isActive ? (
            <Link
              href={`/${locale}/services/app`}
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
              {ar ? "ابدأ النمو الآن" : "Start Growing"}
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
              <div key={service.title} className="sbc-card sbc-card--interactive flex flex-col rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${service.tone}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="text-lg font-semibold leading-7">{service.title}</h3>
                </div>
                <p className="mt-4 flex-1 text-base font-medium leading-8 text-(--muted-foreground)">{service.desc}</p>
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
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                </div>
                <p className="mt-4 text-base font-medium leading-8 text-(--muted-foreground)">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionIncludes}</h3>
        <ul className="mt-3 grid gap-3 text-base font-medium leading-8 text-(--muted-foreground)">
          <li>
            {ar
              ? "• اكتشفك عملاء جدد"
              : "• Get discovered"}
          </li>
          <li>
            {ar
              ? "• تواصل مع العملاء"
              : "• Talk to customers"}
          </li>
          <li>
            {ar
              ? "• أعدهم للشراء"
              : "• Bring them back"}
          </li>
          <li>
            {ar
              ? "• أتمتة التسويق"
              : "• Automate marketing"}
          </li>
          <li>
            {ar
              ? "• SBC Smart Card: استخدم في أي مكان، اكسب نقاط، واصرف نقاط."
              : "• SBC Smart Card: use anywhere, earn points, spend points."}{" "}
            <Link href={`/${locale}/loyalty`} className="text-accent hover:underline">
              {ar ? "افتح الولاء" : "Open Loyalty"}
            </Link>
          </li>
          <li>
            {ar
              ? "• Website Builder: موقع أعمالك الجاهز للبيع."
              : "• Website Builder: launch a sales-ready website."}
          </li>
          <li>
            {ar
              ? "• Business Email: بريد احترافي باسم نشاطك."
              : "• Business Email: branded professional email."}
          </li>
          <li>
            {ar
              ? "• AI Agent Builder: أتمتة ذكية بدون كود."
              : "• AI Agent Builder: no-code intelligent automation."}
          </li>
        </ul>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionPackages}</h3>
        <p className="mt-2 text-base font-medium text-(--muted-foreground)">
          {ar
            ? "اختر باقة شهرية أو 6 أشهر أو سنوية، وتقدر تمدد أو تغيّر الباقة بأي وقت."
            : "Choose monthly, 6-month, or yearly plans. You can switch or renew anytime."}
        </p>

        {!user ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/services`)}`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {ar ? "سجّل الدخول للشراء" : "Login to Buy"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/services`)}`}
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
                  <div className="mt-1 text-base font-medium text-(--muted-foreground)">
                    {formatStorePrice(product.price, locale as Locale)}
                  </div>
                  <p className="mt-3 text-base font-medium leading-8 text-(--muted-foreground)">{productText.description}</p>
                  <div className="mt-4">
                    <AddToCartButton productSlug={product.slug} locale={locale as Locale} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 text-sm font-medium text-(--muted-foreground)">
        {ar
          ? "SBC Smart Card فعّال الآن: استخدم البطاقة، اكسب نقاط، واصرف نقاط عبر الأنشطة المشاركة."
          : "SBC Smart Card is live now: use the card, earn points, and spend points across participating businesses."}
      </div>
    </PublicPage>
  );
}
