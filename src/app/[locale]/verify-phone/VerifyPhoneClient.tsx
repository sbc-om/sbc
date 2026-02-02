"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface VerifyPhoneClientProps {
  locale: Locale;
  dict: Dictionary;
  phone: string;
  userId: string;
}

const texts = {
  en: {
    title: "Verify Your Phone",
    subtitle: "We'll send a 6-digit verification code to your WhatsApp",
    phoneLabel: "Phone Number",
    codeLabel: "Verification Code",
    codePlaceholder: "Enter 6-digit code",
    sendCode: "Send Verification Code",
    resendCode: "Resend Code",
    verify: "Verify & Continue",
    sending: "Sending...",
    verifying: "Verifying...",
    codeSent: "Code sent! Check your WhatsApp",
    phoneUpdated: "Phone number updated",
    editPhone: "Change",
    savePhone: "Save",
    cancel: "Cancel",
    errors: {
      invalid: "Invalid verification code",
      expired: "Code expired. Please request a new one",
      phone: "Failed to send code. Check your phone number",
      network: "Network error. Please try again",
      updatePhone: "Failed to update phone number",
    },
    resendIn: "Resend in",
  },
  ar: {
    title: "تحقق من رقم هاتفك",
    subtitle: "سنرسل رمز تحقق مكون من 6 أرقام إلى واتساب الخاص بك",
    phoneLabel: "رقم الهاتف",
    codeLabel: "رمز التحقق",
    codePlaceholder: "أدخل الرمز المكون من 6 أرقام",
    sendCode: "إرسال رمز التحقق",
    resendCode: "إعادة إرسال الرمز",
    verify: "تحقق والمتابعة",
    sending: "جاري الإرسال...",
    verifying: "جاري التحقق...",
    codeSent: "تم إرسال الرمز! تحقق من واتساب",
    phoneUpdated: "تم تحديث رقم الهاتف",
    editPhone: "تغيير",
    savePhone: "حفظ",
    cancel: "إلغاء",
    errors: {
      invalid: "رمز التحقق غير صالح",
      expired: "انتهت صلاحية الرمز. يرجى طلب رمز جديد",
      phone: "فشل في إرسال الرمز. تحقق من رقم هاتفك",
      network: "خطأ في الشبكة. حاول مرة أخرى",
      updatePhone: "فشل في تحديث رقم الهاتف",
    },
    resendIn: "إعادة الإرسال خلال",
  },
};

export function VerifyPhoneClient({
  locale,
  dict,
  phone: initialPhone,
  userId,
}: VerifyPhoneClientProps) {
  const router = useRouter();
  const t = texts[locale];

  const [phone, setPhone] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "phone_verification" }),
      });

      const data = await res.json();

      if (data.ok) {
        setCodeSent(true);
        setSuccess(t.codeSent);
        setCountdown(60); // 60 seconds cooldown
      } else {
        setError(t.errors[data.error as keyof typeof t.errors] || t.errors.phone);
      }
    } catch (err) {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setError("");
    setSuccess("");
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          purpose: "phone_verification",
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // Mark user as verified
        await fetch("/api/users/verify-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        router.push(`/${locale}/dashboard`);
      } else {
        setError(
          data.error === "invalid"
            ? t.errors.invalid
            : data.error === "expired"
            ? t.errors.expired
            : t.errors.network
        );
      }
    } catch (err) {
      setError(t.errors.network);
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdatePhone = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (res.ok) {
        setIsEditingPhone(false);
        setCodeSent(false);
        setCode("");
        setSuccess(t.phoneUpdated);
      } else {
        setError(t.errors.updatePhone);
      }
    } catch (err) {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  // Handle code input - split into 6 boxes
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split("");
      const newCode = code.split("");
      chars.forEach((char, i) => {
        if (/\d/.test(char)) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode.join("").slice(0, 6));
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else if (/^\d$/.test(value)) {
      const newCode = code.split("");
      newCode[index] = value;
      setCode(newCode.join(""));
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border" style={{ borderColor: 'var(--surface-border)' }}>
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          {t.subtitle}
        </p>
      </div>

      {/* Phone Display/Edit */}
      <div className="mb-6">
        <label className="text-sm font-medium text-(--muted-foreground) mb-2 block">
          {t.phoneLabel}
        </label>
        {isEditingPhone ? (
          <div className="sbc-card space-y-3 p-4 rounded-xl">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditingPhone(false);
                  setPhone(initialPhone);
                }}
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                type="button"
                onClick={handleUpdatePhone}
                disabled={loading || phone === initialPhone}
                className="flex-1"
              >
                {loading ? "..." : t.savePhone}
              </Button>
            </div>
          </div>
        ) : (
          <div className="sbc-card flex items-center justify-between py-3 px-4 rounded-xl">
            <span className="font-mono text-lg" dir="ltr">{phone}</span>
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t.editPhone}
            </button>
          </div>
        )}
      </div>

      {/* Send Code Button */}
      {!codeSent && !isEditingPhone && (
        <Button
          onClick={handleSendCode}
          disabled={loading || !phone}
          className="w-full h-11"
        >
          {loading ? t.sending : t.sendCode}
        </Button>
      )}

      {/* Code Input - 6 boxes */}
      {codeSent && !isEditingPhone && (
        <div className="sbc-card space-y-6 p-5 rounded-xl">
          <div>
            <label className="text-sm font-medium text-(--muted-foreground) mb-3 block">
              {t.codeLabel}
            </label>
            <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code[index] || ""}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-lg border bg-(--background) focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  style={{ borderColor: 'var(--surface-border)' }}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="w-full h-11"
          >
            {verifying ? t.verifying : t.verify}
          </Button>

          {/* Resend Button */}
          <div className="text-center pt-2 border-t" style={{ borderColor: 'var(--surface-border)' }}>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || countdown > 0}
              className="text-sm font-medium text-primary hover:text-primary/80 disabled:text-(--muted-foreground) disabled:cursor-not-allowed transition-colors"
            >
              {countdown > 0 ? `${t.resendIn} ${countdown}s` : t.resendCode}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 rounded-lg border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
          {success}
        </div>
      )}
    </div>
  );
}
