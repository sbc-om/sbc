import Link from "next/link";
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
    title: ar ? "بطاقة الولاء" : "Loyalty Platform",
    subtitle: ar
      ? "حوّل عملاءك إلى زبائن دائمين عبر بطاقة ولاء رقمية ونظام نقاط بسيط—كل شيء داخل SBC."
      : "Drive customer retention with digital loyalty cards and intelligent points management.",
    ctaManage: ar ? "إدارة الولاء" : "Get Started",
    ctaStore: ar ? "فتح المتجر" : "View Plans",
    backHome: ar ? "العودة للرئيسية" : "Home",
    sectionFeatures: ar ? "ماذا ستحصل؟" : "Core Features",
    sectionShowcase: ar ? "مميزات بشكل بصري" : "Why Choose Us",
    sectionHow: ar ? "كيف تعمل؟" : "Quick Setup",
    sectionNotes: ar ? "ملاحظات" : "Important Notes",
    note1: ar
      ? "شراء الاشتراك وتفعيله يتم من خلال المتجر (Store)."
      : "Activate via Store subscription.",
    note2: ar
      ? "إضافة البطاقة إلى Apple Wallet/Google Wallet ستأتي في مرحلة لاحقة."
      : "Wallet integration coming soon.",
  };

  const features = [
    {
      icon: HiOutlineDeviceMobile,
      title: ar ? "بطاقة رقمية" : "Digital Cards",
      desc: ar
        ? "بطاقة لكل عميل يمكن عرضها عبر رابط عام (ومستقبلاً إضافتها للمحفظة)."
        : "Unique digital card per customer with shareable link.",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "QR / Code" : "QR Integration",
      desc: ar
        ? "عرض النقاط بسرعة، وتحديثها من لوحة التحكم."
        : "Real-time points display and updates via dashboard.",
    },
    {
      icon: HiOutlineUsers,
      title: ar ? "إدارة العملاء" : "CRM Built-in",
      desc: ar
        ? "سجل بسيط للعملاء: الاسم، الهاتف، البريد، الملاحظات."
        : "Lightweight customer database with essential fields.",
    },
    {
      icon: HiOutlineChartBar,
      title: ar ? "نظام نقاط" : "Points Engine",
      desc: ar
        ? "أضف/خصم نقاط للعميل بحسب مشترياته (المرحلة الأولى)."
        : "Flexible point allocation based on transactions.",
    },
    {
      icon: HiOutlineShieldCheck,
      title: ar ? "مشاركة آمنة" : "Secure Sharing",
      desc: ar
        ? "صفحة البطاقة العامة تعرض النقاط فقط—دون لوحة الإدارة."
        : "Public view displays points only—admin access protected.",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة أنيقة" : "Modern Interface",
      desc: ar ? "تصميم نظيف وسريع ومناسب للموبايل." : "Fast, responsive design optimized for mobile.",
    },
  ];

  const showcase = [
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "تفعيل سريع" : "Instant Setup",
      desc: ar
        ? "ابدأ خلال دقائق: فعّل من المتجر ثم أضف عملاءك مباشرة."
        : "Activate and start adding customers in minutes.",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مكافآت واضحة" : "Clear Rewards",
      desc: ar
        ? "نقاط بسيطة وواضحة—بدون تعقيد وبلا خطوات كثيرة."
        : "Transparent point system with zero complexity.",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "مشاركة برابط" : "Easy Sharing",
      desc: ar
        ? "ارسل رابط البطاقة لعرض النقاط—بواجهة موبايل جميلة."
        : "Share card links with optimized mobile experience.",
    },
  ];

  const steps = [
    {
      n: "01",
      title: ar ? "اشترِ من المتجر" : "Subscribe",
      desc: ar
        ? "اختر خطة الولاء من المتجر وأكمل الدفع (بوابة افتراضية حالياً)."
        : "Select a plan and activate your loyalty program.",
    },
    {
      n: "02",
      title: ar ? "أضف عملاءك" : "Add Customers",
      desc: ar
        ? "أدخل بيانات العميل—وسيتم إصدار بطاقة لكل عميل تلقائياً."
        : "Import customers—cards generated automatically.",
    },
    {
      n: "03",
      title: ar ? "حدّث النقاط" : "Manage Points",
      desc: ar ? "قم بتعديل النقاط (+/-) بحسب التعاملات." : "Award or deduct points per transaction.",
    },
    {
      n: "04",
      title: ar ? "شارك رابط البطاقة" : "Share Cards",
      desc: ar
        ? "أرسل رابط البطاقة للعميل ليشاهد نقاطه الحالية."
        : "Distribute card links to customers for instant access.",
    },
  ];

  return (
    <PublicPage>
      <section className="relative animate-in slide-in-from-bottom-6">
        <div className="absolute -top-24 left-1/2 h-72 w-160 -translate-x-1/2 rounded-full bg-accent/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-160 -translate-x-1/2 rounded-full bg-accent-2/12 blur-3xl pointer-events-none" />

        <div className="relative text-center">
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            <span className="bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              {copy.title}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-(--muted-foreground)">
            {copy.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 relative z-10">
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
            { icon: HiOutlineUsers, label: ar ? "CRM خفيف" : "Built-in CRM" },
            { icon: HiOutlineChartBar, label: ar ? "نقاط" : "Smart Points" },
            { icon: HiOutlineShieldCheck, label: ar ? "مشاركة آمنة" : "Secure Access" },
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
              <div key={c.title} className="sbc-card sbc-card--interactive rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface)">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold">{c.title}</h3>
                </div>
                <p className="text-sm leading-7 text-(--muted-foreground)">{c.desc}</p>
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
              <div key={f.title} className="sbc-card sbc-card--interactive rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface)">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                </div>
                <p className="text-sm leading-7 text-(--muted-foreground)">{f.desc}</p>
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
