import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { PublicPage } from "@/components/PublicPage";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  formatStorePrice,
  getStoreProductText,
  listStoreProducts,
} from "@/lib/store/products";

export const runtime = "nodejs";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const products = listStoreProducts().filter((p) => {
    if (!q) return true;
    const t = getStoreProductText(p, locale as Locale);
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const ar = locale === "ar";
  const Wrapper = user ? AppPage : PublicPage;

  return (
    <Wrapper>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {dict.nav.store}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "اختر حزم وخدمات تساعدك على تطوير نشاطك داخل منصة SBC — جميع الأسعار بالريال العُماني (OMR)."
              : "Pick products and add-ons to grow your business on SBC — all prices in Omani Rial (OMR)."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!user ? (
            <>
              <Link
                href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store`)}`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {dict.nav.login}
              </Link>
              <Link
                href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/store`)}`}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                {dict.nav.register}
              </Link>
            </>
          ) : (
            <Link
              href={`/${locale}/dashboard`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {dict.nav.dashboard}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 sbc-card rounded-2xl p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" action={`/${locale}/store`}>
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder={ar ? "ابحث عن منتج…" : "Search products…"}
            className="flex-1"
          />
          <button
            type="submit"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            {ar ? "بحث" : "Search"}
          </button>
          {q ? (
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              {ar ? "مسح" : "Clear"}
            </Link>
          ) : null}
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد نتائج." : "No results."}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const t = getStoreProductText(p, locale as Locale);
            return (
              <article key={p.slug} className="sbc-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-snug truncate">
                      {t.name}
                    </h2>
                    <div className="mt-1 text-sm text-(--muted-foreground)">
                      {formatStorePrice(p.price, locale as Locale)}
                    </div>
                  </div>

                  {p.badges?.length ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {p.badges.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-(--chip-bg) px-2.5 py-1 text-xs text-(--muted-foreground)"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-7 text-(--muted-foreground)">
                  {t.description}
                </p>

                <ul className="mt-4 grid gap-2 text-sm text-(--muted-foreground)">
                  {t.features.slice(0, 4).map((f) => (
                    <li key={f}>{ar ? "• " : "• "}{f}</li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/${locale}/store/${p.slug}`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {ar ? "التفاصيل" : "Details"}
                  </Link>
                  {user ? (
                    <AddToCartButton productSlug={p.slug} locale={locale as Locale} />
                  ) : (
                    <Link
                      href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store`)}`}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      {ar ? dict.nav.login : "Login to add"}
                    </Link>
                  )}
                  <Link
                    href={`/${locale}/contact?subject=${encodeURIComponent(`Store: ${t.name}`)}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {ar ? "تواصل" : "Contact"}
                  </Link>
                </div>

                <div className="mt-4 text-xs text-(--muted-foreground)">
                  {ar
                    ? "ملاحظة: الدفع الحقيقي سيتم ربطه لاحقاً."
                    : "Note: real payments will be integrated later."}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Wrapper>
  );
}
