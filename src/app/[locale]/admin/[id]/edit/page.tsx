import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getUserById, listUsers } from "@/lib/db/users";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { EditBusinessForm } from "./EditBusinessForm";

export const runtime = "nodejs";

export default async function AdminEditBusinessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const categories = listCategories();
  const business = getBusinessById(id);
  if (!business) notFound();

  const ownerEmail = business.ownerId ? getUserById(business.ownerId)?.email : undefined;
  const users = listUsers();

  const title = locale === "ar" ? "تعديل النشاط التجاري" : "Edit Business";

  return (
    <AppPage>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" 
              ? "قم بتحديث معلومات النشاط التجاري والصور." 
              : "Update business information and images."}
          </p>
        </div>
      </div>

      <EditBusinessForm
        locale={locale as Locale}
        business={business}
        categories={categories}
        emailLabel={dict.auth.email}
        ownerEmail={ownerEmail}
        users={users}
      />
    </AppPage>
  );
}
