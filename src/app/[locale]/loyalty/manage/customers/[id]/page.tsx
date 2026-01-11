import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { Button, buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getLoyaltyCustomerById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";

import { adjustLoyaltyCustomerPointsAction } from "../../../actions";
import { CustomerDetailClient } from "./CustomerDetailClient";

export const runtime = "nodejs";

export default async function LoyaltyManageCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const user = await requireUser(locale as Locale);
  const profile = getLoyaltyProfileByUserId(user.id);

  const customer = getLoyaltyCustomerById(id);
  if (!customer || customer.userId !== user.id) notFound();

  const returnTo = `/${locale}/loyalty/manage/customers/${customer.id}`;

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm text-(--muted-foreground)">{ar ? "العميل" : "Customer"}</div>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">
            {customer.fullName}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "ابحث سريعاً عبر QR أو الهاتف، وأضف النقاط بنقرة واحدة."
              : "Fast lookup via QR/phone, and adjust points in one tap."}
          </p>
          {profile?.businessName ? (
            <div className="mt-3 text-sm text-(--muted-foreground)">
              {ar ? "النشاط" : "Business"}: <span className="font-semibold text-foreground">{profile.businessName}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/${locale}/loyalty/manage/customers`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "رجوع" : "Back"}
          </Link>
          <Link
            href={`/${locale}/loyalty/card/${customer.cardId}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {ar ? "بطاقة العميل" : "Customer card"}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="sbc-card rounded-2xl p-6">
          <div className="text-lg font-semibold">{ar ? "النقاط" : "Points"}</div>
          <div className="mt-3 text-5xl font-bold bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            {customer.points}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="1" />
              <Button type="submit" variant="primary">{ar ? "+1" : "+1"}</Button>
            </form>

            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="5" />
              <Button type="submit" variant="secondary">{ar ? "+5" : "+5"}</Button>
            </form>

            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="-1" />
              <Button type="submit" variant="ghost">{ar ? "-1" : "-1"}</Button>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
            <div className="text-xs text-(--muted-foreground)">{ar ? "الهاتف" : "Phone"}</div>
            <div className="mt-1 font-mono text-sm" dir="ltr">{customer.phone ?? "—"}</div>

            <div className="mt-4 text-xs text-(--muted-foreground)">{ar ? "الكود" : "Code"}</div>
            <div className="mt-1 font-mono text-sm" dir="ltr">{customer.cardId}</div>
          </div>
        </div>

        <CustomerDetailClient
          locale={locale as Locale}
          customer={{
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            points: customer.points,
            cardId: customer.cardId,
          }}
        />
      </div>
    </PublicPage>
  );
}
