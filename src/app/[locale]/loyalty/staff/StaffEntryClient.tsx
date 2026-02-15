"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";

export function StaffEntryClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const goToPortal = () => {
    const code = joinCode.trim();
    if (!code) return;

    setError(null);

    const normalizedPhone = phone.replace(/\D/g, "").trim();
    if (normalizedPhone && (normalizedPhone.length < 8 || normalizedPhone.length > 15)) {
      setError(ar ? "الرجاء إدخال رقم صحيح مع كود الدولة." : "Please enter a valid phone with country code.");
      return;
    }

    const query = normalizedPhone ? `?phone=${encodeURIComponent(normalizedPhone)}` : "";
    router.push(`/${locale}/loyalty/staff/${encodeURIComponent(code)}${query}`);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-(--surface-border) bg-(--surface) p-5 sm:p-6">
      <h1 className="text-xl font-semibold">{ar ? "دخول البائع" : "Seller Login"}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {ar
          ? "أدخل كود البزنس أولاً، ثم أكمل الدخول برقم الجوال داخل صفحة البزنس."
          : "Enter the business code first, then log in with your phone on the business page."}
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder={ar ? "كود البزنس" : "Business code"}
          autoComplete="off"
          dir="ltr"
        />

        <PhoneInput
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (error) setError(null);
          }}
          placeholder={ar ? "91234567" : "91234567"}
          autoComplete="tel"
          locale={ar ? "ar" : "en"}
        />

        <Button onClick={goToPortal} disabled={!joinCode.trim()}>
          {ar ? "دخول صفحة البزنس" : "Open Business Portal"}
        </Button>

        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>

      <p className="mt-3 text-xs text-(--muted-foreground)">
        {ar
          ? "إذا ما عندك الكود، تواصل مع صاحب البرنامج."
          : "If you don't have the code, ask the business owner."}
      </p>
    </div>
  );
}
