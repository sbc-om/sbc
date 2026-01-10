import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltySubscriptionByUserId, listLoyaltyCustomersByUser } from "@/lib/db/loyalty";
import {
  addLoyaltyCustomerAction,
  adjustLoyaltyCustomerPointsAction,
  purchaseLoyaltySubscriptionAction,
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

  const sub = user ? getLoyaltySubscriptionByUserId(user.id) : null;
  const isActive = sub?.status === "active";
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

      {/* Product explanation */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "Apple Wallet / Google Wallet" : "Apple Wallet / Google Wallet"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "ننشئ بطاقة رقمية لكل عميل (QR/Code) يمكن حفظها في المحفظة. (المرحلة الأولى: عرض البطاقة من خلال رابط داخل المنصة)." 
              : "We issue one digital card per customer (QR/Code) that can be saved to wallet apps. (Phase 1: card is viewable via a shareable link)."}
          </p>
        </div>

        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "CRM للعملاء" : "Customer CRM"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "تخزين معلومات عملائك في قاعدة بياناتنا (اسم، هاتف، بريد، ملاحظات) وربطها بالبطاقة." 
              : "Store your customers in our database (name, phone, email, notes) and link each one to a card."}
          </p>
        </div>

        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "نظام النقاط" : "Points system"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "من داخل لوحة Loyalty يمكنك إضافة/خصم النقاط لكل عميل (المرحلة الأولى)." 
              : "From the Loyalty dashboard you can add/remove points per customer (phase 1)."}
          </p>
        </div>
      </div>

      {/* Pricing / purchase */}
      <div className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{ar ? "الشراء والتفعيل" : "Purchase & activate"}</h3>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          {ar
            ? "للبدء، اختر خطة وفعّل الاشتراك. (الدفع الحقيقي سيتم ربطه لاحقاً)" 
            : "To start, pick a plan and activate your subscription. (Real payment will be integrated later)"}
        </p>

        {!user ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty`)}`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "سجّل الدخول للشراء" : "Login to buy"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/loyalty`)}`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "إنشاء حساب" : "Create account"}
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <form action={purchaseLoyaltySubscriptionAction.bind(null, locale as Locale)} className="sbc-card rounded-2xl p-5">
              <input type="hidden" name="plan" value="starter" />
              <div className="font-semibold">{ar ? "Starter" : "Starter"}</div>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {ar ? "أساسيات إدارة العملاء + بطاقات" : "Basics: customers + cards"}
              </p>
              <div className="mt-4">
                <Button type="submit" disabled={isActive}>
                  {isActive ? (ar ? "مفعل" : "Active") : (ar ? "تفعيل" : "Activate")}
                </Button>
              </div>
            </form>

            <form action={purchaseLoyaltySubscriptionAction.bind(null, locale as Locale)} className="sbc-card rounded-2xl p-5">
              <input type="hidden" name="plan" value="pro" />
              <div className="font-semibold">{ar ? "Pro" : "Pro"}</div>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {ar ? "مزايا إضافية (قريباً): حملات، تقسيم، تقارير" : "Extra features (soon): campaigns, segmentation, reporting"}
              </p>
              <div className="mt-4">
                <Button type="submit" disabled={isActive}>
                  {isActive ? (ar ? "مفعل" : "Active") : (ar ? "تفعيل" : "Activate")}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

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
        <div className="mt-8 text-xs text-(--muted-foreground)">
          {ar
            ? "بعد تفعيل الاشتراك ستظهر لك أدوات إدارة العملاء وإصدار بطاقات الولاء." 
            : "After activation, you will see customer management and card issuing tools."}
        </div>
      ) : null}
    </PublicPage>
  );
}
