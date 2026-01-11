import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineDeviceMobile,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineGift,
  HiOutlineArrowRight,
} from "react-icons/hi";

import { PublicPage } from "@/components/PublicPage";
import { LogoScrollLottie } from "@/components/LogoScrollLottie";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function LoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const copy = {
    title: ar ? "بطاقة الولاء" : "Loyalty Card",
    subtitle: ar
      ? "حوّل عملاءك إلى زبائن دائمين عبر بطاقة ولاء رقمية ونظام نقاط بسيط—كل شيء داخل SBC."
      : "Turn visitors into repeat customers with a clean digital loyalty card + a simple points system—inside SBC.",
    ctaManage: ar ? "إدارة الولاء" : "Manage loyalty",
    ctaStore: ar ? "فتح المتجر" : "Open store",
    backHome: ar ? "العودة للرئيسية" : "Back to home",
    sectionFeatures: ar ? "ماذا ستحصل؟" : "What you get",
    sectionShowcase: ar ? "مميزات بشكل بصري" : "Designed for the real world",
    sectionHow: ar ? "كيف تعمل؟" : "How it works",
    sectionNotes: ar ? "ملاحظات" : "Notes",
    note1: ar
      ? "شراء الاشتراك وتفعيله يتم من خلال المتجر (Store)."
      : "Subscription purchase & activation is handled in the Store.",
    note2: ar
      ? "إضافة البطاقة إلى Apple Wallet/Google Wallet ستأتي في مرحلة لاحقة."
      : "Apple Wallet / Google Wallet export will be added in a later phase.",
  };

  const features = [
    {
      icon: HiOutlineDeviceMobile,
      title: ar ? "بطاقة رقمية" : "Digital card",
      desc: ar
        ? "بطاقة لكل عميل يمكن عرضها عبر رابط عام (ومستقبلاً إضافتها للمحفظة)."
        : "A card per customer, viewable via a public link (wallet support later).",
      image:
        "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "هاتف مع تطبيق" : "Phone with an app",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "QR / Code" : "QR / Code",
      desc: ar
        ? "عرض النقاط بسرعة، وتحديثها من لوحة التحكم."
        : "Quickly show points and update them from your dashboard.",
      image:
        "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "لوحة تحكم" : "Dashboard",
    },
    {
      icon: HiOutlineUsers,
      title: ar ? "إدارة العملاء" : "Customer management",
      desc: ar
        ? "سجل بسيط للعملاء: الاسم، الهاتف، البريد، الملاحظات."
        : "A lightweight CRM: name, phone, email, and notes.",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "فريق عمل" : "Team collaboration",
    },
    {
      icon: HiOutlineChartBar,
      title: ar ? "نظام نقاط" : "Points system",
      desc: ar
        ? "أضف/خصم نقاط للعميل بحسب مشترياته (المرحلة الأولى)."
        : "Add/remove points per customer based on purchases (phase 1).",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "تحليلات" : "Analytics",
    },
    {
      icon: HiOutlineShieldCheck,
      title: ar ? "مشاركة آمنة" : "Safe sharing",
      desc: ar
        ? "صفحة البطاقة العامة تعرض النقاط فقط—دون لوحة الإدارة."
        : "Public card page shows points only—no admin controls.",
      image:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "أمان" : "Security",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة أنيقة" : "Polished UI",
      desc: ar ? "تصميم نظيف وسريع ومناسب للموبايل." : "Clean, fast, mobile-friendly experience.",
      image:
        "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "تصميم واجهة" : "Interface design",
    },
  ];

  const showcase = [
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "تفعيل سريع" : "Fast onboarding",
      desc: ar
        ? "ابدأ خلال دقائق: فعّل من المتجر ثم أضف عملاءك مباشرة."
        : "Start in minutes: activate in the store, then add customers right away.",
      image:
        "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "فريق يعمل على لوحة تحكم" : "Team working with a dashboard",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مكافآت واضحة" : "Rewards that make sense",
      desc: ar
        ? "نقاط بسيطة وواضحة—بدون تعقيد وبلا خطوات كثيرة."
        : "Simple, transparent points—no complicated rules or clutter.",
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "منتج على طاولة" : "Product on a table",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "مشاركة برابط" : "Share by link",
      desc: ar
        ? "ارسل رابط البطاقة لعرض النقاط—بواجهة موبايل جميلة."
        : "Send a card link to show points—beautiful on mobile.",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
      alt: ar ? "شخص يستخدم هاتف" : "Person using a phone",
    },
  ];

  const steps = [
    {
      n: "01",
      title: ar ? "اشترِ من المتجر" : "Purchase in the Store",
      desc: ar
        ? "اختر خطة الولاء من المتجر وأكمل الدفع (بوابة افتراضية حالياً)."
        : "Pick a Loyalty plan in the store and complete checkout (fake gateway for now).",
    },
    {
      n: "02",
      title: ar ? "أضف عملاءك" : "Add your customers",
      desc: ar
        ? "أدخل بيانات العميل—وسيتم إصدار بطاقة لكل عميل تلقائياً."
        : "Create customers—each one automatically gets a card.",
    },
    {
      n: "03",
      title: ar ? "حدّث النقاط" : "Update points",
      desc: ar ? "قم بتعديل النقاط (+/-) بحسب التعاملات." : "Adjust points (+/-) based on transactions.",
    },
    {
      n: "04",
      title: ar ? "شارك رابط البطاقة" : "Share the card link",
      desc: ar
        ? "أرسل رابط البطاقة للعميل ليشاهد نقاطه الحالية."
        : "Send the public card link so customers can view their points.",
    },
  ];

  return (
    <PublicPage>
      <section className="relative animate-in slide-in-from-bottom-6">
        <div className="absolute -top-24 left-1/2 h-72 w-160 -translate-x-1/2 rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-160 -translate-x-1/2 rounded-full bg-accent-2/12 blur-3xl" />

        <div className="text-center">
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            <span className="bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              {copy.title}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-(--muted-foreground)">
            {copy.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/loyalty/manage`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {copy.ctaManage}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {copy.ctaStore}
            </Link>
            <Link
              href={`/${locale}`}
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              {copy.backHome}
            </Link>
          </div>
        </div>

        {/* Centered scroll-controlled animation (uses logo.json via LogoScrollLottie) */}
        <div className="mt-10 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-r from-accent/10 to-accent-2/10 blur-2xl" />
            <div className="rounded-3xl p-2 sm:p-3">
              <LogoScrollLottie className="py-0 max-w-none" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: HiOutlineUsers, label: ar ? "CRM خفيف" : "Lightweight CRM" },
            { icon: HiOutlineChartBar, label: ar ? "نقاط" : "Points" },
            { icon: HiOutlineShieldCheck, label: ar ? "مشاركة آمنة" : "Safe sharing" },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <div key={chip.label} className="sbc-card sbc-card--interactive rounded-2xl p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface)">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="mt-2 text-sm font-medium">{chip.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 animate-in slide-in-from-bottom-6 delay-150">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionShowcase}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {showcase.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="sbc-card sbc-card--interactive overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Icon className="h-4 w-4" />
                      <span>{c.title}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-7 text-(--muted-foreground)">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 animate-in slide-in-from-bottom-6 delay-150">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionFeatures}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="sbc-card sbc-card--interactive group overflow-hidden rounded-2xl">
                <div className="relative aspect-video">
                  <Image
                    src={f.image}
                    alt={f.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Icon className="h-4 w-4" />
                      <span>{f.title}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-sm leading-7 text-(--muted-foreground)">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 animate-in slide-in-from-bottom-6 delay-150">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionHow}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="sbc-card sbc-card--interactive rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-sm font-semibold text-(--muted-foreground)">{s.n}</div>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <p className="mt-1 text-sm leading-7 text-(--muted-foreground)">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 sbc-card rounded-2xl p-6 animate-in slide-in-from-bottom-6 delay-300">
        <h2 className="text-lg font-semibold">{copy.sectionNotes}</h2>
        <ul className="mt-3 grid gap-2 text-sm text-(--muted-foreground)">
          <li>• {copy.note1}</li>
          <li>• {copy.note2}</li>
        </ul>
      </section>
    </PublicPage>
  );
}
