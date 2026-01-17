"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { Business, Category } from "@/lib/db/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "@/components/ui/CategorySelect";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(b: Business, locale: Locale) {
  return normalize(
    [
      b.name[locale],
      b.name.en,
      b.name.ar,
      b.description?.[locale],
      b.description?.en,
      b.description?.ar,
      b.slug,
      b.city,
      b.category,
      b.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function BusinessesExplorer({
  locale,
  dict,
  businesses,
  categories,
  detailsBasePath = "/businesses",
}: {
  locale: Locale;
  dict: Dictionary;
  businesses: Business[];
  categories: Category[];
  /** Route prefix for business details links. Example: "/businesses" or "/explorer" */
  detailsBasePath?: string;
}) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const filtered = useMemo(() => {
    const tokens = normalize(q)
      .split(" ")
      .filter(Boolean);

    const tagTokens = normalize(tags)
      .split(/[ ,]+/)
      .filter(Boolean);

    const cityToken = normalize(city);

    return businesses.filter((b) => {
      if (categoryId && b.categoryId !== categoryId) return false;
      if (cityToken && normalize(b.city ?? "").includes(cityToken) === false) return false;

      if (tagTokens.length) {
        const t = (b.tags ?? []).map((x) => normalize(x));
        for (const need of tagTokens) {
          if (!t.some((x) => x.includes(need))) return false;
        }
      }

      if (tokens.length) {
        const h = haystack(b, locale);
        for (const t of tokens) {
          if (!h.includes(t)) return false;
        }
      }

      return true;
    });
  }, [businesses, q, city, tags, categoryId, locale]);

  return (
    <div>
      <div className="sbc-card rounded-2xl p-5 relative z-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.home.searchPlaceholder}
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={locale === "ar" ? "المدينة" : "City"}
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={locale === "ar" ? "وسوم (مثال: مطعم, قهوة)" : "Tags (e.g. cafe, food)"}
          />
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            placeholder={locale === "ar" ? "كل التصنيفات" : "All categories"}
            searchPlaceholder={locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."}
            locale={locale}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <div className="text-(--muted-foreground)">
            {locale === "ar" ? `النتائج: ${filtered.length}` : `Results: ${filtered.length}`}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setQ("");
              setCity("");
              setTags("");
              setCategoryId("");
            }}
          >
            {locale === "ar" ? "مسح" : "Clear"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => {
          const name = locale === "ar" ? b.name.ar : b.name.en;
          const description = b.description ? (locale === "ar" ? b.description.ar : b.description.en) : "";
          const img = b.media?.cover || b.media?.banner || b.media?.logo;

          return (
            <Link
              key={b.id}
              href={`/${locale}${detailsBasePath}/${b.slug}`}
              className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
            >
              <div className="relative h-40 w-full bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={name} className="h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="truncate text-base font-semibold text-white drop-shadow">
                      {name}
                    </div>
                    {b.isVerified ? (
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-blue-200"
                        aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                        title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                  {b.isSpecial ? (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                      </svg>
                      {locale === "ar" ? "مميز" : "Special"}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-5">
                {description ? (
                  <p className="line-clamp-2 text-sm text-(--muted-foreground)">
                    {description}
                  </p>
                ) : (
                  <p className="text-sm text-(--muted-foreground)">
                    {locale === "ar" ? "لا يوجد وصف" : "No description"}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
                  <span className="font-mono">/{b.slug}</span>
                  {b.city ? <span className="sbc-chip rounded-full px-2 py-0.5">{b.city}</span> : null}
                  {b.tags?.slice(0, 5).map((t) => (
                    <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 text-center text-(--muted-foreground)">
          {dict.businesses.empty}
        </div>
      ) : null}
    </div>
  );
}
