"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";

interface WhatsAppLoginProps {
  locale: Locale;
  next?: string;
}

type Step = "phone" | "otp";

const texts = {
  en: {
    title: "Login with WhatsApp",
    phoneLabel: "Phone number",
    phonePlaceholder: "+968 XXXX XXXX",
    sendCode: "Send Code",
    otpLabel: "Verification code",
    otpPlaceholder: "Enter 6-digit code",
    verify: "Verify & Login",
    resend: "Resend code",
    resendIn: "Resend in",
    seconds: "s",
    back: "Back",
    sending: "Sending...",
    verifying: "Verifying...",
    or: "or login with",
    password: "email & password",
  },
  ar: {
    title: "تسجيل الدخول بواتساب",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "+968 XXXX XXXX",
    sendCode: "إرسال الرمز",
    otpLabel: "رمز التحقق",
    otpPlaceholder: "أدخل الرمز المكون من 6 أرقام",
    verify: "تحقق وسجل الدخول",
    resend: "إعادة إرسال الرمز",
    resendIn: "إعادة الإرسال خلال",
    seconds: "ث",
    back: "رجوع",
    sending: "جاري الإرسال...",
    verifying: "جاري التحقق...",
    or: "أو سجل الدخول بـ",
    password: "البريد وكلمة المرور",
  },
};

export function WhatsAppLogin({ locale, next }: WhatsAppLoginProps) {
  const router = useRouter();
  const t = texts[locale];
  
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Check if WhatsApp login is enabled
  useEffect(() => {
    fetch("/api/auth/otp/status")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.ok && data.whatsapp?.loginEnabled);
      })
      .catch(() => setEnabled(false));
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login", locale }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      setStep("otp");
      setCountdown(60);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, purpose: "login" }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      // Redirect on success
      router.push(next || `/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  // Don't render if not enabled or still loading
  if (enabled === null) {
    return null;
  }

  if (enabled === false) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-(--surface-border) pt-6">
      <p className="mb-4 text-center text-sm text-(--muted-foreground)">
        {t.or}{" "}
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setOtp("");
            setError("");
          }}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          WhatsApp
        </button>
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOTP} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-(--muted-foreground)">
              {t.phoneLabel}
            </span>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              required
              dir="ltr"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" variant="secondary" disabled={loading}>
            <WhatsAppIcon className="mr-2 h-4 w-4" />
            {loading ? t.sending : t.sendCode}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="grid gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="text-sm text-(--muted-foreground) hover:text-foreground"
            >
              ← {t.back}
            </button>
            <span className="text-sm text-(--muted-foreground)">{phone}</span>
          </div>

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
              className="text-center text-lg tracking-widest"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" disabled={loading || otp.length !== 6}>
            <WhatsAppIcon className="mr-2 h-4 w-4" />
            {loading ? t.verifying : t.verify}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="text-sm text-(--muted-foreground) hover:text-foreground disabled:opacity-50"
          >
            {countdown > 0
              ? `${t.resendIn} ${countdown}${t.seconds}`
              : t.resend}
          </button>
        </form>
      )}
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
