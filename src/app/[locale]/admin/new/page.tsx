import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { NewBusinessWizard } from "@/app/[locale]/admin/new/NewBusinessWizard";
import { listCategories } from "@/lib/db/categories";

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
  const categories = listCategories();

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
      />
    </AppPage>
  );
}
