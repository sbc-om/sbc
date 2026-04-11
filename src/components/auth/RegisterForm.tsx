"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { HumanChallenge } from "./HumanChallenge";
import { registerAction } from "@/app/[locale]/auth/actions";
import type { Locale } from "@/lib/i18n/locales";
import type { HumanChallenge as HumanChallengeType } from "@/lib/auth/humanChallenge";

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
  challenge: HumanChallengeType;
  initialError?: string;
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
  challenge,
  initialError,
}: RegisterFormProps) {
  const t = texts[locale];

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    initialError && initialError in t.errors
      ? t.errors[initialError as keyof typeof t.errors]
      : "",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formEl = e.target as HTMLFormElement;
      const form = new FormData(formEl);
      form.append("locale", locale);
      if (next) form.append("next", next);

      await registerAction(form);
    } catch (err) {
      // Server action redirects throw NEXT_REDIRECT which we should not catch as error
      if (err instanceof Error && err.message === "NEXT_REDIRECT") {
        throw err;
      }
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          </span>
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.88L2.05 22l5.22-1.21A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.18 14.12c-.22.62-1.29 1.18-1.78 1.25-.46.07-.89.21-2.99-.62-2.54-1.01-4.16-3.6-4.29-3.77-.13-.17-1.04-1.39-1.04-2.65s.66-1.88.89-2.14c.23-.25.5-.31.67-.31.17 0 .33 0 .48.01.15.01.36-.06.56.43.21.5.71 1.74.78 1.87.06.13.1.28.02.45-.09.17-.13.28-.25.43-.13.15-.27.34-.38.45-.13.13-.26.27-.11.52.15.25.66 1.09 1.42 1.76.97.87 1.79 1.14 2.04 1.27.25.13.4.11.55-.07.15-.17.63-.73.8-.99.17-.25.33-.21.55-.12.23.08 1.43.67 1.67.8.25.12.41.18.47.28.07.1.07.59-.14 1.2z"/>
            </svg>
            <span>
              {locale === "ar"
                ? "يجب أن يكون واتساب مفعّلاً على هذا الرقم للتحقق من حسابك"
                : "WhatsApp must be active on this number to verify your account"}
            </span>
          </div>
          <PhoneInput
            name="phone"
            required
            autoComplete="tel"
            value={formData.phone}
            onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
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

        <HumanChallenge locale={locale} challenge={challenge} />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" className="mt-2" disabled={loading || !!error}>
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
  );
}
