import Link from "next/link";
import { headers } from "next/headers";
import { Container } from "@/components/Container";
import { defaultLocale, isLocale, localeDir } from "@/lib/i18n/locales";

async function getRequestLocale() {
  const h = await headers();
  const raw = h.get("x-locale") ?? defaultLocale;
  return isLocale(raw) ? raw : defaultLocale;
}

export default async function NotFoundPage() {
  const locale = await getRequestLocale();
  const ar = locale === "ar";
  const homeHref = `/${locale}`;
  const businessesHref = `/${locale}/businesses`;

  const title = ar ? "الصفحة غير موجودة" : "Page not found";
  const description = ar
    ? "الصفحة التي تبحث عنها غير موجودة، ربما تم نقلها أو أن الرابط غير صحيح. يمكنك الرجوع للرئيسية أو استعراض الأنشطة التجارية."
    : "The page you are looking for does not exist, may have been moved, or the URL is incorrect. You can return home or browse businesses.";

  return (
    <main className="min-h-screen flex items-center" dir={localeDir(locale)}>
      <Container size="md" className="py-16">
        <section className="sbc-card p-8 sm:p-10 text-center">
          <div className="mx-auto mb-5 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{
              borderColor: "var(--chip-border)",
              background: "var(--chip-bg)",
              color: "var(--chip-foreground)",
            }}
          >
            {ar ? "خطأ 404" : "Error 404"}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>

          <p className="mx-auto max-w-xl text-sm sm:text-base mb-8"
            style={{ color: "var(--muted-foreground)" }}
          >
            {description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "var(--accent-foreground)",
                boxShadow: "var(--shadow)",
              }}
            >
              {ar ? "الذهاب إلى الرئيسية" : "Go to Home"}
            </Link>

            <Link
              href={businessesHref}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold w-full sm:w-auto border"
              style={{
                borderColor: "var(--surface-border)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
            >
              {ar ? "استعراض الأنشطة" : "Browse Businesses"}
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
