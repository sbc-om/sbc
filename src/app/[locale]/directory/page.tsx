import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listBusinesses } from "@/lib/db/businesses";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";
  const title = ar ? "دليل الأعمال" : "Business Directory";
  const description = ar
    ? "سجّل نشاطك التجاري وانضم لدليل الأعمال الموثوق. اجعل العملاء القريبين يكتشفونك بسهولة."
    : "Register your business and join the trusted directory. Get discovered by nearby customers easily.";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: ar ? "ar_OM" : "en_US",
      url: `/${locale}/directory`,
      title,
      description,
    },
  };
}

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const ar = locale === "ar";
  const businesses = await listBusinesses();
  const count = businesses.length;

  const features = [
    {
      Icon: HiOutlineGlobeAlt,
      title: ar ? "صفحة مخصصة لنشاطك" : "Dedicated Business Page",
      desc: ar
        ? "احصل على صفحة احترافية تعرض خدماتك ومنتجاتك وبيانات التواصل."
        : "Get a professional page showcasing your services, products, and contact info.",
    },
    {
      Icon: HiOutlineMapPin,
      title: ar ? "الظهور على الخريطة" : "Map Visibility",
      desc: ar
        ? "يظهر نشاطك على خريطة الدليل ليجدك العملاء القريبون بسهولة."
        : "Your business appears on the directory map so nearby customers can find you easily.",
    },
    {
      Icon: HiOutlineShieldCheck,
      title: ar ? "شارة التوثيق" : "Verified Badge",
      desc: ar
        ? "نشاطك يحمل شارة التوثيق التي تزيد ثقة العملاء."
        : "Your business gets a verified badge that increases customer trust.",
    },
    {
      Icon: HiOutlineDevicePhoneMobile,
      title: ar ? "بطاقات الأعمال الرقمية" : "Digital Business Cards",
      desc: ar
        ? "أنشئ بطاقات أعمال رقمية وشاركها بسهولة مع عملائك."
        : "Create digital business cards and share them easily with your customers.",
    },
  ];

  return (
    <PublicPage>
      {/* Hero */}
      <section className="text-center py-12 sm:py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/12 ring-1 ring-indigo-500/18 mb-6">
          <HiOutlineBuildingOffice2 className="h-8 w-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {ar ? "دليل الأعمال" : "Business Directory"}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-(--muted-foreground) max-w-xl mx-auto">
          {ar
            ? "سجّل نشاطك التجاري واجعل العملاء القريبين يكتشفونك بسهولة عبر البحث والخريطة."
            : "Register your business and get discovered by nearby customers through search and map."}
        </p>

        {count > 0 && (
          <p className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-300">
            {ar
              ? `${count} نشاط تجاري مسجّل حالياً`
              : `${count} businesses already listed`}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/store?q=directory`}
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            {ar ? "اشترِ باقة الآن" : "Get Started"}
          </Link>
          <Link
            href={`/${locale}/businesses`}
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            {ar ? "استكشف الدليل" : "Browse Directory"}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="sbc-card rounded-2xl p-6">
              <f.Icon className="h-7 w-7 text-indigo-600 dark:text-indigo-300 mb-3" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-(--muted-foreground)">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 text-center">
        <div className="sbc-card rounded-2xl p-8">
          <h2 className="text-xl font-semibold">
            {ar ? "جاهز لتسجيل نشاطك؟" : "Ready to list your business?"}
          </h2>
          <p className="mt-2 text-sm text-(--muted-foreground) max-w-md mx-auto">
            {ar
              ? "اشترِ باقة دليل الأعمال من المتجر ثم قدّم طلب تسجيل نشاطك."
              : "Purchase a directory package from the store, then submit your business registration request."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/store?q=directory`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "اذهب للمتجر" : "Go to Store"}
            </Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
