"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";
import type { LoyaltyStaff } from "@/lib/db/types";

type Props = {
  locale: Locale;
  joinCode: string;
  initialStaff: LoyaltyStaff[];
};

export function LoyaltyStaffManager({ locale, joinCode, initialStaff }: Props) {
  const ar = locale === "ar";

  const [staff, setStaff] = useState<LoyaltyStaff[]>(initialStaff);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const portalLink = useMemo(
    () => `/${locale}/loyalty/staff/${joinCode}`,
    [joinCode, locale],
  );

  const saveStaff = async () => {
    if (!fullName.trim() || !phone.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/loyalty/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
      });
      const data = (await res.json()) as
        | { ok: true; staff: LoyaltyStaff }
        | { ok: false; error?: string };

      if (!res.ok || !data.ok) throw new Error((data as { error?: string }).error || "CREATE_FAILED");

      setStaff((list) => {
        const exists = list.find((item) => item.id === data.staff.id);
        if (exists) return list.map((item) => (item.id === data.staff.id ? data.staff : item));
        return [data.staff, ...list];
      });
      setFullName("");
      setPhone("");
      setMessage(ar ? "تم حفظ البائع بنجاح." : "Seller saved successfully.");
    } catch {
      setMessage(ar ? "تعذر حفظ البائع." : "Could not save seller.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setStaff((list) => list.map((item) => (item.id === id ? { ...item, isActive: !current } : item)));
    try {
      const res = await fetch("/api/loyalty/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      const data = (await res.json()) as
        | { ok: true; staff: LoyaltyStaff }
        | { ok: false; error?: string };

      if (!res.ok || !data.ok) throw new Error((data as { error?: string }).error || "UPDATE_FAILED");
      setStaff((list) => list.map((item) => (item.id === id ? data.staff : item)));
    } catch {
      setStaff((list) => list.map((item) => (item.id === id ? { ...item, isActive: current } : item)));
      setMessage(ar ? "تعذر تحديث الحالة." : "Could not update status.");
    }
  };

  return (
    <div className="mt-8 sbc-card rounded-2xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{ar ? "إدارة البائعين" : "Seller Management"}</h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "أضف بائعين غير تابعين لحسابات النظام. كل بائع لديه دخول OTP وصفحة تشغيل سريعة." 
              : "Add non-system sellers. Each seller gets OTP login and a fast mobile workspace."}
          </p>
        </div>
        <a href={portalLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
          {ar ? "فتح بوابة البائع" : "Open seller portal"} →
        </a>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={ar ? "اسم البائع" : "Seller name"}
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={ar ? "رقم الهاتف" : "Phone number"}
          dir="ltr"
        />
        <Button variant="primary" disabled={saving || !fullName.trim() || !phone.trim()} onClick={saveStaff}>
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "إضافة بائع" : "Add seller")}
        </Button>
      </div>

      {message ? <p className="mt-3 text-xs text-(--muted-foreground)">{message}</p> : null}

      <div className="mt-4 grid gap-3">
        {staff.length === 0 ? (
          <div className="rounded-xl border border-(--surface-border) p-4 text-sm text-(--muted-foreground)">
            {ar ? "لا يوجد بائعون بعد." : "No sellers yet."}
          </div>
        ) : (
          staff.map((item) => (
            <div key={item.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{item.fullName}</div>
                  <div className="text-xs text-(--muted-foreground)" dir="ltr">{item.phone}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {item.isVerified
                      ? ar
                        ? "تم التحقق من الهاتف"
                        : "Phone verified"
                      : ar
                      ? "بانتظار التحقق"
                      : "Pending verification"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => toggleActive(item.id, item.isActive)}>
                    {item.isActive ? (ar ? "تعطيل" : "Disable") : (ar ? "تفعيل" : "Enable")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const url = `${window.location.origin}/${locale}/loyalty/staff/${joinCode}?phone=${encodeURIComponent(item.phone)}`;
                      await navigator.clipboard.writeText(url);
                      setMessage(ar ? "تم نسخ رابط البوابة." : "Portal link copied.");
                    }}
                  >
                    {ar ? "نسخ الرابط" : "Copy link"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
