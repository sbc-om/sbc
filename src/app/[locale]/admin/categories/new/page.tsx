import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createCategoryAction } from "@/app/[locale]/admin/categories/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const runtime = "nodejs";

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-(--muted-foreground)">{label}</span>
      <Input name={name} placeholder={placeholder} />
    </label>
  );
}

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
    <Container className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar"
          ? "أضف اسم التصنيف باللغتين و slug فريد." 
          : "Add the category name in both languages and a unique slug."}
      </p>

      <form action={createCategoryAction.bind(null, locale as Locale)} className="mt-8 grid gap-4">
        <Field label="Slug" name="slug" placeholder="restaurants" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (EN)" name="name_en" />
          <Field label="Name (AR)" name="name_ar" />
        </div>

        <Button type="submit" className="mt-2">
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </form>
    </Container>
  );
}
