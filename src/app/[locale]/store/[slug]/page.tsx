import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  formatStorePrice,
  getStoreProductBySlug,
  getStoreProductText,
} from "@/lib/store/products";

export const runtime = "nodejs";

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  const product = await getStoreProductBySlug(slug);
  if (!product) notFound();

  const ar = locale === "ar";
  const t = getStoreProductText(product, locale as Locale);
  const Wrapper = user ? AppPage : PublicPage;

  return (
    <Wrapper>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {t.name}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {t.description}
          </p>
        </div>

        <Link
          href={`/${locale}/store`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة للمتجر" : "Back to store"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "المزايا" : "Features"}</h2>
          <ul className="mt-4 grid gap-2 text-sm text-(--muted-foreground)">
            {t.features.map((f) => (
              <li key={f}>{ar ? "• " : "• "}{f}</li>
            ))}
          </ul>
        </div>

        <aside className="sbc-card rounded-2xl p-6">
          <div className="text-sm text-(--muted-foreground)">
            {ar ? "السعر" : "Price"}
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {formatStorePrice(product.price, locale as Locale)}
          </div>

          {product.badges?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-(--chip-bg) px-2.5 py-1 text-xs text-(--muted-foreground)"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {user ? (
              <AddToCartButton
                productSlug={product.slug}
                locale={locale as Locale}
                size="md"
                className="w-full"
              />
            ) : (
              <Link
                href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store/${product.slug}`)}`}
                className={buttonVariants({
                  variant: "primary",
                  size: "md",
                  className: "w-full",
                })}
              >
                {dict.nav.login}
              </Link>
            )}
            <Link
              href={`/${locale}/contact?subject=${encodeURIComponent(`Store: ${t.name}`)}`}
              className={buttonVariants({ variant: "secondary", size: "md", className: "w-full" })}
            >
              {ar ? "تواصل" : "Contact"}
            </Link>

            {!user ? (
              <Link
                href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store/${product.slug}`)}`}
                className={buttonVariants({ variant: "secondary", size: "md", className: "w-full" })}
              >
                {dict.nav.login}
              </Link>
            ) : null}
          </div>

          <div className="mt-4 text-xs text-(--muted-foreground)">
            {ar
              ? "ملاحظة: الدفع الحقيقي سيتم ربطه لاحقاً."
              : "Note: real payments will be integrated later."}
          </div>
        </aside>
      </div>
    </Wrapper>
  );
}
