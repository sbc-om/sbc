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
    title: ar ? "برنامج الولاء" : "Loyalty Made Easy",
    subtitle: ar
      ? "كافئ عملاءك بنظام نقاط سهل وواضح. كل شيء في مكان واحد داخل SBC."
      : "Give points, keep customers happy, and bring them back more often. No complicated setup.",
    ctaManage: ar ? "إدارة الولاء" : "Start Now",
    ctaSeller: ar ? "دخول البائعين" : "Staff Login",
    ctaStore: ar ? "فتح المتجر" : "See Plans",
    backHome: ar ? "العودة للرئيسية" : "Back Home",
    sectionFeatures: ar ? "المزايا" : "Main Features",
    sectionShowcase: ar ? "لماذا هذا النظام؟" : "Why Teams Love It",
    sectionHow: ar ? "طريقة الاستخدام" : "How It Works",
    sectionNotes: ar ? "ملاحظات مهمة" : "Important Notes",
    note1: ar
      ? "تفعيل البرنامج يتم عبر الاشتراك من صفحة المتجر."
      : "Loyalty works after you activate a Store subscription.",
    note2: ar
      ? "يمكنك البدء مباشرة بعد التفعيل وإضافة العملاء بسهولة."
      : "Once active, you can add customers and start using points right away.",
  };

  const features = [
    {
      icon: HiOutlineDeviceMobile,
      title: ar ? "بطاقة رقمية" : "Digital Card for Every Customer",
      desc: ar
        ? "كل عميل يحصل على بطاقة رقمية برابط سهل المشاركة."
        : "Each customer gets a personal card with a simple share link.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "QR / Code" : "Fast QR Scan",
      desc: ar
        ? "مسح سريع وعرض مباشر للنقاط."
        : "Scan in seconds and see points instantly.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineUsers,
      title: ar ? "إدارة العملاء" : "Simple Customer List",
      desc: ar
        ? "إدارة بسيطة للعملاء: اسم، رقم، وباقي البيانات الأساسية."
        : "Save names and phone numbers in one clean place.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineChartBar,
      title: ar ? "نظام نقاط" : "Easy Points Control",
      desc: ar
        ? "إضافة أو خصم النقاط بسرعة حسب كل عملية."
        : "Add or remove points quickly after every purchase.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineShieldCheck,
      title: ar ? "مشاركة آمنة" : "Safe Access",
      desc: ar
        ? "صفحة العميل تعرض النقاط فقط، ولوحة الإدارة تبقى خاصة."
        : "Customers see their points only. Your admin panel stays private.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة أنيقة" : "Clean, Friendly Dashboard",
      desc: ar ? "واجهة واضحة وسريعة على الهاتف والكمبيوتر." : "Looks great and feels easy on mobile and desktop.",
      tone: "bg-accent-2/15 text-accent-2",
    },
  ];

  const showcase = [
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "تفعيل سريع" : "Set Up in Minutes",
      desc: ar
        ? "فعّل الاشتراك وابدأ خلال دقائق."
        : "Turn it on and start working almost immediately.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مكافآت واضحة" : "Rewards People Understand",
      desc: ar
        ? "نقاط واضحة وسهلة الفهم للعميل والبائع."
        : "Clear points system for both your team and your customers.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "مشاركة برابط" : "Share by Link or QR",
      desc: ar
        ? "أرسل الرابط للعميل ليشاهد نقاطه مباشرة."
        : "Send a link or QR so customers can check points right away.",
      tone: "bg-accent/15 text-accent",
    },
  ];

  const steps = [
    {
      n: "01",
      title: ar ? "فعّل الاشتراك" : "Activate Loyalty",
      desc: ar
        ? "اختر الخطة المناسبة من المتجر وفعّل البرنامج."
        : "Choose a Store plan and turn Loyalty on.",
    },
    {
      n: "02",
      title: ar ? "أضف عملاءك" : "Add Your Customers",
      desc: ar
        ? "أدخل بيانات العميل وسيتم إنشاء بطاقته تلقائياً."
        : "Enter customer details and their card is created automatically.",
    },
    {
      n: "03",
      title: ar ? "حدّث النقاط" : "Update Points",
      desc: ar ? "أضف أو خصم النقاط بسرعة حسب التعاملات." : "Add or remove points after each order.",
    },
    {
      n: "04",
      title: ar ? "شارك رابط البطاقة" : "Share the Card",
      desc: ar
        ? "أرسل رابط البطاقة ليطّلع العميل على نقاطه."
        : "Send the link so customers can view their points anytime.",
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
              className={buttonVariants({ variant: "primary", size: "lg", className: "min-w-[180px]" })}
            >
              {copy.ctaManage}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
            <Link
              href={`/${locale}/loyalty/staff`}
              className={buttonVariants({ variant: "secondary", size: "lg", className: "min-w-[180px]" })}
            >
              <HiOutlineUsers className="h-5 w-5" />
              {copy.ctaSeller}
            </Link>
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "secondary", size: "lg", className: "min-w-[180px]" })}
            >
              <HiOutlineGift className="h-5 w-5" />
              {copy.ctaStore}
            </Link>
            <Link
              href={`/${locale}`}
              className={buttonVariants({ variant: "secondary", size: "lg", className: "min-w-[180px]" })}
            >
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "" : "rotate-180")} />
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-accent/15 to-accent-2/15">
                  <Icon className="h-8 w-8 text-accent" />
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
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${c.tone}`}>
                    <Icon className="h-9 w-9" />
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
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${f.tone}`}>
                    <Icon className="h-9 w-9" />
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
