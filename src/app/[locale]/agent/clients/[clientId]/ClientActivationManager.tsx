"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";

export default function ClientActivationManager({
  locale,
  clientId,
  initialName,
  initialPhone,
  initialEmail,
  isPhoneVerified,
}: {
  locale: Locale;
  clientId: string;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  isPhoneVerified: boolean;
}) {
  const router = useRouter();
  const ar = locale === "ar";

  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = {
    title: ar ? "إدارة التفعيل" : "Activation Management",
    subtitle: ar
      ? "يمكن تعديل بيانات العميل قبل التفعيل ثم إرسال/تأكيد كود التفعيل"
      : "You can edit client info before verification, then send/verify activation code.",
    fullName: ar ? "الاسم الكامل" : "Full Name",
    phone: ar ? "الهاتف" : "Phone",
    email: ar ? "البريد الإلكتروني" : "Email",
    save: ar ? "حفظ البيانات" : "Save Info",
    sending: ar ? "جاري الإرسال..." : "Sending...",
    sendCode: ar ? "إرسال كود التفعيل" : "Send Activation Code",
    code: ar ? "كود التفعيل" : "Activation Code",
    verify: ar ? "تأكيد التفعيل" : "Verify Activation",
    verifying: ar ? "جاري التأكيد..." : "Verifying...",
    verified: ar ? "رقم الهاتف مفعّل" : "Phone is verified",
    verifiedLock: ar ? "تم تفعيل العميل. تم قفل التعديل عبر الوكيل." : "Client is verified. Editing is locked for agent.",
  };

  function mapError(codeRaw: string) {
    const code = (codeRaw || "").trim();
    const en: Record<string, string> = {
      NOT_YOUR_CLIENT: "This user is not your client",
      CLIENT_ALREADY_VERIFIED: "Client is already verified",
      CLIENT_NO_PHONE: "Client has no phone number",
      OTP_RATE_LIMIT: "Please wait before requesting another code",
      OTP_NOT_FOUND: "No valid code found",
      INVALID_CODE: "Invalid code",
      MAX_ATTEMPTS_EXCEEDED: "Too many attempts. Send a new code",
      PHONE_TAKEN: "Phone is already used",
      EMAIL_TAKEN: "Email is already used",
      WAHA_UNAVAILABLE: "WhatsApp service is unavailable",
      MISSING_FIELDS: "Please fill required fields",
      ACTION_FAILED: "Action failed",
    };
    const arMap: Record<string, string> = {
      NOT_YOUR_CLIENT: "هذا المستخدم ليس من عملائك",
      CLIENT_ALREADY_VERIFIED: "العميل مفعّل بالفعل",
      CLIENT_NO_PHONE: "لا يوجد رقم هاتف للعميل",
      OTP_RATE_LIMIT: "يرجى الانتظار قبل طلب كود جديد",
      OTP_NOT_FOUND: "لا يوجد كود صالح",
      INVALID_CODE: "الكود غير صحيح",
      MAX_ATTEMPTS_EXCEEDED: "محاولات كثيرة، أرسل كودًا جديدًا",
      PHONE_TAKEN: "رقم الهاتف مستخدم بالفعل",
      EMAIL_TAKEN: "البريد مستخدم بالفعل",
      WAHA_UNAVAILABLE: "خدمة واتساب غير متاحة",
      MISSING_FIELDS: "يرجى تعبئة الحقول المطلوبة",
      ACTION_FAILED: "فشلت العملية",
    };
    return ar ? arMap[code] || code : en[code] || code;
  }

  async function saveInfo() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-client-profile",
          clientId,
          fullName,
          phone,
          email,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ACTION_FAILED");
      setSuccess(ar ? "تم حفظ بيانات العميل" : "Client info saved");
      router.refresh();
    } catch (e: unknown) {
      setError(mapError(e instanceof Error ? e.message : "ACTION_FAILED"));
    } finally {
      setSaving(false);
    }
  }

  async function sendCode() {
    setError("");
    setSuccess("");
    setSending(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-client-activation-code",
          clientId,
          locale,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ACTION_FAILED");
      setSuccess(ar ? "تم إرسال كود التفعيل" : "Activation code sent");
    } catch (e: unknown) {
      setError(mapError(e instanceof Error ? e.message : "ACTION_FAILED"));
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) return;
    setError("");
    setSuccess("");
    setVerifying(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-client-activation-code",
          clientId,
          code: code.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ACTION_FAILED");
      setSuccess(ar ? "تم تفعيل رقم العميل" : "Client phone verified");
      setCode("");
      router.refresh();
    } catch (e: unknown) {
      setError(mapError(e instanceof Error ? e.message : "ACTION_FAILED"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="sbc-card rounded-2xl p-5">
      <h2 className="text-sm font-semibold">{t.title}</h2>
      <p className="mt-1 text-xs text-(--muted-foreground)">{t.subtitle}</p>

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </div>
      ) : null}

      {isPhoneVerified ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="font-semibold">{t.verified}</div>
          <div className="mt-0.5">{t.verifiedLock}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">{t.fullName}</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t.phone}</label>
              <PhoneInput value={phone} onChange={(v) => setPhone(v)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t.email}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button size="sm" variant="secondary" disabled={saving} onClick={saveInfo}>
            {saving ? (ar ? "جاري الحفظ..." : "Saving...") : t.save}
          </Button>

          <div className="rounded-xl border border-(--surface-border) p-3">
            <Button size="sm" onClick={sendCode} disabled={sending}>
              {sending ? t.sending : t.sendCode}
            </Button>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1 block text-xs font-medium">{t.code}</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
              </div>
              <Button size="sm" variant="secondary" onClick={verifyCode} disabled={verifying || !code.trim()}>
                {verifying ? t.verifying : t.verify}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
