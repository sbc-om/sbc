"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as Locale) ?? "en";
  const ar = locale === "ar";
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("[SBC] Route error:", error);
  }, [error]);

  const title = ar ? "حدث خطأ غير متوقع" : "Something went wrong";
  const description = ar
    ? "واجهنا مشكلة أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية."
    : "We encountered an issue while loading this page. Please try again or return to the homepage.";

  return (
    <main className="min-h-[60vh] flex items-center" dir={ar ? "rtl" : "ltr"}>
      <Container size="md" className="py-16">
        <div className="sbc-card relative overflow-hidden rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto">
          {/* Top gradient accent line */}
          <div
            className="absolute top-0 inset-x-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--accent-2))",
            }}
          />

          {/* Logo icon */}
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "var(--accent-soft)" }}
          >
            <Image
              src="/images/sbc.svg"
              alt="SBC"
              width={32}
              height={32}
              className="h-8 w-8 opacity-80"
            />
          </div>

          {/* Error badge */}
          <div
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "rgba(239, 68, 68, 0.2)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "#ef4444" }}
            />
            {ar ? "خطأ في التطبيق" : "Application Error"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            {title}
          </h1>

          <p
            className="mx-auto max-w-sm text-sm sm:text-base leading-relaxed mb-8"
            style={{ color: "var(--muted-foreground)" }}
          >
            {description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold w-full sm:w-auto transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "var(--accent-foreground)",
              }}
            >
              {ar ? "حاول مرة أخرى" : "Try Again"}
            </button>

            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold w-full sm:w-auto border transition-colors duration-200"
              style={{
                borderColor: "var(--surface-border)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
            >
              {ar ? "العودة إلى الرئيسية" : "Go Home"}
            </Link>
          </div>

          {/* Error details toggle */}
          {error?.message && (
            <div className="mt-6">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="text-xs underline underline-offset-2 transition-colors"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showDetails
                  ? ar
                    ? "إخفاء التفاصيل"
                    : "Hide details"
                  : ar
                    ? "عرض التفاصيل"
                    : "Show details"}
              </button>
              {showDetails && (
                <div
                  className="mt-3 rounded-lg p-3 text-start font-mono text-xs leading-relaxed max-h-28 overflow-y-auto"
                  style={{
                    background: "var(--chip-bg)",
                    color: "var(--muted-foreground)",
                    wordBreak: "break-word",
                  }}
                >
                  {error.digest && (
                    <div className="mb-1 opacity-60">
                      Digest: {error.digest}
                    </div>
                  )}
                  <div>{error.message}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
