"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";

import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

type PasskeyLoginButtonProps = {
  locale: Locale;
  next?: string;
};

export function PasskeyLoginButton({ locale, next }: PasskeyLoginButtonProps) {
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  const t = useMemo(() => {
    const ar = locale === "ar";
    return {
      label: ar ? "تسجيل الدخول عبر Passkey" : "Sign in with passkey",
      notSupported: ar
        ? "المتصفح لا يدعم Passkey على هذا الجهاز."
        : "Passkeys aren't supported on this device.",
      failed: ar ? "تعذر تسجيل الدخول عبر Passkey." : "Passkey sign-in failed.",
    };
  }, [locale]);

  async function handlePasskeyLogin() {
    if (!supported) {
      setError(t.notSupported);
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const identifierInput = document.querySelector(
        'input[name="identifier"]',
      ) as HTMLInputElement | null;
      const identifier = identifierInput?.value?.trim();

      const optionsRes = await fetch("/api/auth/passkey/authentication/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier || undefined }),
      });

      const optionsJson = (await optionsRes.json()) as
        | { ok: true; options: any; requestId: string }
        | { ok: false; error: string };

      if (!optionsRes.ok || !optionsJson.ok) {
        throw new Error(optionsJson.ok ? "OPTIONS_FAILED" : optionsJson.error);
      }

      const assertion = await startAuthentication(optionsJson.options);

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

      if (next && next.startsWith(`/${locale}/`)) {
        router.push(next);
      } else {
        router.push(`/${locale}/dashboard`);
      }
      router.refresh();
    } catch (e) {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <Button type="button" variant="secondary" onClick={handlePasskeyLogin} disabled={busy}>
        {t.label}
      </Button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
