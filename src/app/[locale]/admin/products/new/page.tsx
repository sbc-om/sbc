import { notFound } from "next/navigation";
import Link from "next/link";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { NewProductForm } from "./NewProductForm";

export const runtime = "nodejs";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "إنشاء محصول جديد" : "Create New Product"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "أضف محصول جديد إلى المتجر" : "Add a new product to the store"}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/products`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة" : "Back"}
        </Link>
      </div>

      <div className="sbc-card p-6">
        <NewProductForm locale={locale as Locale} />
      </div>
    </AppPage>
  );
}
