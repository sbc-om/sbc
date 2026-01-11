import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineDeviceMobile,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
} from "react-icons/hi";

import { PublicPage } from "@/components/PublicPage";
import { LoyaltyScrollLottie } from "@/components/LoyaltyScrollLottie";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function LoyaltyAboutPage({
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
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "QR / Code" : "QR / Code",
      desc: ar
        ? "عرض النقاط بسرعة، وتحديثها من لوحة التحكم."
        : "Quickly show points and update them from your dashboard.",
    },
    {
      icon: HiOutlineUsers,
      title: ar ? "إدارة العملاء" : "Customer management",
      desc: ar
        ? "سجل بسيط للعملاء: الاسم، الهاتف، البريد، الملاحظات."
        : "A lightweight CRM: name, phone, email, and notes.",
    },
    {
      icon: HiOutlineChartBar,
      title: ar ? "نظام نقاط" : "Points system",
      desc: ar
        ? "أضف/خصم نقاط للعميل بحسب مشترياته (المرحلة الأولى)."
        : "Add/remove points per customer based on purchases (phase 1).",
    },
    {
      icon: HiOutlineShieldCheck,
      title: ar ? "مشاركة آمنة" : "Safe sharing",
      desc: ar
        ? "صفحة البطاقة العامة تعرض النقاط فقط—دون لوحة الإدارة."
        : "Public card page shows points only—no admin controls.",
    },
    {
      icon: HiOutlineSparkles,
      title: ar ? "واجهة أنيقة" : "Polished UI",
      desc: ar
        ? "تصميم نظيف وسريع ومناسب للموبايل."
        : "Clean, fast, mobile-friendly experience.",
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
      desc: ar
        ? "قم بتعديل النقاط (+/-) بحسب التعاملات."
        : "Adjust points (+/-) based on transactions.",
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
      <div className="relative overflow-hidden rounded-3xl border border-(--surface-border) bg-(--surface) p-8">
        <div className="absolute inset-0 -z-10 opacity-70" style={{
          background:
            "radial-gradient(900px circle at 20% 0%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(700px circle at 80% 20%, rgba(14,165,233,0.16), transparent 50%)",
        }} />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              {copy.title}
            </h1>
            <p className="mt-3 text-base leading-7 text-(--muted-foreground)">
              {copy.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/loyalty`}
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

          <div className="w-full sm:max-w-md">
            <LoyaltyScrollLottie className="py-0" />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionFeatures}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="sbc-card rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-3">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold">{f.title}</div>
                    <p className="mt-1 text-sm leading-7 text-(--muted-foreground)">{f.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionHow}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="sbc-card rounded-2xl p-6">
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

      <section className="mt-10 sbc-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold">{copy.sectionNotes}</h2>
        <ul className="mt-3 grid gap-2 text-sm text-(--muted-foreground)">
          <li>• {copy.note1}</li>
          <li>• {copy.note2}</li>
        </ul>
      </section>
    </PublicPage>
  );
}
