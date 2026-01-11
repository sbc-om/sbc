import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listLoyaltyCustomersByUser } from "@/lib/db/loyalty";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import {
  addLoyaltyCustomerAction,
  adjustLoyaltyCustomerPointsAction,
} from "./actions";

export const runtime = "nodejs";

export default async function LoyaltyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const sp = await searchParams;
  const success = sp.success === "1";

  const ar = locale === "ar";
  const user = await getCurrentUser();

  const programSub = user ? getProgramSubscriptionByUser(user.id, "loyalty") : null;
  const isActive = isProgramSubscriptionActive(programSub);
  const customers = user && isActive ? listLoyaltyCustomersByUser(user.id) : [];

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "بطاقة الولاء" : "Loyalty Card"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "بطاقة ولاء رقمية لعملائك—يمكن إضافتها إلى Apple Wallet وGoogle Wallet—مع إدارة العملاء ونقاط الولاء داخل منصتنا." 
              : "A digital loyalty card your customers can add to Apple Wallet / Google Wallet, with customer CRM and points tracking."}
          </p>
          <div className="mt-3">
            <Link
              href={`/${locale}/loyalty/about`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {ar ? "صفحة التعريف بالمنتج" : "Public product page"}
            </Link>
          </div>
        </div>
        <Link href={`/${locale}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>

      {success ? (
        <div className="mt-6 sbc-card rounded-2xl p-5">
          <div className="font-semibold">
            {ar ? "تم تفعيل الاشتراك" : "Subscription activated"}
          </div>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "يمكنك الآن إضافة العملاء وإصدار بطاقات الولاء." 
              : "You can now add customers and issue loyalty cards."}
          </p>
        </div>
      ) : null}

      {!user ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "إدارة الولاء" : "Manage loyalty"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "سجّل الدخول لإدارة العملاء والنقاط."
              : "Login to manage customers and points."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty`)}`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "تسجيل الدخول" : "Login"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/loyalty`)}`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "إنشاء حساب" : "Create account"}
            </Link>
          </div>
        </div>
      ) : null}

      {/* Management */}
      {user && isActive ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold">{ar ? "إدارة العملاء" : "Customer management"}</h3>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "أضف عملاءك. سيتم إنشاء بطاقة ولاء لكل عميل، ويتم حفظ بياناتهم في قاعدة بياناتنا." 
              : "Add your customers. A loyalty card will be issued per customer and stored in our database."}
          </p>

          <form action={addLoyaltyCustomerAction.bind(null, locale as Locale)} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="fullName" placeholder={ar ? "اسم العميل" : "Customer full name"} required />
              <Input name="phone" placeholder={ar ? "الهاتف (اختياري)" : "Phone (optional)"} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
              <Input name="tags" placeholder={ar ? "وسوم (قريباً)" : "Tags (soon)"} disabled />
            </div>
            <Textarea name="notes" placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} />

            <div className="flex justify-end">
              <Button type="submit">{ar ? "إضافة" : "Add customer"}</Button>
            </div>
          </form>

          <div className="mt-8">
            <div className="font-semibold">{ar ? "العملاء" : "Customers"}</div>

            {customers.length === 0 ? (
              <div className="mt-3 text-sm text-(--muted-foreground)">
                {ar ? "لا يوجد عملاء بعد." : "No customers yet."}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {customers.map((c) => (
                  <div key={c.id} className="sbc-card rounded-2xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold">{c.fullName}</div>
                        <div className="mt-1 text-xs text-(--muted-foreground)">
                          {c.email ? c.email : null}{c.email && c.phone ? " • " : null}{c.phone ? c.phone : null}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-(--muted-foreground)">{ar ? "النقاط" : "Points"}: </span>
                          <span className="font-semibold">{c.points}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Link
                            className={buttonVariants({ variant: "secondary", size: "sm" })}
                            href={`/${locale}/loyalty/card/${c.cardId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {ar ? "عرض البطاقة" : "View card"}
                          </Link>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
                          <input type="hidden" name="customerId" value={c.id} />
                          <input type="hidden" name="delta" value="1" />
                          <Button type="submit" size="sm" variant="secondary">
                            {ar ? "+1" : "+1"}
                          </Button>
                        </form>
                        <form action={adjustLoyaltyCustomerPointsAction.bind(null, locale as Locale)}>
                          <input type="hidden" name="customerId" value={c.id} />
                          <input type="hidden" name="delta" value="-1" />
                          <Button type="submit" size="sm" variant="ghost">
                            {ar ? "-1" : "-1"}
                          </Button>
                        </form>
                      </div>
                    </div>

                    {c.notes ? (
                      <div className="mt-3 text-sm text-(--muted-foreground)">
                        {c.notes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {user && !isActive ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "الاشتراك غير مفعل" : "Subscription not active"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "تفعيل الاشتراك يتم من خلال المتجر. بعد التفعيل ستظهر أدوات إدارة العملاء وإصدار البطاقات هنا." 
              : "Activation is handled in the Store. After activation, customer management tools will appear here."}
          </p>
          <div className="mt-4">
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "فتح المتجر" : "Open store"}
            </Link>
          </div>
        </div>
      ) : null}
    </PublicPage>
  );
}
