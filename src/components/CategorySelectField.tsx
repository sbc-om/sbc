"use client";

import { useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import { CategorySelect } from "@/components/ui/CategorySelect";

export function CategorySelectField({
  categories,
  locale,
  placeholder,
  searchPlaceholder,
  required,
}: {
  categories: Category[];
  locale: Locale;
  placeholder: string;
  searchPlaceholder: string;
  required?: boolean;
}) {
  const [value, setValue] = useState<string>("");

  return (
    <CategorySelect
      categories={categories}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      locale={locale}
      required={required}
    />
  );
}
