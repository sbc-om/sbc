"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HiCheckCircle,
  HiDownload,
  HiLogout,
  HiPencilAlt,
  HiPhotograph,
  HiQrcode,
  HiSearch,
  HiSparkles,
  HiUserCircle,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { QrScanner } from "@/components/QrScanner";
import type { Locale } from "@/lib/i18n/locales";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type StaffInfo = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  phone: string;
};

type CustomerInfo = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  points: number;
  cardId: string;
  memberId: string;
};

export function StaffWorkspaceClient({
  locale,
  joinCode,
  businessName,
  businessLogoUrl,
  initialStaff,
}: {
  locale: Locale;
  joinCode: string;
  businessName: string;
  businessLogoUrl?: string;
  initialStaff: StaffInfo | null;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [working, setWorking] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffInfo | null>(initialStaff);
  const [profileName, setProfileName] = useState(initialStaff?.fullName ?? "");
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isLoggedIn = Boolean(staff);
  const normalizedPhone = phone.replace(/\D/g, "").trim();

  const subtitle = useMemo(
    () =>
      ar
        ? "لوحة تشغيل سريعة للبائع: مسح QR، العثور على العميل، إضافة نقاط أو تنفيذ ريديم."
        : "Fast seller workspace: scan QR, find customer, add points or redeem.",
    [ar],
  );

  const profileShortHelp = useMemo(
    () =>
      ar
        ? "عدّل اسمك وصورتك الشخصية من قائمة الملف الشخصي."
        : "Edit your seller name and avatar from the profile menu.",
    [ar],
  );

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!deferredInstallPrompt) return;
    setInstalling(true);
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setSuccess(ar ? "تم تثبيت تطبيق البائع بنجاح." : "Seller app installed successfully.");
      }
      setDeferredInstallPrompt(null);
    } finally {
      setInstalling(false);
    }
  };

  const sendOtp = async () => {
    if (!normalizedPhone) return;
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/staff/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, phone: normalizedPhone, locale }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "SEND_OTP_FAILED");
      setOtpSent(true);
      setSuccess(ar ? "تم إرسال الكود بنجاح." : "Verification code sent successfully.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "SEND_OTP_FAILED";
      if (code === "STAFF_NOT_FOUND") {
        setError(
          ar
            ? "هذا الرقم غير مسجل كبائع لدى المالك. استخدم نفس الرقم المُسجّل لدى إدارة الولاء."
            : "This phone is not registered as a seller by the owner. Use the exact phone saved in Loyalty staff.",
        );
      } else if (code === "STAFF_INACTIVE") {
        setError(ar ? "هذا البائع مُعطّل حالياً. راجع مالك البرنامج." : "This seller is currently inactive. Contact the loyalty owner.");
      } else if (code === "OTP_RATE_LIMIT") {
        setError(ar ? "تم إرسال كود مؤخراً. الرجاء الانتظار قليلاً ثم إعادة المحاولة." : "A code was sent recently. Please wait and try again.");
      } else if (code === "JOIN_CODE_NOT_FOUND") {
        setError(ar ? "رابط بوابة البائع غير صالح." : "Invalid seller portal link.");
      } else if (code === "WAHA_DISABLED") {
        setError(ar ? "خدمة واتساب غير متاحة حالياً." : "WhatsApp service is currently unavailable.");
      } else if (code === "WHATSAPP_SEND_FAILED") {
        setError(ar ? "تعذر إرسال الكود عبر واتساب حالياً. حاول بعد قليل." : "Could not deliver code via WhatsApp right now. Please try again shortly.");
      } else if (code === "INVALID_PAYLOAD") {
        setError(ar ? "بيانات الطلب غير صالحة." : "Invalid request data.");
      } else {
        setError(
          ar
            ? `تعذر إرسال الكود حالياً. (${code})`
            : `Could not send code right now. (${code})`,
        );
      }
    } finally {
      setWorking(false);
    }
  };

  const verifyOtp = async () => {
    if (!normalizedPhone || otp.trim().length !== 6) return;
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/staff/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, phone: normalizedPhone, code: otp.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; staff?: StaffInfo };
      if (!res.ok || !data.ok || !data.staff) throw new Error(data.error || "VERIFY_FAILED");
      setStaff(data.staff);
      setProfileName(data.staff.fullName);
      setOtp("");
      setOtpSent(false);
      setSuccess(ar ? "تم تسجيل الدخول بنجاح." : "Login successful.");
    } catch {
      setError(ar ? "كود غير صحيح أو منتهي الصلاحية." : "Invalid or expired code.");
    } finally {
      setWorking(false);
    }
  };

  const logout = async () => {
    setError(null);
    setSuccess(null);
    setWorking(true);
    await fetch("/api/loyalty/staff/logout", { method: "POST" });
    setStaff(null);
    setProfileName("");
    setCustomer(null);
    setShowProfileMenu(false);
    setWorking(false);
    router.replace(`/${locale}/loyalty/staff/${joinCode}`);
  };

  const saveProfile = async () => {
    if (!staff || !profileName.trim()) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/staff/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: profileName.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; staff?: StaffInfo };
      if (!res.ok || !data.ok || !data.staff) throw new Error(data.error || "UPDATE_PROFILE_FAILED");

      setStaff(data.staff);
      setProfileName(data.staff.fullName);
      setSuccess(ar ? "تم حفظ ملفك الشخصي." : "Profile updated successfully.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "UPDATE_PROFILE_FAILED";
      setError(ar ? `تعذر حفظ الملف الشخصي. (${code})` : `Could not save profile. (${code})`);
    } finally {
      setSavingProfile(false);
    }
  };

  const onPickAvatar = async (files: FileList | null) => {
    if (!staff || !files || files.length === 0) return;

    setBusyAvatar(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.set("file", files[0]);

      const res = await fetch("/api/loyalty/staff/me/avatar", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { ok: boolean; error?: string; avatarUrl?: string | null };
      if (!res.ok || !data.ok) throw new Error(data.error || "UPLOAD_FAILED");

      setStaff((current) => (current ? { ...current, avatarUrl: data.avatarUrl ?? null } : current));
      setSuccess(ar ? "تم تحديث الصورة." : "Avatar updated successfully.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
      setError(ar ? `تعذر رفع الصورة. (${code})` : `Could not upload avatar. (${code})`);
    } finally {
      setBusyAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!staff) return;

    setBusyAvatar(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/staff/me/avatar", { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string; avatarUrl?: string | null };
      if (!res.ok || !data.ok) throw new Error(data.error || "DELETE_FAILED");

      setStaff((current) => (current ? { ...current, avatarUrl: data.avatarUrl ?? null } : current));
      setSuccess(ar ? "تم حذف الصورة." : "Avatar removed.");
    } catch (error) {
      const code = error instanceof Error ? error.message : "DELETE_FAILED";
      setError(ar ? `تعذر حذف الصورة. (${code})` : `Could not remove avatar. (${code})`);
    } finally {
      setBusyAvatar(false);
    }
  };

  const lookup = async (payload?: { cardId?: string; customerId?: string; query?: string; memberId?: string }) => {
    const effectiveQuery = payload?.query ?? query.trim();
    if (!payload?.cardId && !payload?.customerId && !payload?.memberId && !effectiveQuery) return;

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/staff/customers/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode,
          cardId: payload?.cardId,
          customerId: payload?.customerId,
          memberId: payload?.memberId,
          query: effectiveQuery,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; customer?: CustomerInfo | null };
      if (!res.ok || !data.ok) throw new Error(data.error || "LOOKUP_FAILED");
      if (!data.customer) {
        setError(ar ? "لم يتم العثور على عميل." : "No customer found.");
        setCustomer(null);
      } else {
        setCustomer(data.customer);
      }
    } catch {
      setError(ar ? "تعذر البحث عن العميل." : "Customer lookup failed.");
    } finally {
      setWorking(false);
    }
  };

  const mutatePoints = async (mode: "add" | "redeem", delta = 0) => {
    if (!customer) return;
    setBusyAction(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "add") {
        const res = await fetch(`/api/loyalty/staff/customers/${customer.id}/points`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string; customer?: CustomerInfo };
        if (!res.ok || !data.ok || !data.customer) throw new Error(data.error || "POINTS_FAILED");
        setCustomer((c) => (c ? { ...c, points: data.customer!.points } : c));
        setSuccess(ar ? "تمت إضافة النقاط بنجاح." : "Points added successfully.");
      } else {
        const res = await fetch(`/api/loyalty/staff/customers/${customer.id}/redeem`, { method: "POST" });
        const data = (await res.json()) as { ok: boolean; error?: string; customer?: CustomerInfo };
        if (!res.ok || !data.ok || !data.customer) throw new Error(data.error || "REDEEM_FAILED");
        setCustomer((c) => (c ? { ...c, points: data.customer!.points } : c));
        setSuccess(ar ? "تم تنفيذ الاستبدال بنجاح." : "Redemption completed successfully.");
      }
    } catch {
      setError(ar ? "فشل تحديث النقاط." : "Failed to update points.");
    } finally {
      setBusyAction(false);
    }
  };

  const handleScan = (data: string) => {
    setShowScanner(false);

    try {
      const url = new URL(data);
      const parts = url.pathname.split("/").filter(Boolean);
      const cardIndex = parts.indexOf("card");
      if (cardIndex >= 0 && parts[cardIndex + 1]) {
        void lookup({ cardId: parts[cardIndex + 1] });
        return;
      }
      const customerIndex = parts.indexOf("customers");
      if (customerIndex >= 0 && parts[customerIndex + 1]) {
        void lookup({ customerId: parts[customerIndex + 1] });
        return;
      }
    } catch {
      // fallthrough for raw text
    }

    void lookup({ query: data.trim() });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-(--surface-border) bg-(--background)">
              {businessLogoUrl ? (
                <Image src={businessLogoUrl} alt={businessName} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-accent">
                  <HiSparkles className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{businessName}</h1>
              <p className="mt-0.5 text-xs text-(--muted-foreground)">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-(--surface-border) bg-(--background) p-3">
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <HiQrcode className="h-5 w-5" />
              <span className="text-xs font-semibold">{ar ? "المسح السريع" : "Quick scan"}</span>
            </div>
            <p className="text-xs text-(--muted-foreground)">{ar ? "امسح بطاقة العميل بالـ QR فوراً." : "Scan customer QR card instantly."}</p>
          </div>
          <div className="rounded-xl border border-(--surface-border) bg-(--background) p-3">
            <div className="mb-2 flex items-center gap-2 text-emerald-600">
              <HiSearch className="h-5 w-5" />
              <span className="text-xs font-semibold">{ar ? "بحث ذكي" : "Smart search"}</span>
            </div>
            <p className="text-xs text-(--muted-foreground)">{ar ? "ابحث بالاسم أو الرقم أو الممبر." : "Search by name, phone, or member ID."}</p>
          </div>
          <div className="rounded-xl border border-(--surface-border) bg-(--background) p-3">
            <div className="mb-2 flex items-center gap-2 text-amber-600">
              <HiCheckCircle className="h-5 w-5" />
              <span className="text-xs font-semibold">{ar ? "إجراءات سريعة" : "Quick actions"}</span>
            </div>
            <p className="text-xs text-(--muted-foreground)">{ar ? "أضف نقاطاً أو نفّذ ريديم بنقرة." : "Add points or redeem in one tap."}</p>
          </div>
        </div>

        {isStandalone === false ? (
          <div className="mt-3 rounded-xl border border-(--surface-border) bg-(--background) p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{ar ? "تثبيت تطبيق البائع" : "Install seller app"}</p>
                <p className="text-xs text-(--muted-foreground)">
                  {isIos
                    ? (ar
                        ? "على iPhone/iPad: افتح مشاركة Safari ثم اختر إضافة إلى الشاشة الرئيسية."
                        : "On iPhone/iPad: open Safari Share menu, then Add to Home Screen.")
                    : (ar
                        ? "ثبّت هذه الصفحة كتطبيق مستقل باسم وهوية بزينسك."
                        : "Install this page as a standalone app with your business identity.")}
                </p>
              </div>
              {deferredInstallPrompt ? (
                <Button variant="secondary" onClick={installApp} disabled={installing}>
                  <HiDownload className="h-4 w-4" />
                  {installing ? (ar ? "جاري التثبيت..." : "Installing...") : (ar ? "تثبيت التطبيق" : "Install App")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isLoggedIn ? (
          <div className="mt-4 grid gap-3">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder={ar ? "91234567" : "91234567"}
              autoComplete="tel"
              locale={ar ? "ar" : "en"}
            />
            {otpSent ? (
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={ar ? "كود التحقق (6 أرقام)" : "Verification code (6 digits)"}
                dir="ltr"
                maxLength={6}
              />
            ) : null}

            <div className="flex gap-2">
              {!otpSent ? (
                <Button className="flex-1" disabled={working || !normalizedPhone} onClick={sendOtp}>
                  {working ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال الكود" : "Send code")}
                </Button>
              ) : (
                <>
                  <Button className="flex-1" disabled={working || otp.length !== 6} onClick={verifyOtp}>
                    {working ? (ar ? "جاري التحقق..." : "Verifying...") : (ar ? "دخول" : "Login")}
                  </Button>
                  <Button variant="secondary" disabled={working} onClick={sendOtp}>
                    {ar ? "إعادة إرسال" : "Resend"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-(--surface-border) bg-(--background) p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3"
                onClick={() => setShowProfileMenu((v) => !v)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full border border-(--surface-border) bg-(--surface)">
                    {staff?.avatarUrl ? (
                      <Image src={staff.avatarUrl} alt={staff.fullName} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-accent">
                        <HiUserCircle className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-start">
                    <div className="truncate text-sm font-semibold">{staff?.fullName}</div>
                    <div className="text-xs text-(--muted-foreground)" dir="ltr">{staff?.phone}</div>
                  </div>
                </div>
                <span className="text-xs text-(--muted-foreground)">{ar ? "الملف الشخصي" : "Profile"}</span>
              </button>

              {showProfileMenu ? (
                <div className="mt-3 space-y-3 border-t border-(--surface-border) pt-3">
                  <p className="text-xs text-(--muted-foreground)">{profileShortHelp}</p>

                  <label className="text-xs font-semibold text-(--muted-foreground)">{ar ? "الاسم" : "Name"}</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={ar ? "اسم البائع" : "Seller name"}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={savingProfile || !profileName.trim()}
                      onClick={saveProfile}
                    >
                      <HiPencilAlt className="h-4 w-4" />
                      {savingProfile ? (ar ? "حفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm font-medium">
                      <HiPhotograph className="h-4 w-4 text-indigo-600" />
                      <span>{busyAvatar ? (ar ? "جاري الرفع..." : "Uploading...") : (ar ? "رفع صورة" : "Upload avatar")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={busyAvatar}
                        onChange={(e) => void onPickAvatar(e.target.files)}
                      />
                    </label>
                    <Button size="sm" variant="ghost" disabled={busyAvatar || !staff?.avatarUrl} onClick={removeAvatar}>
                      {ar ? "حذف الصورة" : "Remove avatar"}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={working} onClick={logout}>
                      <HiLogout className="h-4 w-4 text-red-500" />
                      {ar ? "خروج" : "Logout"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-stretch gap-2">
              <Input
                className="min-w-0"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ar ? "ابحث بالهاتف أو الاسم أو امسح QR" : "Search by phone/name or scan QR"}
              />
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => setShowScanner(true)} aria-label={ar ? "مسح QR" : "Scan QR"}>
                  <HiQrcode className="h-4 w-4" />
                  <span className="hidden sm:inline">{ar ? "مسح QR" : "Scan QR"}</span>
                </Button>
                <Button onClick={() => void lookup()} disabled={working || !query.trim()} aria-label={ar ? "بحث" : "Search"}>
                  <HiSearch className="h-4 w-4" />
                  <span className="hidden sm:inline">{ar ? "بحث" : "Search"}</span>
                </Button>
              </div>
            </div>

            {showScanner ? <QrScanner locale={locale} onClose={() => setShowScanner(false)} onScan={handleScan} /> : null}

            {customer ? (
              <div className="rounded-xl border border-(--surface-border) bg-(--background) p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{customer.fullName}</div>
                    <div className="text-xs text-(--muted-foreground)" dir="ltr">
                      {customer.phone || customer.memberId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-(--muted-foreground)">{ar ? "النقاط" : "Points"}</div>
                    <div className="text-2xl font-bold text-accent">{customer.points}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
                  <Button variant="secondary" disabled={busyAction} onClick={() => void mutatePoints("add", -5)}>
                    -5
                  </Button>
                  <Button variant="secondary" disabled={busyAction} onClick={() => void mutatePoints("add", -1)}>
                    -1
                  </Button>
                  <Button variant="secondary" disabled={busyAction} onClick={() => void mutatePoints("add", 1)}>
                    +1
                  </Button>
                  <Button variant="secondary" disabled={busyAction} onClick={() => void mutatePoints("add", 5)}>
                    +5
                  </Button>
                  <Button variant="destructive" disabled={busyAction} onClick={() => void mutatePoints("redeem")}>
                    {ar ? "ريديم" : "Redeem"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {success ? <p className="mt-3 text-xs text-emerald-600">{success}</p> : null}
        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
