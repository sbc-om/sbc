"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

// Country codes for GCC region + common ones
const COUNTRY_CODES = [
  { code: "+968", country: "OM", flag: "🇴🇲", name: "Oman" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+974", country: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "+973", country: "BH", flag: "🇧🇭", name: "Bahrain" },
  { code: "+965", country: "KW", flag: "🇰🇼", name: "Kuwait" },
  { code: "+98", country: "IR", flag: "🇮🇷", name: "Iran" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+92", country: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", country: "BD", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94", country: "LK", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "+962", country: "JO", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", country: "LB", flag: "🇱🇧", name: "Lebanon" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "USA" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "UK" },
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
}

/**
 * Parse a full phone number into country code and local number
 */
export function parsePhoneNumber(fullPhone: string): { countryCode: string; localNumber: string } {
  if (!fullPhone) return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: "" };
  
  const cleaned = fullPhone.replace(/[\s\-()]/g, "");
  
  // Try to match country codes (longest first)
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  
  for (const { code } of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return { countryCode: code, localNumber: cleaned.slice(code.length) };
    }
    // Also check without + prefix
    if (cleaned.startsWith(code.slice(1))) {
      return { countryCode: code, localNumber: cleaned.slice(code.length - 1) };
    }
  }
  
  // If no country code found, assume it's just a local number
  return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: cleaned.replace(/^\+/, "") };
}

/**
 * Format phone number for display (with spaces)
 */
export function formatPhoneDisplay(countryCode: string, localNumber: string): string {
  return `${countryCode} ${localNumber}`.trim();
}

/**
 * Combine country code and local number into full phone
 */
export function combinePhone(countryCode: string, localNumber: string): string {
  const cleaned = localNumber.replace(/\D/g, "");
  return `${countryCode}${cleaned}`;
}

const inputBase =
  "h-12 w-full rounded-xl px-4 text-base text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50";

const selectBase =
  "h-12 rounded-xl px-2 text-base text-foreground outline-none backdrop-blur transition-all focus:ring-2 focus:ring-accent/50 cursor-pointer appearance-none bg-no-repeat";

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
      dir = "ltr",
      id,
      name,
      required,
      autoComplete = "tel",
    },
    ref
  ) => {
    // Parse the full phone number if no controlled country code
    const parsed = React.useMemo(() => parsePhoneNumber(value), [value]);
    
    const [internalCountryCode, setInternalCountryCode] = React.useState(
      controlledCountryCode || parsed.countryCode
    );
    const [localNumber, setLocalNumber] = React.useState(parsed.localNumber);
    
    // Sync with controlled props
    React.useEffect(() => {
      if (controlledCountryCode) {
        setInternalCountryCode(controlledCountryCode);
      }
    }, [controlledCountryCode]);
    
    // Update local number when value changes externally
    React.useEffect(() => {
      const newParsed = parsePhoneNumber(value);
      if (!controlledCountryCode) {
        setInternalCountryCode(newParsed.countryCode);
      }
      setLocalNumber(newParsed.localNumber);
    }, [value, controlledCountryCode]);

    const currentCountryCode = controlledCountryCode || internalCountryCode;
    
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCode = e.target.value;
      setInternalCountryCode(newCode);
      onCountryCodeChange?.(newCode);
      onChange(combinePhone(newCode, localNumber));
    };
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value.replace(/\D/g, "");
      setLocalNumber(newNumber);
      onChange(combinePhone(currentCountryCode, newNumber));
    };

    const selectedCountry = COUNTRY_CODES.find((c) => c.code === currentCountryCode) || COUNTRY_CODES[0];

    const fullPhoneValue = combinePhone(currentCountryCode, localNumber);

    return (
      <div className={cn("flex gap-2", className)} dir="ltr">
        {/* Hidden input for form submission with full phone number */}
        {name && (
          <input type="hidden" name={name} value={fullPhoneValue} />
        )}

        {/* Country Code Select */}
        <div className="relative shrink-0">
          <select
            value={currentCountryCode}
            onChange={handleCountryChange}
            disabled={disabled}
            className={cn(
              selectBase,
              "w-[100px] pe-6",
              selectClassName
            )}
            style={{
              border: "2px solid",
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--background)",
            }}
            aria-label="Country code"
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number Input */}
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
          className={cn(inputBase, "flex-1", inputClassName)}
          style={{
            border: "2px solid",
            borderColor: "var(--surface-border)",
            backgroundColor: "var(--background)",
          }}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

// Export country codes for use in other components
export { COUNTRY_CODES, DEFAULT_COUNTRY_CODE };
