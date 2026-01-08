import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createBusinessAction } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

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
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <Input name={name} placeholder={placeholder} />
    </label>
  );
}

function TextArea({
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
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <Textarea name={name} placeholder={placeholder} />
    </label>
  );
}

export default async function AdminNewBusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const title = locale === "ar" ? "إضافة عمل" : "Add business";

  return (
    <Container className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {locale === "ar"
          ? "املأ البيانات باللغتين لعرضها بشكل ممتاز." 
          : "Fill in both languages for a polished bilingual directory."}
      </p>

      <form
        action={createBusinessAction.bind(null, locale as Locale)}
        className="mt-8 grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Slug" : "Slug"} name="slug" placeholder="coffee-house" />
          <Field label={locale === "ar" ? "Category" : "Category"} name="category" placeholder={locale === "ar" ? "مطاعم" : "Restaurants"} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Name (EN)" : "Name (EN)"} name="name_en" />
          <Field label={locale === "ar" ? "Name (AR)" : "Name (AR)"} name="name_ar" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label={locale === "ar" ? "Description (EN)" : "Description (EN)"} name="desc_en" />
          <TextArea label={locale === "ar" ? "Description (AR)" : "Description (AR)"} name="desc_ar" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "City" : "City"} name="city" />
          <Field label={locale === "ar" ? "Phone" : "Phone"} name="phone" />
        </div>

        <Field label={locale === "ar" ? "Address" : "Address"} name="address" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Website" : "Website"} name="website" placeholder="https://…" />
          <Field label={dict.auth.email} name="email" placeholder="info@…" />
        </div>

        <Field
          label={locale === "ar" ? "Tags (comma-separated)" : "Tags (comma-separated)"}
          name="tags"
          placeholder={locale === "ar" ? "قهوة, واي فاي" : "coffee, wifi"}
        />

        <Button type="submit" className="mt-2">
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </form>
    </Container>
  );
}
