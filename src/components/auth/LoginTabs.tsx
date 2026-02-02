"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HumanChallenge } from "./HumanChallenge";
import { PasskeyLoginButton } from "./PasskeyLoginButton";
import type { Locale } from "@/lib/i18n/locales";
import type { HumanChallenge as HumanChallengeType } from "@/lib/auth/humanChallenge";

interface LoginTabsProps {
  locale: Locale;
  challenge: HumanChallengeType;
  next?: string;
  error?: string;
  dict: {
    nav: { login: string; register: string };
    auth: { identifier: string; password: string; signIn: string };
  };
}

type TabId = "password" | "whatsapp";

const texts = {
  en: {
    tabs: {
      password: "Email & Password",
      whatsapp: "WhatsApp",
    },
    noAccount: "No account?",
    errors: {
      invalid: "Invalid email or password.",
      human: "Please complete the human check correctly.",
      approval: "Your account is pending admin approval. You'll be activated soon.",
      inactive: "Your account is currently deactivated. Please contact support.",
    },
    whatsapp: {
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
      notEnabled: "WhatsApp login is not enabled",
    },
  },
  ar: {
    tabs: {
      password: "البريد وكلمة المرور",
      whatsapp: "واتساب",
    },
    noAccount: "ليس لديك حساب؟",
    errors: {
      invalid: "بيانات الدخول غير صحيحة",
      human: "يرجى إكمال التحقق البشري بشكل صحيح.",
      approval: "حسابك قيد المراجعة من الإدارة. سيتم تفعيله قريباً.",
      inactive: "تم تعطيل حسابك مؤقتاً. يرجى التواصل مع الإدارة.",
    },
    whatsapp: {
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
      notEnabled: "تسجيل الدخول بواتساب غير مفعّل",
    },
  },
};

export function LoginTabs({ locale, challenge, next, error, dict }: LoginTabsProps) {
  const router = useRouter();
  const t = texts[locale];
  const [activeTab, setActiveTab] = useState<TabId>("password");
  
  // WhatsApp state
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Check if WhatsApp login is enabled
  useEffect(() => {
    fetch("/api/auth/otp/status")
      .then((res) => res.json())
      .then((data) => {
        setWhatsappEnabled(data.ok && data.whatsapp?.loginEnabled);
      })
      .catch(() => setWhatsappEnabled(false));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWhatsappError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("otp");
        setCountdown(60);
      } else {
        setWhatsappError(data.error || "Failed to send code");
      }
    } catch {
      setWhatsappError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWhatsappError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp, purpose: "login" }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(next || `/${locale}/dashboard`);
        router.refresh();
      } else {
        setWhatsappError(data.error || "Invalid code");
      }
    } catch {
      setWhatsappError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "password",
      label: t.tabs.password,
      icon: <MailIcon className="h-4 w-4" />,
    },
    {
      id: "whatsapp",
      label: t.tabs.whatsapp,
      icon: <WhatsAppIcon className="h-4 w-4 text-green-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {error && (
        <div className={`rounded-lg p-3 text-sm ${
          error === "approval" || error === "inactive"
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
            : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
        }`}>
          {t.errors[error as keyof typeof t.errors] || error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-(--surface-border)">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-(--muted-foreground) hover:border-(--surface-border) hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Password Login Tab */}
      {activeTab === "password" && (
        <form action={`/${locale}/auth/login`} method="POST" className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          {next && <input type="hidden" name="next" value={next} />}

          <label className="grid gap-1">
            <span className="text-sm font-medium text-(--muted-foreground)">
              {dict.auth.identifier}
            </span>
            <Input
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder={locale === "ar" ? "البريد الإلكتروني أو الهاتف" : "Email or mobile"}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-(--muted-foreground)">
              {dict.auth.password}
            </span>
            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>

          <HumanChallenge locale={locale} challenge={challenge} />

          <Button type="submit" className="w-full">
            {dict.auth.signIn}
          </Button>

          <PasskeyLoginButton locale={locale} next={next} />
        </form>
      )}

      {/* WhatsApp Login Tab */}
      {activeTab === "whatsapp" && (
        <div className="space-y-4">
          {whatsappEnabled === null ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            </div>
          ) : !whatsappEnabled ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
              {t.whatsapp.notEnabled}
            </div>
          ) : step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-(--muted-foreground)">
                  {t.whatsapp.phoneLabel}
                </span>
                <Input
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder={t.whatsapp.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                />
              </label>

              {whatsappError && (
                <p className="text-sm text-red-600 dark:text-red-400">{whatsappError}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.whatsapp.sending : t.whatsapp.sendCode}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-(--muted-foreground)">
                  {t.whatsapp.otpLabel}
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  placeholder={t.whatsapp.otpPlaceholder}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  dir="ltr"
                  className="text-center text-lg tracking-widest"
                />
              </label>

              {whatsappError && (
                <p className="text-sm text-red-600 dark:text-red-400">{whatsappError}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.whatsapp.verifying : t.whatsapp.verify}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setWhatsappError("");
                  }}
                  className="text-(--muted-foreground) hover:text-foreground"
                >
                  {t.whatsapp.back}
                </button>

                {countdown > 0 ? (
                  <span className="text-(--muted-foreground)">
                    {t.whatsapp.resendIn} {countdown}{t.whatsapp.seconds}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-accent hover:underline"
                  >
                    {t.whatsapp.resend}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Register Link */}
      <p className="text-center text-sm text-(--muted-foreground)">
        {t.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {dict.nav.register}
        </Link>
      </p>
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
