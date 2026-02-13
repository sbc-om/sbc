import { notFound } from "next/navigation";
import Link from "next/link";
import { HiOutlineGlobeAlt } from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getWebsiteById, updateWebsite, packageFromProductSlug } from "@/lib/db/websites";
import { getUserActiveSubscriptionForProgram } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { WebsiteSettingsClient } from "./WebsiteSettingsClient";

export const runtime = "nodejs";

export default async function WebsiteSettingsPage({
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

  return (
    <AppPage>
      <div className="flex items-center gap-2 text-sm text-(--muted-foreground) mb-4">
        <Link href={`/${locale}/dashboard/websites`} className="hover:text-foreground transition">
          {ar ? "مواقعي" : "My Websites"}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/dashboard/websites/${id}`} className="hover:text-foreground transition">
          {website.title[locale as Locale] || website.title.en}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{ar ? "الإعدادات" : "Settings"}</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3 mb-8">
        <HiOutlineGlobeAlt className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
        {ar ? "إعدادات الموقع" : "Website Settings"}
      </h1>

      <WebsiteSettingsClient locale={locale as Locale} website={website} />
    </AppPage>
  );
}
