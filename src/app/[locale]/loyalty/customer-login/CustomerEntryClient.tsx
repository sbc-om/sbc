"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";

export function CustomerEntryClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");

  const openBusinessPortal = () => {
    const code = joinCode.trim();
    if (!code) return;
    router.push(`/${locale}/loyalty/customer-login/${encodeURIComponent(code)}`);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-(--surface) p-5 sm:p-6">
      <h1 className="text-xl font-semibold">{ar ? "دخول العميل" : "Customer Login"}</h1>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {ar
          ? "أدخل كود البزنس أولاً، ثم تابع التحقق برقم الهاتف داخل صفحة البزنس."
          : "Enter the business code first, then continue with phone verification on the business page."}
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder={ar ? "كود البزنس" : "Business code"}
          autoComplete="off"
          dir="ltr"
        />

        <Button onClick={openBusinessPortal} disabled={!joinCode.trim()}>
          {ar ? "فتح صفحة البزنس" : "Open Business Page"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-(--muted-foreground)">
        {ar
          ? "إذا ما عندك الكود، اطلبه من صاحب النشاط."
          : "If you do not have the code, ask the business owner."}
      </p>
    </div>
  );
}
