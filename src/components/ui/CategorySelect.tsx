"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Category } from "@/lib/db/types";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  locale: "en" | "ar";
  required?: boolean;
  containerClassName?: string;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  locale,
  required,
  containerClassName,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 0 });

  const selected = categories.find((c) => c.id === value);
  const displayText = selected 
    ? (locale === "ar" ? selected.name.ar : selected.name.en)
    : placeholder;

  const SelectedIcon = getCategoryIconComponent(selected?.iconId);

  const filtered = categories.filter((c) => {
    if (!search) return true;
    const name = locale === "ar" ? c.name.ar : c.name.en;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className={containerClassName ? `relative z-50 ${containerClassName}` : "relative z-50"}
    >
      {/* Hidden input for form submission */}
      <input type="hidden" name="categoryId" value={value} required={required} />
      
      {/* Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-(--accent) flex items-center justify-between cursor-pointer hover:bg-(--chip-bg) gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.image ? (
            <div className="relative h-6 w-6 shrink-0 rounded-md overflow-hidden">
              <Image
                src={selected.image}
                alt={displayText}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
          ) : selected ? (
            <div className="h-7 w-7 shrink-0 rounded-md bg-(--chip-bg) flex items-center justify-center">
              <SelectedIcon className="h-5 w-5 text-(--muted-foreground)" />
            </div>
          ) : null}
          <span className={!selected ? "text-(--muted-foreground)" : "truncate"}>
            {displayText}
          </span>
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

      {/* Dropdown Panel */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] rounded-xl border border-(--surface-border) bg-[rgba(var(--surface-rgb),0.88)] shadow-xl backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
          >
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
                  const OptIcon = getCategoryIconComponent(category.iconId);

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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {category.image ? (
                            <div className="relative h-6 w-6 shrink-0 rounded-md overflow-hidden">
                              <Image
                                src={category.image}
                                alt={name}
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${
                                isSelected ? "bg-white/15" : "bg-(--chip-bg)"
                              }`}
                            >
                              <OptIcon
                                className={`h-5 w-5 ${
                                  isSelected ? "text-(--accent-foreground)" : "text-(--muted-foreground)"
                                }`}
                              />
                            </div>
                          )}
                          <span className="truncate">{name}</span>
                        </div>
                        {isSelected && (
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
