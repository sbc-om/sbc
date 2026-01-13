"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { CategoryIconSelect } from "@/components/ui/CategoryIconSelect";
import { Input } from "@/components/ui/Input";
import { ImageDropzone } from "@/components/ui/ImageDropzone";

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

function SubmitButton({ ar }: { ar: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-2 w-full sm:w-auto">
      {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
    </Button>
  );
}

export function NewCategoryForm({
  locale,
  action,
}: {
  locale: "en" | "ar";
  action: (formData: FormData) => void;
}) {
  const ar = locale === "ar";
  const [iconId, setIconId] = useState<string | undefined>(undefined);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="mt-8 grid gap-5"
    >
      <Field label="Slug" name="slug" placeholder="restaurants" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (EN)" name="name_en" />
        <Field label="Name (AR)" name="name_ar" />
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-(--muted-foreground)">
          {ar ? "أيقونة التصنيف" : "Category icon"}
        </span>
        <CategoryIconSelect
          locale={locale}
          name="iconId"
          value={iconId}
          onChange={setIconId}
        />
      </div>

      <ImageDropzone
        name="image"
        label={ar ? "صورة التصنيف" : "Category image"}
        description={
          ar
            ? "صورة تُستخدم في صفحة الفئات وخيارات الاختيار (اختياري)."
            : "Shown on category pages and selection dropdowns (optional)."
        }
      />

      <div className="pt-1">
        <SubmitButton ar={ar} />
      </div>
    </form>
  );
}
