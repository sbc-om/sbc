"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneVerification } from "./PhoneVerification";
import type { Locale } from "@/lib/i18n/locales";

interface RegisterFormProps {
  locale: Locale;
  dict: {
    auth: {
      fullName: string;
      phone: string;
      email: string;
      password: string;
      signUp: string;
    };
    nav: {
      login: string;
    };
  };
  next?: string;
  challengeQuestion: string;
  challengeAnswer: string;
}

const texts = {
  en: {
    username: "Username (optional)",
    usernamePlaceholder: "username_here",
    usernameHint: "Lowercase letters, numbers, and underscores only",
    passwordHint: "At least 8 characters",
    hasAccount: "Already have an account?",
    humanCheck: "Security check",
    errors: {
      taken: "That email is already in use.",
      phone: "That phone number is already in use.",
      human: "Please complete the human check correctly.",
      username: "That username is already taken.",
      "invalid-username": "Invalid username. Use only lowercase letters, numbers, and underscores (3-30 characters)",
      network: "Network error. Please try again.",
    },
  },
  ar: {
    username: "اسم المستخدم (اختياري)",
    usernamePlaceholder: "اسم_المستخدم",
    usernameHint: "أحرف صغيرة وأرقام وشرطة سفلية فقط",
    passwordHint: "8 أحرف على الأقل",
    hasAccount: "لديك حساب بالفعل؟",
    humanCheck: "تحقق أمني",
    errors: {
      taken: "هذا البريد مستخدم بالفعل",
      phone: "رقم الهاتف مستخدم بالفعل",
      human: "يرجى إكمال التحقق البشري بشكل صحيح.",
      username: "اسم المستخدم مستخدم بالفعل",
      "invalid-username": "اسم المستخدم غير صالح. استخدم أحرف صغيرة وأرقام وشرطة سفلية فقط (3-30 حرفًا)",
      network: "خطأ في الشبكة. حاول مرة أخرى.",
    },
  },
};

export function RegisterForm({
  locale,
  dict,
  next,
  challengeQuestion,
  challengeAnswer,
}: RegisterFormProps) {
  const router = useRouter();
  const t = texts[locale];

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    humanAnswer: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  // Check if phone verification is required
  useEffect(() => {
    fetch("/api/auth/otp/status")
      .then((res) => res.json())
      .then((data) => {
        setVerificationRequired(data.ok && data.whatsapp?.verificationRequired);
      })
      .catch(() => setVerificationRequired(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // If phone verification is required and not verified, show verification modal
    if (verificationRequired && !phoneVerified && formData.phone) {
      setShowVerification(true);
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("locale", locale);
      form.append("fullName", formData.fullName);
      form.append("username", formData.username);
      form.append("phone", formData.phone);
      form.append("email", formData.email);
      form.append("password", formData.password);
      form.append("humanAnswer", formData.humanAnswer);
      form.append("humanExpected", challengeAnswer);
      if (next) form.append("next", next);
      if (phoneVerified) form.append("phoneVerified", "true");

      const res = await fetch(`/${locale}/auth/register`, {
        method: "POST",
        body: form,
      });

      if (res.redirected) {
        router.push(res.url);
        return;
      }

      const url = new URL(res.url);
      const errorParam = url.searchParams.get("error");
      if (errorParam) {
        setError(t.errors[errorParam as keyof typeof t.errors] || errorParam);
      }
    } catch (err) {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerified = () => {
    setPhoneVerified(true);
    setShowVerification(false);
    // Auto-submit the form after verification
    setTimeout(() => {
      const form = document.getElementById("register-form") as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 100);
  };

  return (
    <>
      <form id="register-form" onSubmit={handleSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.fullName}
          </span>
          <Input
            name="fullName"
            type="text"
            required
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {t.username}
          </span>
          <Input
            name="username"
            type="text"
            autoComplete="username"
            pattern="[a-z0-9_]+"
            minLength={3}
            maxLength={30}
            placeholder={t.usernamePlaceholder}
            value={formData.username}
            onChange={handleChange}
          />
          <span className="text-xs text-(--muted-foreground)">{t.usernameHint}</span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.phone}
            {verificationRequired && (
              <span className="ml-2 text-xs text-green-600">
                {phoneVerified ? "✓" : "(WhatsApp verification required)"}
              </span>
            )}
          </span>
          <Input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => {
              handleChange(e);
              setPhoneVerified(false); // Reset verification if phone changes
            }}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.email}
          </span>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
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
            minLength={8}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
          />
          <span className="text-xs text-(--muted-foreground)">{t.passwordHint}</span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {t.humanCheck}: {challengeQuestion}
          </span>
          <Input
            name="humanAnswer"
            type="text"
            required
            autoComplete="off"
            value={formData.humanAnswer}
            onChange={handleChange}
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" className="mt-2" disabled={loading}>
          {loading ? "..." : dict.auth.signUp}
        </Button>

        <p className="mt-2 text-sm text-(--muted-foreground)">
          {t.hasAccount}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {dict.nav.login}
          </Link>
        </p>
      </form>

      {showVerification && (
        <PhoneVerification
          locale={locale}
          phone={formData.phone}
          onVerified={handlePhoneVerified}
          onCancel={() => setShowVerification(false)}
        />
      )}
    </>
  );
}
