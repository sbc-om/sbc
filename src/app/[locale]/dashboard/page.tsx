import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  return (
    <Container>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.nav.dashboard}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "مرحباً" : "Welcome"}: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {user.role === "admin" ? (
          <Link
            href={`/${locale}/admin`}
            className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
          >
            {dict.nav.admin}
          </Link>
        ) : null}
      </div>

      <div className="mt-8 sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
        {locale === "ar"
          ? "هذه لوحة التحكم الأساسية. لاحقاً يمكن إضافة حفظ المفضلة أو اقتراحات الأعمال."
          : "This is a minimal dashboard. Later we can add favorites or business suggestions."}
      </div>
    </Container>
  );
}
