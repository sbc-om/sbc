"use client";

import * as React from "react";

import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/locales";

export function AddCustomerPanel({
  locale,
  ar,
  action,
  returnTo,
}: {
  locale: Locale;
  ar: boolean;
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
}) {
  const [open, setOpen] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // Small delay so the input exists and layout settles.
    const t = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="mt-8 sbc-card rounded-2xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">{ar ? "إضافة عميل" : "Add customer"}</div>
          <div className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "يمكنك إضافة عميل جديد يدوياً عند الحاجة."
              : "Add a new customer manually when needed."}
          </div>
        </div>

        <button
          type="button"
          className={buttonVariants({ variant: open ? "secondary" : "primary", size: "md" })}
          aria-expanded={open}
          aria-controls="add-customer-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (ar ? "إخفاء" : "Hide") : (ar ? "إضافة عميل" : "Add customer")}
        </button>
      </div>

      <div
        id="add-customer-panel"
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200",
          open ? "grid-rows-[1fr] opacity-100 mt-5" : "grid-rows-[0fr] opacity-0 mt-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <form action={action} className="grid gap-4 p-1">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid gap-4 sm:grid-cols-2 p-1">
              <Input
                ref={nameRef}
                name="fullName"
                placeholder={ar ? "اسم العميل" : "Customer full name"}
                required
              />
              <Input name="phone" placeholder={ar ? "الهاتف" : "Phone"} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 p-1">
              <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
              <Input name="tags" placeholder={ar ? "وسوم (قريباً)" : "Tags (soon)"} disabled />
            </div>
            <div className="p-1">
              <Input name="notes" placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} />
            </div>
            <div className="flex justify-end">
              <button className={buttonVariants({ variant: "primary", size: "md" })} type="submit">
                {ar ? "حفظ العميل" : "Save customer"}
              </button>
            </div>
          </form>

          <div className="mt-3 text-xs text-(--muted-foreground)">
            {ar
              ? "ملاحظة: رقم الهاتف مطلوب لسهولة البحث لاحقاً."
              : "Note: Phone is required for fast lookup later."}
          </div>
        </div>
      </div>
    </div>
  );
}
