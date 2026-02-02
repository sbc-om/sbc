"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    subtitle: "We'll send a 6-digit code to your WhatsApp",
    phoneLabel: "Phone Number",
    codeLabel: "Verification Code",
    codePlaceholder: "Enter 6-digit code",
    sendCode: "Send Code",
    resendCode: "Resend Code",
    verify: "Verify",
    skip: "Skip for now",
    sending: "Sending...",
    verifying: "Verifying...",
    codeSent: "Code sent! Check your WhatsApp",
    phoneUpdated: "Phone number updated",
    editPhone: "Edit",
    savePhone: "Save",
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
    subtitle: "سنرسل رمزًا من 6 أرقام إلى واتساب الخاص بك",
    phoneLabel: "رقم الهاتف",
    codeLabel: "رمز التحقق",
    codePlaceholder: "أدخل الرمز المكون من 6 أرقام",
    sendCode: "إرسال الرمز",
    resendCode: "إعادة إرسال الرمز",
    verify: "تحقق",
    skip: "تخطي الآن",
    sending: "جاري الإرسال...",
    verifying: "جاري التحقق...",
    codeSent: "تم إرسال الرمز! تحقق من واتساب",
    phoneUpdated: "تم تحديث رقم الهاتف",
    editPhone: "تعديل",
    savePhone: "حفظ",
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

  const handleSkip = () => {
    router.push(`/${locale}/dashboard`);
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
    <div className="w-full max-w-md rounded-lg border border-(--border) bg-(--card) p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-center mb-2">{t.title}</h1>
      <p className="text-sm text-(--muted-foreground) text-center mb-6">
        {t.subtitle}
      </p>

      {/* Phone Input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-(--muted-foreground) mb-1 block">
          {t.phoneLabel}
        </label>
        {isEditingPhone ? (
          <div className="flex gap-2">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleUpdatePhone}
              disabled={loading || phone === initialPhone}
            >
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border border-(--border) bg-(--muted)/30">
              {phone}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditingPhone(true)}
              className="text-sm"
            >
              {t.editPhone}
            </Button>
          </div>
        )}
      </div>

      {/* Send Code Button */}
      {!codeSent && !isEditingPhone && (
        <Button
          onClick={handleSendCode}
          disabled={loading || !phone}
          className="w-full mb-4"
        >
          {loading ? t.sending : t.sendCode}
        </Button>
      )}

      {/* Code Input - 6 boxes */}
      {codeSent && !isEditingPhone && (
        <div className="mb-4">
          <label className="text-sm font-medium text-(--muted-foreground) mb-2 block">
            {t.codeLabel}
          </label>
          <div className="flex gap-2 justify-center mb-4" dir="ltr">
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
                className="w-10 h-12 text-center text-lg font-mono rounded-md border border-(--border) bg-(--background) focus:border-(--ring) focus:ring-1 focus:ring-(--ring) outline-none"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="w-full mb-2"
          >
            {verifying ? t.verifying : t.verify}
          </Button>

          {/* Resend Button */}
          <Button
            variant="ghost"
            onClick={handleSendCode}
            disabled={loading || countdown > 0}
            className="w-full text-sm"
          >
            {countdown > 0 ? `${t.resendIn} ${countdown}s` : t.resendCode}
          </Button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center mb-4">
          {success}
        </p>
      )}

      {/* Skip Button */}
      <Button
        variant="ghost"
        onClick={handleSkip}
        className="w-full text-sm text-(--muted-foreground)"
      >
        {t.skip}
      </Button>
    </div>
  );
}
