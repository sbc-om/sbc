"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { HiChevronDown, HiCheck, HiX, HiUser } from "react-icons/hi";

interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: "admin" | "agent" | "user";
}

interface UserSelectProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  modalTitle?: string;
  locale: "en" | "ar";
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder,
  modalTitle,
  locale,
  required,
  allowEmpty,
  emptyLabel,
}: UserSelectProps) {
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

  const selected = users.find((u) => u.id === value);
  const displayText = selected 
    ? selected.fullName || selected.email
    : value === "" && allowEmpty
      ? emptyLabel || placeholder
      : placeholder;

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
  };

  const isRTL = locale === "ar";

  return (
    <div className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name="ownerId" value={value} required={required && !allowEmpty} />
      
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-11 w-full rounded-xl flex items-center justify-between px-4",
          "border border-[var(--surface-border)] bg-[var(--surface)]",
          "hover:bg-[var(--chip-bg)] transition-colors cursor-pointer",
          "text-sm"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <HiUser className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          <span className={!selected && value !== "" ? "text-[var(--muted-foreground)]" : "truncate"}>
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
              "relative w-full sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]",
              "bg-[var(--background)] sm:rounded-2xl rounded-t-2xl",
              "shadow-2xl max-h-[70vh] sm:max-h-[60vh]",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--surface-border)]">
              <span className="font-semibold">
                {modalTitle || (isRTL ? "اختر المالك" : "Select Owner")}
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
              {/* Empty Option */}
              {allowEmpty && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3",
                    "hover:bg-[var(--surface)] active:bg-accent/10 transition-colors",
                    "border-b border-[var(--surface-border)]",
                    value === "" && "bg-accent/5"
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-[var(--chip-bg)] flex items-center justify-center shrink-0">
                    <HiX className="h-5 w-5 text-[var(--muted-foreground)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-[var(--muted-foreground)] italic">
                      {emptyLabel || (isRTL ? "بدون صاحب" : "No owner")}
                    </div>
                  </div>
                  {value === "" && (
                    <HiCheck className="h-5 w-5 text-accent shrink-0" />
                  )}
                </button>
              )}

              {users.map((user) => {
                const isSelected = user.id === value;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={cn(
                      "w-full px-4 py-3 flex items-center gap-3",
                      "hover:bg-[var(--surface)] active:bg-accent/10 transition-colors",
                      "border-b border-[var(--surface-border)] last:border-b-0",
                      isSelected && "bg-accent/5"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-[var(--chip-bg)] flex items-center justify-center shrink-0">
                      <HiUser className="h-5 w-5 text-[var(--muted-foreground)]" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">
                        {user.fullName || user.email}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">
                        {user.role === "admin" ? (isRTL ? "مدير" : "Admin") : user.role === "agent" ? (isRTL ? "وكيل" : "Agent") : (isRTL ? "مستخدم" : "User")}
                        {user.phone ? ` • ${user.phone}` : ""}
                        {user.fullName ? ` • ${user.email}` : ""}
                      </div>
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
