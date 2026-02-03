"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { HiChevronDown, HiCheck, HiX } from "react-icons/hi";

// Country codes for GCC region + common ones
const COUNTRY_CODES = [
  { code: "+968", country: "OM", flag: "🇴🇲", name: "Oman", nameAr: "عمان" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE", nameAr: "الإمارات" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "+974", country: "QA", flag: "🇶🇦", name: "Qatar", nameAr: "قطر" },
  { code: "+973", country: "BH", flag: "🇧🇭", name: "Bahrain", nameAr: "البحرين" },
  { code: "+965", country: "KW", flag: "🇰🇼", name: "Kuwait", nameAr: "الكويت" },
  { code: "+98", country: "IR", flag: "🇮🇷", name: "Iran", nameAr: "إيران" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India", nameAr: "الهند" },
  { code: "+92", country: "PK", flag: "🇵🇰", name: "Pakistan", nameAr: "باكستان" },
  { code: "+880", country: "BD", flag: "🇧🇩", name: "Bangladesh", nameAr: "بنغلاديش" },
  { code: "+94", country: "LK", flag: "🇱🇰", name: "Sri Lanka", nameAr: "سريلانكا" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines", nameAr: "الفلبين" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt", nameAr: "مصر" },
  { code: "+962", country: "JO", flag: "🇯🇴", name: "Jordan", nameAr: "الأردن" },
  { code: "+961", country: "LB", flag: "🇱🇧", name: "Lebanon", nameAr: "لبنان" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "USA", nameAr: "أمريكا" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "UK", nameAr: "بريطانيا" },
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

const DEFAULT_COUNTRY_CODE = "+968"; // Oman

export interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  dir?: "ltr" | "rtl";
  id?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  locale?: "en" | "ar";
}

export function parsePhoneNumber(fullPhone: string): { countryCode: string; localNumber: string } {
  if (!fullPhone) return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: "" };
  
  const cleaned = fullPhone.replace(/[\s\-()]/g, "");
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  
  for (const { code } of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return { countryCode: code, localNumber: cleaned.slice(code.length) };
    }
    if (cleaned.startsWith(code.slice(1))) {
      return { countryCode: code, localNumber: cleaned.slice(code.length - 1) };
    }
  }
  
  return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: cleaned.replace(/^\+/, "") };
}

export function formatPhoneDisplay(countryCode: string, localNumber: string): string {
  return (countryCode + " " + localNumber).trim();
}

export function combinePhone(countryCode: string, localNumber: string): string {
  const cleanedCountryCode = countryCode.replace(/\D/g, "");
  const cleanedLocalNumber = localNumber.replace(/\D/g, "");
  return cleanedCountryCode + cleanedLocalNumber;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      countryCode: controlledCountryCode,
      onCountryCodeChange,
      placeholder = "91234567",
      disabled = false,
      className,
      inputClassName,
      selectClassName,
      id,
      name,
      required,
      autoComplete = "tel",
      locale = "en",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      setIsMounted(true);
    }, []);
    
    const parsed = React.useMemo(() => parsePhoneNumber(value), [value]);
    
    const [internalCountryCode, setInternalCountryCode] = React.useState(
      controlledCountryCode || parsed.countryCode
    );
    const [localNumber, setLocalNumber] = React.useState(parsed.localNumber);
    
    React.useEffect(() => {
      if (controlledCountryCode) {
        setInternalCountryCode(controlledCountryCode);
      }
    }, [controlledCountryCode]);
    
    React.useEffect(() => {
      const newParsed = parsePhoneNumber(value);
      if (!controlledCountryCode) {
        setInternalCountryCode(newParsed.countryCode);
      }
      setLocalNumber(newParsed.localNumber);
    }, [value, controlledCountryCode]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [isOpen]);

    const currentCountryCode = controlledCountryCode || internalCountryCode;
    
    const handleCountrySelect = (code: string) => {
      setInternalCountryCode(code);
      onCountryCodeChange?.(code);
      onChange(combinePhone(code, localNumber));
      setIsOpen(false);
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value.replace(/\D/g, "");
      setLocalNumber(newNumber);
      onChange(combinePhone(currentCountryCode, newNumber));
    };

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === currentCountryCode) || COUNTRY_CODES[0];
    const fullPhoneValue = combinePhone(currentCountryCode, localNumber);
    const isRTL = locale === "ar";

    return (
      <div className={cn("flex gap-2", className)} dir="ltr">
        {name && (
          <input type="hidden" name={name} value={fullPhoneValue} />
        )}

        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={cn(
            "h-12 px-3 rounded-xl flex items-center gap-1.5 shrink-0",
            "border-2 border-[var(--surface-border)] bg-[var(--background)]",
            "hover:border-[var(--muted-foreground)]/30 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            selectClassName
          )}
          aria-label="Select country code"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium tabular-nums">{selectedCountry.code}</span>
          <HiChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        </button>

        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          id={id}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          dir="ltr"
          className={cn(
            "h-12 flex-1 px-4 rounded-xl text-base",
            "border-2 border-[var(--surface-border)] bg-[var(--background)]",
            "placeholder:text-[var(--muted-foreground)]",
            "hover:border-[var(--muted-foreground)]/30 transition-colors",
            "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            inputClassName
          )}
        />

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
              <div className="flex items-center justify-between p-4 border-b border-[var(--surface-border)]">
                <span className="font-semibold">
                  {isRTL ? "اختر الدولة" : "Select Country"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {COUNTRY_CODES.map((country) => {
                  const isSelected = country.code === currentCountryCode;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center gap-3",
                        "hover:bg-[var(--surface)] active:bg-accent/10 transition-colors",
                        "border-b border-[var(--surface-border)] last:border-b-0",
                        isSelected && "bg-accent/5"
                      )}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{country.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{country.nameAr}</div>
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)] tabular-nums">
                        {country.code}
                      </span>
                      {isSelected && (
                        <HiCheck className="h-5 w-5 text-accent" />
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
);

PhoneInput.displayName = "PhoneInput";

export { COUNTRY_CODES, DEFAULT_COUNTRY_CODE };
