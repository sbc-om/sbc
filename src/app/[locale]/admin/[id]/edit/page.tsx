import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { updateBusinessAction } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { BusinessMediaManager } from "@/components/admin/BusinessMediaManager";

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
      <span className="text-sm font-medium text-(--muted-foreground)">
        {label}
      </span>
      <Input name={name} defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({
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
      <span className="text-sm font-medium text-(--muted-foreground)">
        {label}
      </span>
      <Textarea name={name} defaultValue={defaultValue} />
    </label>
  );
}

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

  const title = locale === "ar" ? "تعديل عمل" : "Edit business";

  return (
    <Container className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {locale === "ar" ? "قم بتحديث البيانات ثم احفظ." : "Update fields and save."}
      </p>

      <form
        action={updateBusinessAction.bind(null, locale as Locale, id)}
        className="mt-8 grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Slug" : "Slug"} name="slug" defaultValue={business.slug} />
          <label className="grid gap-1">
            <span className="text-sm font-medium text-(--muted-foreground)">
              {locale === "ar" ? "التصنيف" : "Category"}
            </span>
            <select
              name="categoryId"
              required
              defaultValue={business.categoryId ?? ""}
              className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus-visible:border-(--accent) focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <option value="" disabled>
                {locale === "ar" ? "اختر تصنيفاً" : "Select a category"}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "ar" ? c.name.ar : c.name.en}
                </option>
              ))}
            </select>
            {categories.length === 0 ? (
              <span className="text-xs text-(--muted-foreground)">
                {locale === "ar"
                  ? "لا توجد تصنيفات بعد. أضف تصنيفاً من صفحة التصنيفات." 
                  : "No categories yet. Add one from the categories page."}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Name (EN)" : "Name (EN)"} name="name_en" defaultValue={business.name.en} />
          <Field label={locale === "ar" ? "Name (AR)" : "Name (AR)"} name="name_ar" defaultValue={business.name.ar} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label={locale === "ar" ? "Description (EN)" : "Description (EN)"} name="desc_en" defaultValue={business.description?.en} />
          <TextArea label={locale === "ar" ? "Description (AR)" : "Description (AR)"} name="desc_ar" defaultValue={business.description?.ar} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "City" : "City"} name="city" defaultValue={business.city} />
          <Field label={locale === "ar" ? "Phone" : "Phone"} name="phone" defaultValue={business.phone} />
        </div>

        <Field label={locale === "ar" ? "Address" : "Address"} name="address" defaultValue={business.address} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Website" : "Website"} name="website" defaultValue={business.website} />
          <Field label={dict.auth.email} name="email" defaultValue={business.email} />
        </div>

        <Field
          label={locale === "ar" ? "Tags (comma-separated)" : "Tags (comma-separated)"}
          name="tags"
          defaultValue={business.tags?.join(", ")}
        />

        <Button type="submit" className="mt-2">
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </form>

      <BusinessMediaManager
        businessId={id}
        locale={locale as "en" | "ar"}
        initialMedia={business.media}
      />
    </Container>
  );
}
