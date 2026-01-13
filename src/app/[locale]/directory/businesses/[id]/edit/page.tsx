import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import Link from "next/link";
import { BusinessAvatarSettings } from "@/components/directory/BusinessAvatarSettings";

export const runtime = "nodejs";

export default async function DirectoryBusinessEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const sub = getProgramSubscriptionByUser(user.id, "directory");
  if (!isProgramSubscriptionActive(sub)) {
    redirect(`/${locale}/directory`);
  }

  const business = getBusinessById(id);
  if (!business) notFound();
  if (!business.ownerId || business.ownerId !== user.id) notFound();

  const category = business.categoryId ? getCategoryById(business.categoryId) : null;

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{businessName}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "إدارة صورة الملف والأيقونة." : "Manage profile image and icon."}
          </p>
        </div>

        <Link href={`/${locale}/directory`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "رجوع" : "Back"}
        </Link>
      </div>

      <BusinessAvatarSettings
        locale={locale as "en" | "ar"}
        businessId={business.id}
        businessName={businessName}
        initialAvatarMode={business.avatarMode ?? "icon"}
        initialLogoUrl={business.media?.logo}
        categoryIconId={category?.iconId}
      />
    </AppPage>
  );
}
