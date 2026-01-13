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
  value: externalValue,
  onChange: externalOnChange,
}: {
  categories: Category[];
  locale: Locale;
  placeholder: string;
  searchPlaceholder: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState<string>("");
  
  const value = externalValue !== undefined ? externalValue : internalValue;
  const onChange = externalOnChange || setInternalValue;

  return (
    <CategorySelect
      categories={categories}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      locale={locale}
      required={required}
    />
  );
}
