"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { HumanChallenge } from "./HumanChallenge";
import { loginAction } from "@/app/[locale]/auth/actions";
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

type TabId = "password" | "whatsapp" | "passkey";

const texts = {
  en: {
    tabs: {
      password: "Password",
      whatsapp: "WhatsApp",
      passkey: "Passkey",
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
      phonePlaceholder: "91234567",
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
    passkey: {
      title: "Sign in with Passkey",
      description: "Use your fingerprint, face, or device PIN to sign in securely.",
      button: "Continue with Passkey",
      notSupported: "Passkeys aren't supported on this device.",
      failed: "Passkey sign-in failed. Please try again.",
      authenticating: "Authenticating...",
      noPasskeys: "No passkeys registered. Please login with password first, then add a passkey in settings.",
      cancelled: "Authentication was cancelled.",
    },
  },
  ar: {
    tabs: {
      password: "كلمة المرور",
      whatsapp: "واتساب",
      passkey: "مفتاح المرور",
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
      phonePlaceholder: "91234567",
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
    passkey: {
      title: "تسجيل الدخول بمفتاح المرور",
      description: "استخدم بصمة الإصبع أو الوجه أو رمز PIN للدخول بأمان.",
      button: "المتابعة بمفتاح المرور",
      notSupported: "مفاتيح المرور غير مدعومة على هذا الجهاز.",
      failed: "فشل تسجيل الدخول بمفتاح المرور. حاول مرة أخرى.",
      authenticating: "جاري المصادقة...",
      noPasskeys: "لا توجد مفاتيح مرور مسجلة. سجل الدخول بكلمة المرور أولاً ثم أضف مفتاح مرور في الإعدادات.",
      cancelled: "تم إلغاء المصادقة.",
    },
  },
};

export function LoginTabs({ locale, challenge, next, error, dict }: LoginTabsProps) {
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

  // Restore WhatsApp state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("wa-login-state");
    if (saved) {
      try {
        const { step, phone, countdown, ts } = JSON.parse(saved);
        if (step === "otp" && phone) {
          const now = Date.now();
          const remain = Math.max(0, Math.floor((ts + countdown * 1000 - now) / 1000));
          // If the OTP window has expired (>120s old), discard the saved state
          const age = (now - ts) / 1000;
          if (age > 120) {
            localStorage.removeItem("wa-login-state");
            return;
          }
          setStep("otp");
          setPhone(phone);
          setCountdown(remain);
          setActiveTab("whatsapp");
        }
      } catch {
        localStorage.removeItem("wa-login-state");
      }
    }
  }, []);

  // Save WhatsApp state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step === "otp" && phone) {
      localStorage.setItem(
        "wa-login-state",
        JSON.stringify({ step, phone, countdown, ts: Date.now() })
      );
    } else {
      localStorage.removeItem("wa-login-state");
    }
  }, [step, phone, countdown]);

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

  // Passkey state
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  async function handlePasskeyLogin() {
    if (!passkeySupported) {
      setPasskeyError(t.passkey.notSupported);
      return;
    }

    setPasskeyError(null);
    setPasskeyBusy(true);

    try {
      const optionsRes = await fetch("/api/auth/passkey/authentication/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const optionsJson = (await optionsRes.json()) as
        | { ok: true; options: PublicKeyCredentialRequestOptionsJSON; requestId: string }
        | { ok: false; error: string };

      if (!optionsRes.ok || !optionsJson.ok) {
        const errCode = !optionsJson.ok ? optionsJson.error : "OPTIONS_FAILED";
        if (errCode === "NO_PASSKEYS" || errCode === "NOT_FOUND") {
          setPasskeyError(t.passkey.noPasskeys);
        } else {
          setPasskeyError(t.passkey.failed);
        }
        setPasskeyBusy(false);
        return;
      }

      const assertion = await startAuthentication({
        optionsJSON: optionsJson.options,
      });

      const verifyRes = await fetch("/api/auth/passkey/authentication/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: optionsJson.requestId, response: assertion }),
      });

      const verifyJson = (await verifyRes.json()) as
        | { ok: true }
        | { ok: false; error: string };

      if (!verifyRes.ok || !verifyJson.ok) {
        throw new Error(verifyJson.ok ? "VERIFY_FAILED" : verifyJson.error);
      }

      const dest = next && next.startsWith(`/${locale}/`) ? next : `/${locale}/dashboard`;
      window.location.href = dest;
    } catch (e: unknown) {
      // User cancelled or closed the prompt
      const errName = e instanceof Error ? e.name : "";
      const errMessage = e instanceof Error ? e.message : "";
      if (errName === "NotAllowedError" || errMessage.includes("cancelled")) {
        setPasskeyError(t.passkey.cancelled);
      } else {
        console.error("Passkey login error:", e);
        setPasskeyError(t.passkey.failed);
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

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
        setCountdown(120);
        // Save state immediately
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "wa-login-state",
            JSON.stringify({ step: "otp", phone, countdown: 120, ts: Date.now() })
          );
        }
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
        // Clear WhatsApp state on success
        if (typeof window !== "undefined") {
          localStorage.removeItem("wa-login-state");
        }
        window.location.href = next || `/${locale}/dashboard`;
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
      icon: <LockIcon className="h-4 w-4" />,
    },
    {
      id: "whatsapp",
      label: t.tabs.whatsapp,
      icon: <WhatsAppIcon className="h-4 w-4" />,
    },
    {
      id: "passkey",
      label: t.tabs.passkey,
      icon: <FingerprintIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {error && (
        <div className={`rounded-xl p-3 text-sm ${
          error === "approval" || error === "inactive"
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
        }`}>
          {t.errors[error as keyof typeof t.errors] || error}
        </div>
      )}

      {/* Professional Full-Width Tabs */}
      <div className="rounded-xl bg-(--surface) border border-(--surface-border) p-1">
        <nav className="grid grid-cols-3 gap-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-md"
                  : "text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground"
              }`}
            >
              <span className={activeTab === tab.id ? "text-white" : tab.id === "whatsapp" ? "text-green-600" : ""}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Password Login Tab */}
      {activeTab === "password" && (
        <form action={loginAction} className="space-y-4">
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
                <PhoneInput
                  required
                  autoComplete="tel"
                  placeholder={t.whatsapp.phonePlaceholder}
                  value={phone}
                  onChange={setPhone}
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
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("wa-login-state");
                    }
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

      {/* Passkey Login Tab */}
      {activeTab === "passkey" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <FingerprintIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">{t.passkey.title}</h3>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {t.passkey.description}
            </p>
          </div>

          {passkeyError && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
              {passkeyError}
            </div>
          )}

          {!passkeySupported ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-300">
              {t.passkey.notSupported}
            </div>
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={handlePasskeyLogin}
              disabled={passkeyBusy}
            >
              {passkeyBusy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.passkey.authenticating}
                </span>
              ) : (
                t.passkey.button
              )}
            </Button>
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function FingerprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
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
