import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCategoryById } from "@/lib/db/categories";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { updateCategoryAction } from "@/app/[locale]/admin/categories/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

  const category = getCategoryById(id);
  if (!category) notFound();

  const title = locale === "ar" ? "تعديل تصنيف" : "Edit category";

  return (
    <PageContainer>
      <Container className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar" ? "قم بتحديث البيانات ثم احفظ." : "Update fields and save."}
      </p>

      <form action={updateCategoryAction.bind(null, locale as Locale, id)} className="mt-8 grid gap-4">
        <Field label="Slug" name="slug" defaultValue={category.slug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (EN)" name="name_en" defaultValue={category.name.en} />
          <Field label="Name (AR)" name="name_ar" defaultValue={category.name.ar} />
        </div>

        <Button type="submit" className="mt-2">
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </form>
    </Container>
    </PageContainer>
  );
}
