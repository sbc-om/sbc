import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getActiveProgramSubscriptionForBusiness } from "@/lib/db/subscriptions";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { CustomDomainSettings } from "./CustomDomainSettings";

export const runtime = "nodejs";

export default async function DirectoryBusinessDomainPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const business = await getBusinessById(id);
  if (!business) notFound();
  if (!business.ownerId || business.ownerId !== user.id) notFound();

  const license = await getActiveProgramSubscriptionForBusiness(user.id, business.id, "directory");
  if (!license) {
    redirect(`/${locale}/profile/businesses`);
  }

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{businessName}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "إدارة الدومين المخصص لنشاطك التجاري." : "Manage the custom domain for your business."}
          </p>
        </div>

        <Link
          href={`/${locale}/directory/businesses/${business.id}/edit`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة إلى التعديل" : "Back to Edit"}
        </Link>
      </div>

      <CustomDomainSettings locale={locale as Locale} business={business} />

      <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
        {ar
          ? `تنتهي رخصة هذا النشاط في ${new Intl.DateTimeFormat("ar-OM", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(license.expiresAt))}.`
          : `This business license expires on ${new Intl.DateTimeFormat("en-OM", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(license.expiresAt))}.`}
      </div>
    </AppPage>
  );
}