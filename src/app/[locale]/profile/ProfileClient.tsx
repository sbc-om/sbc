"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { 
  HiUser, 
  HiShoppingBag, 
  HiCog, 
  HiKey,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiRefresh,
  HiExternalLink
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { UserPushOptIn } from "@/components/push/UserPushOptIn";
import type { Locale } from "@/lib/i18n/locales";

type ProfileDTO = {
  email: string;
  phone: string;
  pendingEmail?: string | null;
  pendingPhone?: string | null;
  approvalStatus?: "pending" | "approved";
  approvalReason?: "new" | "contact_update" | null;
  role: "admin" | "user";
  fullName: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  username?: string | null;
  stats?: {
    followedCategories: number;
    followers: number;
    businesses: number;
  };
};

type OrderItem = {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  total: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
};

function initials(email: string) {
  const base = email.split("@")[0] || "U";
  return base.slice(0, 1).toUpperCase();
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const statusIcons: Record<string, React.ElementType> = {
  completed: HiCheckCircle,
  pending: HiClock,
  cancelled: HiXCircle,
  refunded: HiRefresh,
};

export function ProfileClient({
  locale,
  initial,
}: {
  locale: Locale;
  initial: ProfileDTO;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "settings">("profile");

  const [fullName, setFullName] = useState(initial.fullName);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [, setPendingEmail] = useState(initial.pendingEmail ?? null);
  const [, setPendingPhone] = useState(initial.pendingPhone ?? null);
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved">(
    initial.approvalStatus ?? "approved",
  );
  const [approvalReason, setApprovalReason] = useState<"new" | "contact_update" | null>(
    initial.approvalReason ?? null,
  );

  const [busy, setBusy] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Username state
  const [username, setUsername] = useState<string>(initial.username ?? "");
  const [usernameInput, setUsernameInput] = useState<string>(initial.username ?? "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const ar = locale === "ar";

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  // Load orders when tab switches
  useEffect(() => {
    if (activeTab === "orders" && !ordersLoaded) {
      loadOrders();
    }
  }, [activeTab, ordersLoaded]);

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/store/orders/my");
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setOrdersLoading(false);
      setOrdersLoaded(true);
    }
  }

  // Check username availability with debounce
  useEffect(() => {
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3 || trimmed === username) {
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameAvailable(false);
      setUsernameError(ar 
        ? "يمكن استخدام الأحرف الإنجليزية الصغيرة والأرقام و _ فقط"
        : "Only lowercase letters, numbers, and _ allowed"
      );
      return;
    }

    setUsernameLoading(true);
    setUsernameError(null);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/username/check?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError(ar ? "اسم المستخدم مستخدم بالفعل" : "Username is already taken");
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [usernameInput, username, ar]);

  async function saveUsername() {
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3 || !usernameAvailable) return;

    setUsernameSaving(true);
    setUsernameError(null);
    setUsernameSuccess(false);

    try {
      const res = await fetch("/api/users/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();

      if (data.ok) {
        setUsername(trimmed);
        setUsernameSuccess(true);
        setTimeout(() => setUsernameSuccess(false), 3000);
        router.refresh();
      } else {
        setUsernameError(data.error || (ar ? "فشل في الحفظ" : "Failed to save"));
      }
    } catch {
      setUsernameError(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setUsernameSaving(false);
    }
  }

  const t = useMemo(() => {
    return {
      title: ar ? "الملف الشخصي" : "Profile",
      subtitle: ar ? "قم بتحديث معلوماتك وصورتك." : "Update your info and avatar.",
      fullName: ar ? "الاسم الكامل" : "Full name",
      displayName: ar ? "الاسم المعروض" : "Display name",
      email: ar ? "البريد الإلكتروني" : "Email",
      phone: ar ? "رقم الهاتف" : "Mobile",
      bio: ar ? "نبذة" : "Bio",
      pendingContact: ar
        ? "تحديث بيانات الاتصال قيد المراجعة من الإدارة."
        : "Your contact updates are pending admin approval.",
      emailTaken: ar ? "البريد الإلكتروني مستخدم بالفعل" : "That email is already in use.",
      phoneTaken: ar ? "رقم الهاتف مستخدم بالفعل" : "That phone number is already in use.",
      saveFailed: ar ? "تعذّر حفظ التغييرات" : "Could not save changes.",
      save: ar ? "حفظ" : "Save",
      saving: ar ? "جارٍ الحفظ…" : "Saving…",
      changePhoto: ar ? "تغيير الصورة" : "Change photo",
      removePhoto: ar ? "حذف الصورة" : "Remove photo",
      uploading: ar ? "جارٍ الرفع…" : "Uploading…",
      updated: ar ? "تم التحديث" : "Updated",
      businesses: ar ? "بیزینس‌ها" : "Businesses",
      followers: ar ? "فالوورها" : "Followers",
      following: ar ? "فالووینگ" : "Following",
      passkeysTitle: ar ? "مفاتيح المرور" : "Passkeys",
      passkeysSubtitle: ar
        ? "أضف Passkey لتسجيل الدخول بسرعة وأمان عبر جميع الأجهزة."
        : "Add a passkey to sign in quickly and securely across devices.",
      passkeysCreate: ar ? "إضافة Passkey" : "Add passkey",
      passkeysUnsupported: ar
        ? "المتصفح لا يدعم Passkey على هذا الجهاز."
        : "Passkeys aren't supported on this device.",
      passkeysFailed: ar ? "تعذر إنشاء Passkey." : "Could not create passkey.",
      passkeysSuccess: ar ? "تمت إضافة Passkey." : "Passkey added.",
      username: ar ? "اسم المستخدم" : "Username",
      usernameDesc: ar 
        ? "اختر اسم مستخدم فريد للملف الشخصي والمحادثات."
        : "Choose a unique username for your profile and chats.",
      usernameSave: ar ? "حفظ" : "Save",
      usernameSaving: ar ? "جارٍ الحفظ..." : "Saving...",
      // Tabs
      tabProfile: ar ? "الملف الشخصي" : "Profile",
      tabOrders: ar ? "مشترياتي" : "My Orders",
      tabSettings: ar ? "الإعدادات" : "Settings",
      // Orders
      noOrders: ar ? "لا توجد طلبات بعد" : "No orders yet",
      orderNumber: ar ? "رقم الطلب" : "Order",
      orderDate: ar ? "التاريخ" : "Date",
      orderStatus: ar ? "الحالة" : "Status",
      orderTotal: ar ? "المجموع" : "Total",
      orderItems: ar ? "المنتجات" : "Items",
      viewDetails: ar ? "عرض التفاصيل" : "View details",
      loadingOrders: ar ? "جارٍ التحميل..." : "Loading...",
      completed: ar ? "مكتمل" : "Completed",
      pending: ar ? "قيد الانتظار" : "Pending",
      cancelled: ar ? "ملغي" : "Cancelled",
      refunded: ar ? "مسترد" : "Refunded",
      goToStore: ar ? "تصفح المتجر" : "Browse store",
    };
  }, [ar]);

  async function saveProfile() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, displayName, bio, email, phone }),
      });
      const json = (await res.json()) as
        | { ok: true; profile: ProfileDTO }
        | { ok: false; error: string };
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setFullName(json.profile.fullName);
      setDisplayName(json.profile.displayName);
      setBio(json.profile.bio);
      setAvatarUrl(json.profile.avatarUrl);
      setEmail(json.profile.pendingEmail ?? json.profile.email);
      setPhone(json.profile.pendingPhone ?? json.profile.phone);
      setPendingEmail(json.profile.pendingEmail ?? null);
      setPendingPhone(json.profile.pendingPhone ?? null);
      setApprovalStatus(json.profile.approvalStatus ?? "approved");
      setApprovalReason(json.profile.approvalReason ?? null);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "SAVE_FAILED";
      if (message === "EMAIL_TAKEN") {
        setError(t.emailTaken);
      } else if (message === "PHONE_TAKEN") {
        setError(t.phoneTaken);
      } else {
        setError(t.saveFailed);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onPickAvatar(files: FileList | null) {
    setError(null);
    setSuccess(null);
    if (!files || files.length === 0) return;

    const file = files[0];

    const nextPreview = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(nextPreview);

    setBusyAvatar(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd });
      const json = (await res.json()) as
        | { ok: true; avatarUrl: string | null }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setAvatarUrl(json.avatarUrl);
      if (nextPreview) URL.revokeObjectURL(nextPreview);
      setLocalPreview(null);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusyAvatar(false);
    }
  }

  async function removeAvatar() {
    setError(null);
    setSuccess(null);
    setBusyAvatar(true);
    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" });
      const json = (await res.json()) as
        | { ok: true; avatarUrl: string | null }
        | { ok: false; error: string };
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setAvatarUrl(json.avatarUrl);
      setLocalPreview(null);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusyAvatar(false);
    }
  }

  async function createPasskey() {
    setPasskeyError(null);
    setPasskeySuccess(null);

    if (!passkeySupported) {
      setPasskeyError(t.passkeysUnsupported);
      return;
    }

    setPasskeyBusy(true);
    try {
      const optionsRes = await fetch("/api/auth/passkey/registration/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: navigator.userAgent }),
      });

      const optionsJson = (await optionsRes.json()) as
        | { ok: true; options: unknown; requestId: string; label?: string }
        | { ok: false; error: string };

      if (!optionsRes.ok || !optionsJson.ok) {
        throw new Error(optionsJson.ok ? "OPTIONS_FAILED" : optionsJson.error);
      }

      const attestation = await startRegistration({
        optionsJSON: optionsJson.options as Parameters<typeof startRegistration>[0]["optionsJSON"],
      });

      const verifyRes = await fetch("/api/auth/passkey/registration/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: optionsJson.requestId, response: attestation }),
      });

      const verifyJson = (await verifyRes.json()) as
        | { ok: true; alreadyExists?: boolean }
        | { ok: false; error: string };

      if (!verifyRes.ok || !verifyJson.ok) {
        throw new Error(verifyJson.ok ? "VERIFY_FAILED" : verifyJson.error);
      }

      setPasskeySuccess(t.passkeysSuccess);
      router.refresh();
    } catch {
      setPasskeyError(t.passkeysFailed);
    } finally {
      setPasskeyBusy(false);
    }
  }

  const avatarSrc = localPreview ?? avatarUrl;

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  }

  function formatPrice(amount: number) {
    return `${amount.toFixed(3)} OMR`;
  }

  const tabs = [
    { id: "profile" as const, label: t.tabProfile, icon: HiUser },
    { id: "orders" as const, label: t.tabOrders, icon: HiShoppingBag },
    { id: "settings" as const, label: t.tabSettings, icon: HiCog },
  ];

  return (
    <div className="mt-6">
      {/* Profile Header Card */}
      <div className="sbc-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={initial.email}
                  fill
                  className="rounded-full object-cover ring-4 ring-accent/20"
                  sizes="112px"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-accent to-blue-600 ring-4 ring-accent/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{initials(initial.email)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-start">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold">{displayName}</h2>
              {initial.role === "admin" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Admin
                </span>
              )}
            </div>
            {username && (
              <p className="mt-1 text-sm text-accent font-medium">@{username}</p>
            )}
            <p className="mt-1 text-sm text-(--muted-foreground)">{email}</p>
            {bio && (
              <p className="mt-2 text-sm text-(--muted-foreground) line-clamp-2">{bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-(--surface) border border-(--surface-border) mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground hover:bg-(--chip-bg)"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid gap-6">
          {/* Edit Profile Card */}
          <div className="sbc-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiUser className="h-5 w-5 text-accent" />
              {ar ? "تحرير الملف الشخصي" : "Edit Profile"}
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files)}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={busyAvatar}
                onClick={() => fileRef.current?.click()}
              >
                {busyAvatar ? t.uploading : t.changePhoto}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyAvatar || (!avatarUrl && !localPreview)}
                onClick={removeAvatar}
              >
                {t.removePhoto}
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.fullName}</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={initial.fullName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.displayName}</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={initial.email.split("@")[0]}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.email}</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.phone}</label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {approvalStatus === "pending" && approvalReason === "contact_update" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                  {t.pendingContact}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">{t.bio}</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={ar ? "اكتب نبذة قصيرة…" : "Write a short bio…"}
                  rows={3}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" disabled={busy} onClick={saveProfile}>
                  {busy ? t.saving : t.save}
                </Button>
              </div>
            </div>
          </div>

          {/* Username Card */}
          <div className="sbc-card rounded-2xl p-6">
            <h3 className="text-base font-semibold">{t.username}</h3>
            <p className="mt-1 text-sm text-(--muted-foreground)">{t.usernameDesc}</p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-foreground)">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder={ar ? "اسم_المستخدم" : "your_username"}
                    className="w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2.5 pl-8 text-sm placeholder:text-(--muted-foreground) focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    maxLength={30}
                  />
                  {usernameLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 animate-spin text-(--muted-foreground)" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  )}
                  {!usernameLoading && usernameAvailable === true && usernameInput !== username && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                  )}
                  {!usernameLoading && usernameAvailable === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">✗</span>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!usernameAvailable || usernameSaving || usernameInput === username}
                  onClick={saveUsername}
                >
                  {usernameSaving ? t.usernameSaving : t.usernameSave}
                </Button>
              </div>
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
              {usernameSuccess && <p className="text-xs text-green-500">{ar ? "تم حفظ اسم المستخدم بنجاح!" : "Username saved!"}</p>}
              {username && (
                <p className="text-xs text-(--muted-foreground)">
                  {ar ? "رابط ملفك الشخصي: " : "Your profile: "}
                  <span className="font-mono text-accent">/{locale}/u/@{username}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="sbc-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HiShoppingBag className="h-5 w-5 text-accent" />
            {t.tabOrders}
          </h3>

          {ordersLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-3 text-sm text-(--muted-foreground)">{t.loadingOrders}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <HiShoppingBag className="mx-auto h-12 w-12 text-(--muted-foreground)/50" />
              <p className="mt-3 text-(--muted-foreground)">{t.noOrders}</p>
              <Link
                href={`/${locale}/store`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                {t.goToStore}
                <HiExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status] || HiClock;
                const statusLabel = t[order.status as keyof typeof t] || order.status;
                
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-(--surface-border) bg-(--surface) p-4 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${statusColors[order.status]}`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-(--muted-foreground)">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-end">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(order.total)}
                          </div>
                          <div className="text-xs text-(--muted-foreground)">
                            {order.items.length} {ar ? "منتج" : "item(s)"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-4 pt-4 border-t border-(--surface-border)">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-(--muted-foreground)">×{item.quantity}</span>
                              <span>{item.productName}</span>
                            </div>
                            <span className="font-medium">{formatPrice(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6">
          {/* Push Notifications */}
          <div className="sbc-card rounded-2xl p-6">
            <UserPushOptIn dir={ar ? "rtl" : "ltr"} />
          </div>

          {/* Passkeys */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <HiKey className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t.passkeysTitle}</h3>
                  <p className="mt-1 text-sm text-(--muted-foreground)">{t.passkeysSubtitle}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={createPasskey}
                disabled={passkeyBusy}
              >
                {t.passkeysCreate}
              </Button>
            </div>
            {passkeyError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{passkeyError}</p>
            )}
            {passkeySuccess && (
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{passkeySuccess}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
