"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Business } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";

export function CustomDomainSettings({
  locale,
  business,
}: {
  locale: Locale;
  business: Business;
}) {
  const ar = locale === "ar";
  const [domainValue, setDomainValue] = useState(business.customDomain ?? "");
  const [domainStatus, setDomainStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "saving" | "saved">("idle");
  const [domainMessage, setDomainMessage] = useState("");
  const domainCheckRef = useRef(0);

  useEffect(() => {
    const normalized = domainValue.trim().toLowerCase();
    if (!normalized) {
      queueMicrotask(() => {
        setDomainStatus("idle");
        setDomainMessage("");
      });
      return;
    }

    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(normalized)) {
      queueMicrotask(() => {
        setDomainStatus("invalid");
        setDomainMessage(ar ? "صيغة الدومين غير صحيحة" : "Invalid domain format");
      });
      return;
    }

    if (normalized === business.customDomain) {
      queueMicrotask(() => {
        setDomainStatus("idle");
        setDomainMessage(ar ? "الدومين الحالي" : "Current domain");
      });
      return;
    }

    queueMicrotask(() => {
      setDomainStatus("checking");
      setDomainMessage(ar ? "جارٍ التحقق..." : "Checking availability...");
    });

    const requestId = ++domainCheckRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/businesses/domain?domain=${encodeURIComponent(normalized)}&excludeId=${business.id}`
        );
        const data = await res.json();
        if (requestId !== domainCheckRef.current) return;

        if (data.available) {
          setDomainStatus("available");
          setDomainMessage(ar ? "متاح" : "Available");
        } else {
          setDomainStatus(data.reason === "TAKEN" ? "taken" : "invalid");
          setDomainMessage(
            data.reason === "TAKEN"
              ? (ar ? "الدومين مستخدم من قبل آخر" : "Domain already in use")
              : (ar ? "صيغة غير صحيحة" : "Invalid format")
          );
        }
      } catch {
        if (requestId !== domainCheckRef.current) return;
        setDomainStatus("invalid");
        setDomainMessage(ar ? "تعذر التحقق الآن" : "Could not check right now");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [domainValue, business.id, business.customDomain, ar]);

  const saveDomain = async () => {
    const normalized = domainValue.trim().toLowerCase() || null;

    setDomainStatus("saving");
    setDomainMessage(ar ? "جارٍ الحفظ..." : "Saving...");

    try {
      const res = await fetch("/api/businesses/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, domain: normalized }),
      });
      const data = await res.json();

      if (data.ok) {
        setDomainStatus("saved");
        setDomainMessage(ar ? "تم الحفظ بنجاح" : "Saved successfully");
        setTimeout(() => {
          setDomainStatus("idle");
          setDomainMessage(normalized ? (ar ? "الدومين الحالي" : "Current domain") : "");
        }, 2000);
        return;
      }

      setDomainStatus("invalid");
      setDomainMessage(
        data.error === "DOMAIN_TAKEN"
          ? (ar ? "الدومين مستخدم" : "Domain taken")
          : data.error === "INVALID_DOMAIN"
            ? (ar ? "صيغة الدومين غير صحيحة" : "Invalid domain format")
            : (ar ? "خطأ في الحفظ" : "Save failed")
      );
    } catch {
      setDomainStatus("invalid");
      setDomainMessage(ar ? "خطأ في الاتصال" : "Connection error");
    }
  };

  return (
    <div className="mt-6 grid gap-6">
      <div className="sbc-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {ar ? "الدومين المخصص" : "Custom Domain"}
        </h2>
        <p className="text-sm text-(--muted-foreground) mb-6">
          {ar
            ? "اربط دومين خاص بك بصفحة نشاطك التجاري واجعل الوصول إليه مباشراً."
            : "Connect your own domain to your business page and make it directly accessible."}
        </p>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-foreground">
              {ar ? "اسم الدومين" : "Domain Name"}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="example.com"
                value={domainValue}
                onChange={(e) => setDomainValue(e.target.value.toLowerCase().trim())}
                className="flex-1"
              />
              <Button
                type="button"
                variant={domainStatus === "available" || (domainValue && domainStatus === "idle") ? "primary" : "secondary"}
                onClick={saveDomain}
                disabled={domainStatus === "checking" || domainStatus === "saving" || domainStatus === "taken" || domainStatus === "invalid"}
              >
                {domainStatus === "saving"
                  ? (ar ? "جارٍ الحفظ..." : "Saving...")
                  : (ar ? "حفظ الدومين" : "Save Domain")}
              </Button>
            </div>
            <span
              className={`min-h-4 text-xs ${
                domainStatus === "available" || domainStatus === "saved"
                  ? "text-emerald-600"
                  : domainStatus === "checking" || domainStatus === "idle" || domainStatus === "saving"
                    ? "text-(--muted-foreground)"
                    : "text-red-600"
              }`}
            >
              {domainMessage || " "}
            </span>
          </div>
        </div>
      </div>

      <div className="sbc-card rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground mb-2">
          {ar ? "إعدادات DNS المطلوبة" : "Required DNS Settings"}
        </h3>
        <p className="text-sm text-(--muted-foreground) mb-4">
          {ar
            ? "أضف السجلات التالية في إعدادات DNS لدى مزود الدومين الخاص بك."
            : "Add the following records in your domain provider DNS settings."}
        </p>

        <div className="space-y-2 rounded-xl bg-(--chip-bg) p-4 font-mono text-xs">
          <div className="flex gap-4">
            <span className="w-16 text-(--muted-foreground)">Type:</span>
            <span>CNAME</span>
          </div>
          <div className="flex gap-4">
            <span className="w-16 text-(--muted-foreground)">Name:</span>
            <span>@ or www</span>
          </div>
          <div className="flex gap-4">
            <span className="w-16 text-(--muted-foreground)">Value:</span>
            <span>sbc.om</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-(--muted-foreground)">
          {ar
            ? "ملاحظة: قد يستغرق تفعيل DNS من 24 إلى 48 ساعة."
            : "Note: DNS propagation may take 24 to 48 hours."}
        </p>
      </div>
    </div>
  );
}