import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getUserById } from "@/lib/db/users";
import { buttonVariants } from "@/components/ui/Button";
import { EditUserForm } from "./EditUserForm";

export const runtime = "nodejs";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);
  const user = await getUserById(id);

  if (!user) notFound();

  return (
    <AppPage>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "ar" ? "تعديل المستخدم" : dict.nav.edit ?? "Edit user"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{user.email}</p>
        </div>
        <Link
          href={`/${locale}/admin/users`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          {locale === "ar" ? "رجوع" : "Back"}
        </Link>
      </div>

      <EditUserForm locale={locale as Locale} user={user} />
    </AppPage>
  );
}
