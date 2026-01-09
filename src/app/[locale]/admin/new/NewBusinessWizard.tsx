"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import { createBusinessDraftAction, type CreateBusinessDraftResult } from "@/app/[locale]/admin/actions";
import { BusinessMediaManager } from "@/components/admin/BusinessMediaManager";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

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
      <span className="text-sm font-medium text-(--muted-foreground)">{label}</span>
      <Textarea name={name} placeholder={placeholder} />
    </label>
  );
}

export function NewBusinessWizard({
  locale,
  emailLabel,
  categories,
}: {
  locale: Locale;
  emailLabel: string;
  categories: Category[];
}) {
  const ar = locale === "ar";

  const [state, formAction, pending] = useActionState<CreateBusinessDraftResult | null, FormData>(
    createBusinessDraftAction.bind(null, locale),
    null,
  );

  if (state?.ok) {
    return (
      <div className="mt-8 grid gap-6">
        <div className="sbc-card rounded-2xl p-5 text-sm">
          <div className="font-semibold text-foreground">
            {ar ? "تم إنشاء النشاط التجاري." : "Business created."}
          </div>
          <div className="mt-1 text-(--muted-foreground)">
            {ar
              ? "يمكنك الآن رفع الصورة الرئيسية والشعار والبنر والمعرض والفيديو." 
              : "You can now upload main image, logo, banner, gallery, and videos."}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              className={buttonVariants({ variant: "secondary", size: "sm" })}
              href={`/${locale}/admin/${state.id}/edit`}
            >
              {ar ? "فتح صفحة التعديل" : "Open edit page"}
            </Link>
          </div>
        </div>

        <BusinessMediaManager businessId={state.id} locale={locale as "en" | "ar"} />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {state && !state.ok ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {ar ? "خطأ: " : "Error: "}
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={"Slug"} name="slug" placeholder="coffee-house" />
          <label className="grid gap-1">
            <span className="text-sm font-medium text-(--muted-foreground)">
              {ar ? "التصنيف" : "Category"}
            </span>
            <select
              name="categoryId"
              required
              defaultValue=""
              className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus-visible:border-(--accent) focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <option value="" disabled>
                {ar ? "اختر تصنيفاً" : "Select a category"}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {ar ? c.name.ar : c.name.en}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ar ? "الاسم (EN)" : "Name (EN)"} name="name_en" />
          <Field label={ar ? "الاسم (AR)" : "Name (AR)"} name="name_ar" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label={ar ? "الوصف (EN)" : "Description (EN)"} name="desc_en" />
          <TextArea label={ar ? "الوصف (AR)" : "Description (AR)"} name="desc_ar" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ar ? "المدينة" : "City"} name="city" />
          <Field label={ar ? "الهاتف" : "Phone"} name="phone" />
        </div>

        <Field label={ar ? "العنوان" : "Address"} name="address" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ar ? "الموقع" : "Website"} name="website" placeholder="https://…" />
          <Field label={emailLabel} name="email" placeholder="info@…" />
        </div>

        <Field
          label={ar ? "الوسوم (مفصولة بفواصل)" : "Tags (comma-separated)"}
          name="tags"
          placeholder={ar ? "قهوة, واي فاي" : "coffee, wifi"}
        />

        <Button type="submit" className="mt-2" disabled={pending}>
          {pending
            ? ar
              ? "جارٍ الإنشاء..." 
              : "Creating..."
            : ar
              ? "إنشاء ورفع الوسائط" 
              : "Create & upload media"}
        </Button>
      </form>

      <p className="mt-3 text-xs text-(--muted-foreground)">
        {ar
          ? "ملاحظة: سيتم إنشاء النشاط أولاً للحصول على ID ثم تخزين الوسائط داخل .data/uploads/businesses/<id>/..." 
          : "Note: We first create the business to get an ID, then store media under .data/uploads/businesses/<id>/..."}
      </p>
    </div>
  );
}
