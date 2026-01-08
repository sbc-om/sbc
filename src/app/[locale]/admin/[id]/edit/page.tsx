import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { updateBusinessAction } from "@/app/[locale]/admin/actions";

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
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <input
        className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-zinc-300 dark:border-white/15 dark:bg-black"
        name={name}
        defaultValue={defaultValue}
      />
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
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <textarea
        className="min-h-28 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-300 dark:border-white/15 dark:bg-black"
        name={name}
        defaultValue={defaultValue}
      />
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

  const business = getBusinessById(id);
  if (!business) notFound();

  const title = locale === "ar" ? "تعديل عمل" : "Edit business";

  return (
    <Container className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {locale === "ar" ? "قم بتحديث البيانات ثم احفظ." : "Update fields and save."}
      </p>

      <form
        action={updateBusinessAction.bind(null, locale as Locale, id)}
        className="mt-8 grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={locale === "ar" ? "Slug" : "Slug"} name="slug" defaultValue={business.slug} />
          <Field label={locale === "ar" ? "Category" : "Category"} name="category" defaultValue={business.category} />
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

        <button className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          {locale === "ar" ? "حفظ" : "Save"}
        </button>
      </form>
    </Container>
  );
}
