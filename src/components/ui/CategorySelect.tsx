"use client";

import { useState, useRef, useEffect } from "react";
import type { Category } from "@/lib/db/types";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  locale: "en" | "ar";
  required?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  locale,
  required,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);
  const displayText = selected 
    ? (locale === "ar" ? selected.name.ar : selected.name.en)
    : placeholder;

  const filtered = categories.filter((c) => {
    if (!search) return true;
    const name = locale === "ar" ? c.name.ar : c.name.en;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name="categoryId" value={value} required={required} />
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-(--accent) flex items-center justify-between cursor-pointer hover:bg-(--chip-bg)"
      >
        <span className={!selected ? "text-(--muted-foreground)" : ""}>
          {displayText}
        </span>
        <svg
          className={`h-4 w-4 text-(--muted-foreground) transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-[9999] mt-2 w-full rounded-xl border border-(--surface-border) bg-(--surface) shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-3 border-b border-(--surface-border)">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-(--surface-border) bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-(--muted-foreground) focus:border-(--accent)"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-(--muted-foreground)">
                {locale === "ar" ? "لا توجد نتائج" : "No results found"}
              </div>
            ) : (
              filtered.map((category) => {
                const isSelected = category.id === value;
                const name = locale === "ar" ? category.name.ar : category.name.en;
                
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={`w-full text-start rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-(--accent) text-(--accent-foreground) font-medium"
                        : "text-foreground hover:bg-(--chip-bg)"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{name}</span>
                      {isSelected && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
