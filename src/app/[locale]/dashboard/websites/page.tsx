import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineGlobeAlt,
  HiOutlinePencilSquare,
  HiOutlineEye,
  HiOutlinePlusCircle,
  HiOutlineCog6Tooth,
  HiArrowUpRight,
  HiCheckBadge,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { listWebsitesByOwner } from "@/lib/db/websites";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { WEBSITE_PACKAGE_LIMITS } from "@/lib/db/types";

export const runtime = "nodejs";

export default async function DashboardWebsitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const hasSub = await hasActiveSubscription(user.id, "website");
  const websites = await listWebsitesByOwner(user.id);

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "مواقعي الإلكترونية" : "My Websites"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "إدارة وتصميم مواقعك الإلكترونية" : "Manage and design your websites"}
          </p>
        </div>

        {hasSub && (
          <Link
            href={`/${locale}/dashboard/websites/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-(--accent-foreground)"
          >
            <HiOutlinePlusCircle className="h-4 w-4" />
            {ar ? "موقع جديد" : "New Website"}
          </Link>
        )}
      </div>

      {!hasSub ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-(--surface-border) p-10 text-center">
          <HiOutlineGlobeAlt className="mx-auto h-16 w-16 text-(--muted-foreground) opacity-30" />
          <h2 className="mt-4 text-lg font-semibold">
            {ar ? "ابدأ ببناء موقعك الإلكتروني" : "Start Building Your Website"}
          </h2>
          <p className="mt-2 text-sm text-(--muted-foreground) max-w-md mx-auto">
            {ar
              ? "اشترك في إحدى باقات المواقع الإلكترونية لبدء تصميم موقعك الخاص مع دعم الدومين المخصص والقوالب الاحترافية."
              : "Subscribe to a website package to start designing your own website with custom domain support and professional templates."}
          </p>
          <Link
            href={`/${locale}/store?q=website`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-(--accent-foreground)"
          >
            {ar ? "عرض الباقات" : "View Packages"}
            <HiArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : websites.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-(--surface-border) p-10 text-center">
          <HiOutlineGlobeAlt className="mx-auto h-16 w-16 text-(--muted-foreground) opacity-30" />
          <h2 className="mt-4 text-lg font-semibold">
            {ar ? "لا يوجد مواقع بعد" : "No Websites Yet"}
          </h2>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar ? "أنشئ أول موقع إلكتروني لك" : "Create your first website"}
          </p>
          <Link
            href={`/${locale}/dashboard/websites/new`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-(--accent-foreground)"
          >
            <HiOutlinePlusCircle className="h-4 w-4" />
            {ar ? "إنشاء موقع" : "Create Website"}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((site) => {
            const limits = WEBSITE_PACKAGE_LIMITS[site.package];
            return (
              <div
                key={site.id}
                className="group relative overflow-hidden rounded-2xl border-2 border-(--surface-border) bg-(--surface) p-6 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md hover:border-(--accent)/30"
              >
                {/* Status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold tracking-tight">
                      {site.title[locale as Locale] || site.title.en || site.slug}
                    </h3>
                    <p className="mt-0.5 text-xs text-(--muted-foreground) font-mono">
                      /{site.slug}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      site.isPublished
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${site.isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {site.isPublished ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}
                  </span>
                </div>

                {/* Info chips */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="sbc-chip rounded-full px-2.5 py-1 capitalize">
                    📦 {site.package}
                  </span>
                  <span className="sbc-chip rounded-full px-2.5 py-1">
                    🎨 {site.templateId}
                  </span>
                  {site.customDomain && (
                    <span className="sbc-chip rounded-full px-2.5 py-1">
                      🌐 {site.customDomain}
                    </span>
                  )}
                </div>

                {/* Tagline */}
                {site.tagline && (
                  <p className="mt-3 line-clamp-2 text-sm text-(--muted-foreground)">
                    {site.tagline[locale as Locale] || site.tagline.en}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-5 flex items-center gap-2">
                  <Link
                    href={`/${locale}/dashboard/websites/${site.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-(--accent-foreground)"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                    {ar ? "تعديل" : "Edit"}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard/websites/${site.id}/settings`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-(--chip-bg) px-3 py-1.5 text-xs font-semibold"
                  >
                    <HiOutlineCog6Tooth className="h-3.5 w-3.5" />
                    {ar ? "إعدادات" : "Settings"}
                  </Link>
                  {site.isPublished && (
                    <Link
                      href={`/${locale}/site/${site.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-(--chip-bg) px-3 py-1.5 text-xs font-semibold text-(--muted-foreground) hover:text-foreground"
                    >
                      <HiOutlineEye className="h-3.5 w-3.5" />
                      {ar ? "معاينة" : "Preview"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
