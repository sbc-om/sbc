import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createCategoryAction } from "@/app/[locale]/admin/categories/actions";
import { NewCategoryForm } from "@/app/[locale]/admin/categories/new/NewCategoryForm";

export const runtime = "nodejs";

export default async function AdminNewCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const title = locale === "ar" ? "إضافة تصنيف" : "Add category";

  return (
    <AppPage>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar"
          ? "أضف اسم التصنيف باللغتين و slug فريد." 
          : "Add the category name in both languages and a unique slug."}
      </p>

      <NewCategoryForm
        locale={locale as "en" | "ar"}
        action={createCategoryAction.bind(null, locale as Locale)}
      />
    </AppPage>
  );
}
