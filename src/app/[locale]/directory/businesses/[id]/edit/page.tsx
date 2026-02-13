import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getProgramSubscriptionByUser, hasActiveSubscription } from "@/lib/db/subscriptions";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import Link from "next/link";
import { OwnerEditBusinessForm } from "./OwnerEditBusinessForm";

export const runtime = "nodejs";

export default async function DirectoryBusinessEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  await getProgramSubscriptionByUser(user.id);
  if (!(await hasActiveSubscription(user.id, "directory"))) {
    redirect(`/${locale}/directory`);
  }

  const business = await getBusinessById(id);
  if (!business) notFound();
  if (!business.ownerId || business.ownerId !== user.id) notFound();

  const categories = await listCategories();

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{businessName}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "تحديث بيانات نشاطك ووسائطه." : "Update your business profile and media."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/directory/businesses/${business.id}/cards`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {ar ? "بطاقات الأعمال" : "Business Cards"}
          </Link>
          <Link href={`/${locale}/directory`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {ar ? "رجوع" : "Back"}
          </Link>
        </div>
      </div>

      {!(business.isApproved ?? business.isVerified) ? (
        <div className="mt-6 sbc-card rounded-2xl p-4 text-sm text-(--muted-foreground)">
          {ar
            ? "هذا النشاط قيد المراجعة. سيتم عرضه بعد موافقة الإدارة."
            : "This business is pending review. It will be visible after admin approval."}
        </div>
      ) : null}

      <div className="mt-6 sbc-card rounded-2xl p-4 text-sm text-(--muted-foreground)">
        {ar
          ? "بعد الحفظ سيتم إرسال التعديلات للمراجعة وإيقاف الظهور حتى الموافقة."
          : "After saving, changes will be reviewed and listing will be hidden until approved."}
      </div>

      <OwnerEditBusinessForm locale={locale as Locale} business={business} categories={categories} />
    </AppPage>
  );
}
