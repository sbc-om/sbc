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
    title: ar ? "برنامج الولاء" : "Loyalty Program",
    subtitle: ar
      ? "كافئ عملاءك بنظام نقاط سهل وواضح. كل شيء في مكان واحد داخل SBC."
      : "Reward your customers with a simple points system. Everything in one place.",
    ctaManage: ar ? "إدارة الولاء" : "Get Started",
    ctaSeller: ar ? "دخول البائعين" : "Seller Login",
    ctaStore: ar ? "فتح المتجر" : "View Plans",
    backHome: ar ? "العودة للرئيسية" : "Home",
    sectionFeatures: ar ? "المزايا" : "Features",
    sectionShowcase: ar ? "لماذا هذا النظام؟" : "Why This Program",
    sectionHow: ar ? "طريقة الاستخدام" : "How It Works",
    sectionNotes: ar ? "ملاحظات مهمة" : "Important Notes",
    note1: ar
      ? "تفعيل البرنامج يتم عبر الاشتراك من صفحة المتجر."
      : "Activate the program from the Store subscription page.",
    note2: ar
      ? "يمكنك البدء مباشرة بعد التفعيل وإضافة العملاء بسهولة."
      : "You can start right away after activation and add customers easily.",
  };

  const features = [
    {
      icon: HiOutlineDeviceMobile,
      title: ar ? "بطاقة رقمية" : "Digital Cards",
      desc: ar
        ? "كل عميل يحصل على بطاقة رقمية برابط سهل المشاركة."
        : "Each customer gets a digital card with a shareable link.",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "QR / Code" : "QR Integration",
      desc: ar
        ? "مسح سريع وعرض مباشر للنقاط."
        : "Quick scan with instant points view.",
    },
    {
      icon: HiOutlineUsers,
      title: ar ? "إدارة العملاء" : "CRM Built-in",
      desc: ar
        ? "إدارة بسيطة للعملاء: اسم، رقم، وباقي البيانات الأساسية."
        : "Simple customer management with essential info.",
    },
    {
      icon: HiOutlineChartBar,
      title: ar ? "نظام نقاط" : "Points Engine",
      desc: ar
        ? "إضافة أو خصم النقاط بسرعة حسب كل عملية."
        : "Add or deduct points quickly for each transaction.",
    },
    {
      icon: HiOutlineShieldCheck,
      title: ar ? "مشاركة آمنة" : "Secure Sharing",
      desc: ar
        ? "صفحة العميل تعرض النقاط فقط، ولوحة الإدارة تبقى خاصة."
        : "Customer page shows points only while admin access stays protected.",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة أنيقة" : "Modern Interface",
      desc: ar ? "واجهة واضحة وسريعة على الهاتف والكمبيوتر." : "Clean and fast interface on mobile and desktop.",
    },
  ];

  const showcase = [
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "تفعيل سريع" : "Instant Setup",
      desc: ar
        ? "فعّل الاشتراك وابدأ خلال دقائق."
        : "Activate and start in minutes.",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مكافآت واضحة" : "Clear Rewards",
      desc: ar
        ? "نقاط واضحة وسهلة الفهم للعميل والبائع."
        : "Simple and clear points for both staff and customers.",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "مشاركة برابط" : "Easy Sharing",
      desc: ar
        ? "أرسل الرابط للعميل ليشاهد نقاطه مباشرة."
        : "Share the link so customers can check points instantly.",
    },
  ];

  const steps = [
    {
      n: "01",
      title: ar ? "فعّل الاشتراك" : "Activate",
      desc: ar
        ? "اختر الخطة المناسبة من المتجر وفعّل البرنامج."
        : "Choose your plan from the Store and activate.",
    },
    {
      n: "02",
      title: ar ? "أضف عملاءك" : "Add Customers",
      desc: ar
        ? "أدخل بيانات العميل وسيتم إنشاء بطاقته تلقائياً."
        : "Add customer details and the card is created automatically.",
    },
    {
      n: "03",
      title: ar ? "حدّث النقاط" : "Manage Points",
      desc: ar ? "أضف أو خصم النقاط بسرعة حسب التعاملات." : "Add or deduct points for each transaction.",
    },
    {
      n: "04",
      title: ar ? "شارك رابط البطاقة" : "Share Cards",
      desc: ar
        ? "أرسل رابط البطاقة ليطّلع العميل على نقاطه."
        : "Share the card link so customers can view their points.",
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
              href={`/${locale}/loyalty/staff`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {copy.ctaSeller}
            </Link>
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "ghost", size: "md" })}
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
