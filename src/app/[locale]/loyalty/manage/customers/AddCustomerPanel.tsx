"use client";

import * as React from "react";

import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { cn } from "@/lib/cn";

export function AddCustomerPanel({
  ar,
  action,
  returnTo,
}: {
  ar: boolean;
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const nameRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // Small delay so the input exists and layout settles.
    const t = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <section className="rounded-[1.7rem] bg-(--surface) p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <div className="text-lg font-semibold">{ar ? "إضافة عميل" : "Add customer"}</div>
          <div className="mt-1 text-sm leading-6 text-(--muted-foreground)">
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
          <form action={action} className="mt-1 grid gap-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                ref={nameRef}
                name="fullName"
                placeholder={ar ? "اسم العميل" : "Customer full name"}
                required
              />
              <PhoneInput
                name="phone"
                value={phone}
                onChange={setPhone}
                placeholder="91234567"
                required
                selectClassName=""
                inputClassName=""
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
              <Input name="tags" placeholder={ar ? "وسوم (قريباً)" : "Tags (soon)"} disabled className="opacity-70" />
            </div>
            <div>
              <Input name="notes" placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} />
            </div>
            <div className="flex justify-end pt-1">
              <button className={buttonVariants({ variant: "primary", size: "md" })} type="submit">
                {ar ? "حفظ العميل" : "Save customer"}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-2xl bg-(--chip-bg) px-4 py-3 text-xs leading-6 text-(--muted-foreground)">
            {ar
              ? "ملاحظة: رقم الهاتف مطلوب لسهولة البحث لاحقاً."
              : "Note: Phone is required for fast lookup later."}
          </div>
        </div>
      </div>
    </section>
  );
}
