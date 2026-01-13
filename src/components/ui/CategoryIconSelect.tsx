"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import {
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_ICON,
  getCategoryIconComponent,
  getCategoryIconLabel,
} from "@/lib/icons/categoryIcons";

export function CategoryIconSelect({
  locale,
  name = "icon",
  defaultValue,
  value,
  onChange,
  className,
}: {
  locale: "en" | "ar";
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? DEFAULT_CATEGORY_ICON);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value ?? DEFAULT_CATEGORY_ICON) : internalValue;
  const Icon = getCategoryIconComponent(currentValue);
  const label = getCategoryIconLabel(currentValue, locale);

  const filtered = useMemo(() => {
    if (!search) return CATEGORY_ICON_OPTIONS;
    const s = search.toLowerCase();
    return CATEGORY_ICON_OPTIONS.filter((x) => {
      const name = locale === "ar" ? x.labelAr : x.labelEn;
      return name.toLowerCase().includes(s) || x.id.includes(s);
    });
  }, [search, locale]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  function select(v: string) {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={currentValue} />

      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-(--accent) flex items-center justify-between cursor-pointer hover:bg-(--chip-bg) gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 shrink-0 rounded-md bg-(--chip-bg) flex items-center justify-center">
            <Icon className="h-4 w-4 text-(--muted-foreground)" />
          </div>
          <span className="truncate">{label}</span>
        </div>

        <svg
          className={`h-4 w-4 text-(--muted-foreground) transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-[9999] mt-2 w-full rounded-xl border border-(--surface-border) bg-(--surface) shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-(--surface-border)">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن أيقونة..." : "Search icons..."}
              className="h-9 w-full rounded-lg border border-(--surface-border) bg-background px-3 text-sm text-foreground outline-none placeholder:text-(--muted-foreground) focus:border-(--accent)"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            {filtered.map((opt) => {
              const isSelected = opt.id === currentValue;
              const OptIcon = opt.Icon;
              const optLabel = locale === "ar" ? opt.labelAr : opt.labelEn;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => select(opt.id)}
                  className={cn(
                    "w-full text-start rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isSelected
                      ? "bg-(--accent) text-(--accent-foreground) font-medium"
                      : "text-foreground hover:bg-(--chip-bg)",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        "h-6 w-6 shrink-0 rounded-md flex items-center justify-center",
                        isSelected ? "bg-white/15" : "bg-(--chip-bg)",
                      )}>
                        <OptIcon className={cn("h-4 w-4", isSelected ? "text-(--accent-foreground)" : "text-(--muted-foreground)")} />
                      </div>
                      <span className="truncate">{optLabel}</span>
                    </div>
                    {isSelected ? (
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
