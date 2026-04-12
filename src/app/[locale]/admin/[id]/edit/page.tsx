import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getBusinessById, getUserIdsWithBusiness } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listUsers } from "@/lib/db/users";
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

  const categories = await listCategories();
  const business = await getBusinessById(id);
  if (!business) notFound();
  // Filter out users who already have a business (exclude current business's owner)
  const allUsers = await listUsers();
  const userIdsWithBusiness = await getUserIdsWithBusiness(id);
  const users = allUsers.filter((u) => !userIdsWithBusiness.has(u.id));

  const title = locale === "ar" ? "تعديل النشاط التجاري" : "Edit Business";

  return (
    <AppPage>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <EditBusinessForm
        locale={locale as Locale}
        business={business}
        categories={categories}
        emailLabel={dict.auth.email}
        users={users}
      />
    </AppPage>
  );
}
