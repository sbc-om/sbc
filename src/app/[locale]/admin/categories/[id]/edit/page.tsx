import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCategoryById } from "@/lib/db/categories";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { updateCategoryAction } from "@/app/[locale]/admin/categories/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryImageManager } from "@/components/admin/CategoryImageManager";
import { CategoryIconSelect } from "@/components/ui/CategoryIconSelect";

export const runtime = "nodejs";

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-(--muted-foreground)">{label}</span>
      <Input name={name} defaultValue={defaultValue} />
    </label>
  );
}

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const category = await getCategoryById(id);
  if (!category) notFound();

  const title = locale === "ar" ? "تعديل تصنيف" : "Edit category";

  return (
    <AppPage>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar" ? "قم بتحديث البيانات ثم احفظ." : "Update fields and save."}
      </p>

      <form
        id="category-edit-form"
        action={updateCategoryAction.bind(null, locale as Locale, id)}
        className="mt-8 grid gap-4"
      >
        <Field label="Slug" name="slug" defaultValue={category.slug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (EN)" name="name_en" defaultValue={category.name.en} />
          <Field label="Name (AR)" name="name_ar" defaultValue={category.name.ar} />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {locale === "ar" ? "أيقونة التصنيف" : "Category icon"}
          </span>
          <CategoryIconSelect
            locale={locale as "en" | "ar"}
            name="iconId"
            defaultValue={category.iconId}
          />
        </div>
      </form>

      <CategoryImageManager
        categoryId={id}
        locale={locale as "en" | "ar"}
        initialImage={category.image}
      />

      <div className="mt-6">
        <Button type="submit" form="category-edit-form" className="w-full sm:w-auto">
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </div>
    </AppPage>
  );
}
