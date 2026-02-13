"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";

interface PhoneVerificationProps {
  locale: Locale;
  phone: string;
  onVerified: () => void;
  onCancel: () => void;
}

const texts = {
  en: {
    title: "Verify Your Phone",
    subtitle: "We sent a verification code to",
    otpLabel: "Verification code",
    otpPlaceholder: "Enter 6-digit code",
    verify: "Verify",
    resend: "Resend code",
    resendIn: "Resend in",
    seconds: "s",
    cancel: "Cancel",
    verifying: "Verifying...",
    sending: "Sending...",
  },
  ar: {
    title: "تحقق من رقم هاتفك",
    subtitle: "أرسلنا رمز التحقق إلى",
    otpLabel: "رمز التحقق",
    otpPlaceholder: "أدخل الرمز المكون من 6 أرقام",
    verify: "تحقق",
    resend: "إعادة إرسال الرمز",
    resendIn: "إعادة الإرسال خلال",
    seconds: "ث",
    cancel: "إلغاء",
    verifying: "جاري التحقق...",
    sending: "جاري الإرسال...",
  },
};

export function PhoneVerification({
  locale,
  phone,
  onVerified,
  onCancel,
}: PhoneVerificationProps) {
  const t = texts[locale];

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [codeSent, setCodeSent] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  const sendOTP = useCallback(async () => {
    setError("");
    setSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          purpose: "registration",
          locale,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      setCodeSent(true);
      setCountdown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [locale, phone]);

  // Send OTP on mount
  useEffect(() => {
    void sendOTP();
  }, [sendOTP]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && codeSent) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, codeSent]);

  // Focus OTP input when code is sent
  useEffect(() => {
    if (codeSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [codeSent]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: otp,
          purpose: "registration",
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      onVerified();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      sendOTP();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-(--surface) p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <WhatsAppIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {t.subtitle}
          </p>
          <p className="mt-1 font-medium" dir="ltr">
            {phone}
          </p>
        </div>

        {sending ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
            <span className="ml-3">{t.sending}</span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-(--muted-foreground)">
                {t.otpLabel}
              </span>
              <Input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={t.otpPlaceholder}
                required
                dir="ltr"
                className="text-center text-2xl tracking-[0.5em]"
              />
            </label>

            {error && (
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full"
            >
              {loading ? t.verifying : t.verify}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={onCancel}
                className="text-(--muted-foreground) hover:text-foreground"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="text-(--muted-foreground) hover:text-foreground disabled:opacity-50"
              >
                {countdown > 0
                  ? `${t.resendIn} ${countdown}${t.seconds}`
                  : t.resend}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
