"use client";

import { useState } from "react";
import Image from "next/image";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/locales";
import { LoyaltyPointsIcons } from "@/components/loyalty/LoyaltyPointsIcons";

type CustomerData = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  points: number;
  cardId: string;
};

type ProfileData = {
  businessName: string;
  logoUrl?: string;
  joinCode: string;
  pointsIconUrl?: string;
};

export function CustomerLookupForm({
  locale,
  joinCode,
}: {
  locale: Locale;
  joinCode: string;
}) {
  const ar = locale === "ar";
  const rtl = ar;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError(null);
    setCustomer(null);
    setProfile(null);
    setQrDataUrl(null);

    try {
      const res = await fetch("/api/loyalty/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, phone: phone.trim() }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(
          data.error === "CUSTOMER_NOT_FOUND"
            ? ar
              ? "لم يتم العثور على العميل بهذا الرقم."
              : "Customer not found with this phone number."
            : ar
            ? "حدث خطأ أثناء البحث."
            : "An error occurred during lookup."
        );
        return;
      }

      setProfile(data.profile);
      setCustomer(data.customer);

      // Generate QR code for the customer card
      if (data.customer?.cardId) {
        const qr = await import("qrcode");
        const cardUrl = `${window.location.origin}/${locale}/loyalty/card/${data.customer.cardId}`;
        const dataUrl = await qr.toDataURL(cardUrl, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      }
    } catch (err) {
      setError(
        ar ? "حدث خطأ غير متوقع." : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleLookup} className={cn("mb-6", rtl ? "text-right" : "text-left")}>
        <div className="flex gap-2">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={ar ? "رقم الهاتف" : "Phone number"}
            disabled={loading}
            className="flex-1"
            dir="ltr"
          />
          <Button type="submit" variant="primary" disabled={loading || !phone.trim()}>
            {loading ? (ar ? "جارٍ البحث..." : "Searching...") : ar ? "بحث" : "Search"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {customer && profile && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          {/* Customer Info Card */}
          <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
            <div className={cn("flex items-center justify-between gap-4", rtl ? "flex-row-reverse" : "")}>
              <div className={cn("flex items-center gap-3", rtl ? "flex-row-reverse" : "")}>
                <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-(--surface-border) bg-(--surface)">
                  {profile.logoUrl ? (
                    <Image src={profile.logoUrl} alt={profile.businessName} fill className="object-cover" />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(14,165,233,0.22))",
                      }}
                    />
                  )}
                </div>
                <div className={cn(rtl ? "text-right" : "text-left")}>
                  <div className="text-xs text-(--muted-foreground)">{ar ? "النشاط" : "Business"}</div>
                  <div className="text-sm font-semibold leading-tight">{profile.businessName}</div>
                </div>
              </div>

              <div className={cn("rounded-xl bg-linear-to-br from-accent to-accent-2 px-4 py-2 text-center", rtl ? "ml-4" : "mr-4")}>
                <div className="text-xs font-medium text-white/80">{ar ? "النقاط" : "Points"}</div>
                <div className="text-2xl font-bold text-white">{customer.points}</div>
              </div>
            </div>

            <div className={cn("mt-5 flex items-start justify-between gap-6", rtl ? "flex-row-reverse" : "")}>
              <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
                <div className="text-xs text-(--muted-foreground)">{ar ? "العميل" : "Customer"}</div>
                <h3 className="mt-1 truncate text-lg font-semibold">{customer.fullName}</h3>
                {customer.phone ? (
                  <p className="mt-1 text-sm text-(--muted-foreground)" dir="ltr">
                    {customer.phone}
                  </p>
                ) : null}
                {customer.email ? (
                  <p className="mt-1 truncate text-sm text-(--muted-foreground)">{customer.email}</p>
                ) : null}
              </div>

              <div className={cn("shrink-0", rtl ? "text-left" : "text-right")}>
                <div className="text-xs text-(--muted-foreground)">{ar ? "عرض الأيقونات" : "Icon view"}</div>
                <div className="mt-2">
                  <LoyaltyPointsIcons
                    points={customer.points}
                    iconUrl={profile.pointsIconUrl ?? profile.logoUrl}
                    maxIcons={80}
                    className={cn(rtl ? "justify-end" : "justify-start")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
              <h4 className={cn("mb-4 text-sm font-semibold", rtl ? "text-right" : "text-left")}>
                {ar ? "رمز QR للبطاقة" : "Card QR Code"}
              </h4>
              <div className="flex justify-center">
                <div className="rounded-2xl border border-(--surface-border) bg-white p-3">
                  <Image
                    src={qrDataUrl}
                    alt="QR Code"
                    width={300}
                    height={300}
                    unoptimized
                  />
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-(--muted-foreground)">
                {ar
                  ? "امسح هذا الرمز لعرض بطاقة الولاء الكاملة"
                  : "Scan this code to view the full loyalty card"}
              </p>
            </div>
          )}

          {/* Barcode */}
          <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
            <h4 className={cn("mb-4 text-sm font-semibold", rtl ? "text-right" : "text-left")}>
              {ar ? "الباركود" : "Barcode"}
            </h4>
            <div className="flex justify-center overflow-hidden rounded-xl bg-white p-4">
              <Barcode
                value={customer.cardId}
                format="CODE128"
                width={2}
                height={80}
                displayValue={true}
                fontSize={14}
                margin={10}
              />
            </div>
            <p className="mt-3 text-center text-xs text-(--muted-foreground)">
              {ar
                ? "يمكن مسح الباركود باستخدام قارئ الباركود"
                : "Can be scanned with a barcode reader"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
