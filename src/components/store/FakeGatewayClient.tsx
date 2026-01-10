"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HiCreditCard, HiShieldCheck, HiX, HiArrowRight } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export function FakeGatewayClient({
  locale,
  returnTo,
}: {
  locale: Locale;
  returnTo: string;
}) {
  const router = useRouter();
  const rtl = localeDir(locale) === "rtl";

  const t = {
    title: locale === "ar" ? "بوابة الدفع (تجريبية)" : "Payment Gateway (Demo)",
    subtitle:
      locale === "ar"
        ? "هذه صفحة بوابة وهمية لمحاكاة التحويل والعودة."
        : "This is a fake gateway page to simulate redirect + return.",
    pay: locale === "ar" ? "ادفع الآن" : "Pay now",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
  };

  const goBack = (status: "success" | "cancel") => {
    const ref = Math.random().toString(16).slice(2);
    router.replace(`${returnTo}?status=${status}&ref=${ref}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sbc-card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HiShieldCheck className="h-6 w-6 text-(--muted-foreground)" />
              <h1 className="text-2xl font-semibold">{t.title}</h1>
            </div>
            <p className="mt-2 text-sm text-(--muted-foreground)">{t.subtitle}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label={t.cancel} onClick={() => goBack("cancel")}>
            <HiX className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "لن يتم تنفيذ أي دفع حقيقي. اضغط (ادفع الآن) للعودة إلى صفحة الدفع بنتيجة نجاح."
            : "No real payment will happen. Click (Pay now) to return to checkout with a success result."}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md" onClick={() => goBack("success")}>
            <HiCreditCard className="h-5 w-5" />
            {t.pay}
            <HiArrowRight className={cn("h-5 w-5", rtl ? "rotate-180" : "")} />
          </Button>

          <Button variant="secondary" size="md" onClick={() => goBack("cancel")}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
