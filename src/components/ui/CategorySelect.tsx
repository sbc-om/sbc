"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { HiChevronDown, HiCheck, HiX } from "react-icons/hi";
import type { Category } from "@/lib/db/types";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  locale: "en" | "ar";
  required?: boolean;
  containerClassName?: string;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder,
  locale,
  required,
  containerClassName,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const selected = categories.find((c) => c.id === value);
  const displayText = selected 
    ? (locale === "ar" ? selected.name.ar : selected.name.en)
    : placeholder;
  
  const SelectedIcon = getCategoryIconComponent(selected?.iconId);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const isRTL = locale === "ar";

  return (
    <div className={cn("relative", containerClassName)}>
      {/* Hidden input for form submission */}
      <input type="hidden" name="categoryId" value={value} required={required} />
      
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-11 w-full rounded-xl flex items-center justify-between px-3",
          "border border-[var(--surface-border)] bg-[var(--surface)]",
          "hover:bg-[var(--chip-bg)] transition-colors cursor-pointer",
          "text-sm"
        )}
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
            <div className="h-7 w-7 shrink-0 rounded-md bg-[var(--chip-bg)] flex items-center justify-center">
              <SelectedIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
            </div>
          ) : null}
          <span className={!selected ? "text-[var(--muted-foreground)]" : "truncate"}>
            {displayText}
          </span>
        </div>
        <HiChevronDown className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
      </button>

      {/* Modal */}
      {isOpen && isMounted && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50 -z-10" />
          
          <div 
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full sm:w-96 sm:max-w-[calc(100vw-2rem)]",
              "bg-[var(--background)] sm:rounded-2xl rounded-t-2xl",
              "shadow-2xl max-h-[70vh] sm:max-h-[60vh]",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--surface-border)]">
              <span className="font-semibold">
                {isRTL ? "اختر التصنيف" : "Select Category"}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {categories.map((category) => {
                const isSelected = category.id === value;
                const name = locale === "ar" ? category.name.ar : category.name.en;
                const OptIcon = getCategoryIconComponent(category.iconId);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={cn(
                      "w-full px-4 py-3 flex items-center gap-3",
                      "hover:bg-[var(--surface)] active:bg-accent/10 transition-colors",
                      "border-b border-[var(--surface-border)] last:border-b-0",
                      isSelected && "bg-accent/5"
                    )}
                  >
                    {category.image ? (
                      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={category.image}
                          alt={name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--chip-bg)] flex items-center justify-center">
                        <OptIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">{name}</div>
                    </div>
                    {isSelected && (
                      <HiCheck className="h-5 w-5 text-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
