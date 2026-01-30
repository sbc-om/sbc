import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listProducts } from "@/lib/db/products";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { ProductCard } from "./ProductCard";
import type { StoreProduct } from "@/lib/store/types";

export const runtime = "nodejs";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const products = await listProducts();
  const ar = locale === "ar";

  const activeProducts = products.filter((p) => p.isActive);
  const inactiveProducts = products.filter((p) => !p.isActive);

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "إدارة المنتجات والباقات" : "Manage Products & Packages"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? `${products.length} منتج (${activeProducts.length} فعال)` : `${products.length} products (${activeProducts.length} active)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/products/new`}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            {ar ? "إضافة منتج" : "Add Product"}
          </Link>
          <Link
            href={`/${locale}/admin`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "العودة" : "Back"}
          </Link>
        </div>
      </div>

      {/* Active Products */}
      {activeProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "المنتجات الفعالة" : "Active Products"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product as unknown as StoreProduct}
                locale={locale as Locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Products */}
      {inactiveProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "المنتجات المعطلة" : "Inactive Products"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactiveProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product as unknown as StoreProduct}
                locale={locale as Locale}
              />
            ))}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="sbc-card p-8 text-center">
          <div className="text-(--muted-foreground)">
            {ar ? "لا توجد منتجات متاحة" : "No products available"}
          </div>
          <Link
            href={`/${locale}/admin/products/new`}
            className={`mt-4 ${buttonVariants({ variant: "primary" })}`}
          >
            {ar ? "إضافة منتج جديد" : "Add New Product"}
          </Link>
        </div>
      )}
    </AppPage>
  );
}
