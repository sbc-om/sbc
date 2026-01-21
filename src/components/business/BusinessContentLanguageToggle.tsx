"use client";

import { useState } from "react";

type ContentLanguage = "en" | "ar";

interface BusinessContentLanguageToggleProps {
  initialLanguage?: ContentLanguage;
  onChange?: (lang: ContentLanguage) => void;
  className?: string;
}

/**
 * A professional language toggle for business content.
 * Switches between English and Arabic display independently of the site locale.
 */
export function BusinessContentLanguageToggle({
  initialLanguage = "en",
  onChange,
  className = "",
}: BusinessContentLanguageToggleProps) {
  const [contentLang, setContentLang] = useState<ContentLanguage>(initialLanguage);

  const handleToggle = (lang: ContentLanguage) => {
    if (lang !== contentLang) {
      setContentLang(lang);
      onChange?.(lang);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg bg-muted/50 p-1 backdrop-blur-sm ${className}`}>
      <button
        onClick={() => handleToggle("en")}
        className={`
          rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200
          ${
            contentLang === "en"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }
        `}
        aria-label="Switch to English content"
        aria-pressed={contentLang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => handleToggle("ar")}
        className={`
          rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200
          ${
            contentLang === "ar"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }
        `}
        aria-label="Switch to Arabic content"
        aria-pressed={contentLang === "ar"}
      >
        AR
      </button>
    </div>
  );
}

/**
 * Hook to manage business content language state.
 */
export function useBusinessContentLanguage(initialLanguage: ContentLanguage = "en") {
  const [contentLang, setContentLang] = useState<ContentLanguage>(initialLanguage);
  return { contentLang, setContentLang };
}
