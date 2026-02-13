import { notFound } from "next/navigation";
import Link from "next/link";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getProductById } from "@/lib/db/products";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { EditProductForm } from "./EditProductForm";
import type { StoreProduct } from "@/lib/store/types";

export const runtime = "nodejs";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const product = await getProductById(id);
  if (!product) notFound();

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "تحرير المحصول" : "Edit Product"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? product.name.ar : product.name.en}
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
        <EditProductForm product={product as unknown as StoreProduct} locale={locale as Locale} />
      </div>
    </AppPage>
  );
}
