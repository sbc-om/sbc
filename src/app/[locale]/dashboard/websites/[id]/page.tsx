import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineCog6Tooth,
  HiOutlineEye,
  HiOutlineGlobeAlt,
  HiArrowUpRight,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getWebsiteById, listWebsitePages, updateWebsite, packageFromProductSlug } from "@/lib/db/websites";
import { getUserActiveSubscriptionForProgram } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { WebsiteEditorClient } from "./WebsiteEditorClient";

export const runtime = "nodejs";

export default async function WebsiteEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  let website = await getWebsiteById(id);
  if (!website || (website.ownerId !== user.id && user.role !== "admin")) {
    notFound();
  }

  // Auto-sync package from user's active subscription
  const sub = await getUserActiveSubscriptionForProgram(website.ownerId, "website");
  if (sub) {
    const correctPkg = packageFromProductSlug(sub.productSlug);
    if (correctPkg !== website.package) {
      website = await updateWebsite(website.id, { package: correctPkg });
    }
  }

  const pages = await listWebsitePages(id);

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-(--muted-foreground) mb-2">
            <Link
              href={`/${locale}/dashboard/websites`}
              className="hover:text-foreground transition"
            >
              {ar ? "مواقعي" : "My Websites"}
            </Link>
            <span>/</span>
            <span className="truncate font-medium text-foreground">
              {website.title[locale as Locale] || website.title.en}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            <HiOutlineGlobeAlt className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
            {website.title[locale as Locale] || website.title.en}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "صفحات الموقع ومحتوى كل صفحة" : "Manage pages and content"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/dashboard/websites/${id}/settings`}
            className="inline-flex items-center gap-2 rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-semibold hover:bg-(--chip-bg)/80 transition"
          >
            <HiOutlineCog6Tooth className="h-4 w-4" />
            {ar ? "الإعدادات" : "Settings"}
          </Link>
          <a
            href={`/${locale}/site/${website.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-semibold hover:bg-(--chip-bg)/80 transition"
          >
            <HiOutlineEye className="h-4 w-4" />
            {ar ? "معاينة" : "Preview"}
            <HiArrowUpRight className="h-3 w-3" />
          </a>
          {website.isPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {ar ? "منشور" : "Published"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              {ar ? "مسودة" : "Draft"}
            </span>
          )}
        </div>
      </div>

      {/* Page Builder */}
      <div className="mt-8">
        <WebsiteEditorClient
          locale={locale as Locale}
          websiteId={id}
          initialPages={pages}
          websitePackage={website.package}
        />
      </div>
    </AppPage>
  );
}
