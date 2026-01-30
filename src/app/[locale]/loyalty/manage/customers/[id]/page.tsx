import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { Button, buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  defaultLoyaltySettings,
  getLoyaltyCustomerById,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
} from "@/lib/db/loyalty";
import { LoyaltyPointsIcons } from "@/components/loyalty/LoyaltyPointsIcons";

import { adjustLoyaltyCustomerPointsAction, redeemLoyaltyCustomerPointsAction } from "../../../actions";
import { CustomerDetailClient } from "./CustomerDetailClient";

export const runtime = "nodejs";

export default async function LoyaltyManageCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const user = await requireUser(locale as Locale);
  const profile = await getLoyaltyProfileByUserId(user.id);
  const settings = (await getLoyaltySettingsByUserId(user.id)) ?? defaultLoyaltySettings(user.id);

  const customer = await getLoyaltyCustomerById(id);
  if (!customer || customer.userId !== user.id) notFound();

  const sp = searchParams ? await searchParams : null;
  const error = sp?.error ? String(sp.error) : null;
  const pointsIconUrl = settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile?.logoUrl;

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

          <div className="mt-4">
            <LoyaltyPointsIcons points={customer.points} iconUrl={pointsIconUrl} maxIcons={80} />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error === "INSUFFICIENT_POINTS"
                ? ar
                  ? "لا توجد نقاط كافية للاستخدام."
                  : "Not enough points to redeem."
                : error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="1" />
              <Button type="submit" variant="primary" className="hover:bg-green-50 hover:text-green-600 hover:border-green-100 dark:hover:bg-green-950/20 dark:hover:text-green-300 dark:hover:border-green-900/30">{ar ? "+1" : "+1"}</Button>
            </form>

            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="5" />
              <Button type="submit" variant="secondary" className="hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:text-green-400 dark:hover:border-green-900/50">{ar ? "+5" : "+5"}</Button>
            </form>

            <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="delta" value="-1" />
              <Button type="submit" variant="secondary" className="hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-950/20 dark:hover:text-red-300 dark:hover:border-red-900/30">{ar ? "-1" : "-1"}</Button>
            </form>

            <form action={redeemLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="customerId" value={customer.id} />
              <Button type="submit" variant="primary">
                {ar
                  ? `استخدام (-${settings.pointsDeductPerRedemption})`
                  : `Redeem (-${settings.pointsDeductPerRedemption})`}
              </Button>
            </form>
          </div>

          <div className="mt-3 text-xs text-(--muted-foreground)">
            {ar
              ? `الحد الأدنى للاستخدام: ${settings.pointsRequiredPerRedemption} نقطة.`
              : `Min required: ${settings.pointsRequiredPerRedemption} points.`}
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
