"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}: RegisterFormProps) {
  const router = useRouter();
  const t = texts[locale];

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  );
}
