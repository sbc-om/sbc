import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { NewBusinessWizard } from "@/app/[locale]/admin/new/NewBusinessWizard";
import { listCategories } from "@/lib/db/categories";
import { listUsers } from "@/lib/db/users";
import { getUserIdsWithBusiness } from "@/lib/db/businesses";

export const runtime = "nodejs";

export default async function AdminNewBusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);
  const categories = await listCategories();
  const allUsers = await listUsers();
  // Filter out users who already have a business (each user can only have one business)
  const userIdsWithBusiness = await getUserIdsWithBusiness();
  const users = allUsers.filter((u) => !userIdsWithBusiness.has(u.id));

  const title = locale === "ar" ? "إضافة عمل" : "Add business";

  return (
    <AppPage>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar"
          ? "املأ البيانات باللغتين لعرضها بشكل ممتاز." 
          : "Fill in both languages for a polished bilingual directory."}
      </p>

      <NewBusinessWizard
        locale={locale as Locale}
        emailLabel={dict.auth.email}
        categories={categories}
        users={users}
      />
    </AppPage>
  );
}
