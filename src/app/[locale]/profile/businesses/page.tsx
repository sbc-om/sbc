import { notFound } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listBusinessRequestsByUser } from "@/lib/db/businessRequests";
import { listUserProgramSubscriptions } from "@/lib/db/subscriptions";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { MyBusinessesList } from "./MyBusinessesList";

export const runtime = "nodejs";

export default async function ProfileBusinessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireUser(locale as Locale);
  const [businesses, categories, requests, subscriptions] = await Promise.all([
    listBusinessesByOwner(auth.id),
    listCategories(),
    listBusinessRequestsByUser(auth.id),
    listUserProgramSubscriptions(auth.id),
  ]);

  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const now = Date.now();
  const directoryLicenses = subscriptions.filter((subscription) => subscription.program === "directory");
  const businessLicensesByBusinessId = Object.fromEntries(
    directoryLicenses
      .filter((subscription) => subscription.assignedBusinessId)
      .map((subscription) => [
        subscription.assignedBusinessId as string,
        {
          expiresAt: subscription.expiresAt,
          isActive: subscription.isActive && new Date(subscription.expiresAt).getTime() > now,
        },
      ]),
  );
  const requestLicensesByRequestId = Object.fromEntries(
    directoryLicenses
      .filter((subscription) => subscription.assignedRequestId)
      .map((subscription) => [
        subscription.assignedRequestId as string,
        {
          expiresAt: subscription.expiresAt,
          isActive: subscription.isActive && new Date(subscription.expiresAt).getTime() > now,
        },
      ]),
  );

  return (
    <AppPage>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-2 text-sm text-(--muted-foreground) hover:text-foreground transition-colors"
        >
          {locale === "ar" ? <IoArrowForward className="w-5 h-5" /> : <IoArrowBack className="w-5 h-5" />}
          {locale === "ar" ? "رجوع" : "Back"}
        </Link>
      </div>

      <MyBusinessesList
        locale={locale as Locale}
        businesses={businesses}
        requests={requests}
        categoriesById={categoriesById}
        businessLicensesByBusinessId={businessLicensesByBusinessId}
        requestLicensesByRequestId={requestLicensesByRequestId}
      />
    </AppPage>
  );
}
