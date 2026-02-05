import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { getProgramSubscriptionByUser, hasActiveSubscription } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function DirectoryManagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const ar = locale === "ar";

  const sub = await getProgramSubscriptionByUser(user.id);
  const active = await hasActiveSubscription(user.id, "directory");

  const businesses = active ? await listBusinessesByOwner(user.id) : [];

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "دليل الأعمال" : "Business Directory"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "إدارة عضويتك وإدراج نشاطك في الدليل." 
              : "Manage your membership and directory listing."}
          </p>
        </div>

        <Link
          href={`/${locale}/dashboard`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {dict.nav.dashboard}
        </Link>
      </div>

      {!active ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">
            {ar ? "العضوية غير مفعلة" : "Membership not active"}
          </div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "للظهور في الدليل/الصفحة الرئيسية، اشترِ باقة دليل الأعمال من المتجر." 
              : "To appear in the directory/homepage, purchase a Directory package from the store."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/store?q=directory`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "اذهب للمتجر" : "Go to store"}
            </Link>
            <Link
              href={`/${locale}/businesses`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "استكشف الدليل" : "Explore directory"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="font-semibold">
              {ar ? "اشتراكك مفعل" : "Your subscription is active"}
            </div>
            {sub ? (
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar ? "ينتهي في" : "Expires on"}: <span className="font-medium">{new Date(sub.expiresAt).toLocaleDateString(ar ? "ar-OM" : "en-OM")}</span>
              </p>
            ) : null}
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "(ملاحظة: ترتيب الظهور في الصفحة الرئيسية سيتم ربطه بخطة الاشتراك في خطوة لاحقة.)" 
                : "(Note: homepage ranking will be tied to your plan in a later step.)"}
            </p>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{ar ? "أنشطتك" : "Your businesses"}</h2>
                <p className="mt-1 text-sm text-(--muted-foreground)">
                  {ar
                    ? "هذه الأنشطة مرتبطة بحسابك كمالك (owner)." 
                    : "These businesses are linked to your account as owner."}
                </p>
              </div>
              {/* Only show add button if user doesn't already have a business */}
              {businesses.length === 0 && (
                <Link
                  href={`/${locale}/business-request`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {ar ? "إضافة نشاط" : "Add business"}
                </Link>
              )}
            </div>

            {businesses.length === 0 ? (
              <div className="mt-4 sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
                {ar
                  ? "لا توجد أنشطة مرتبطة بحسابك حالياً. اطلب إضافة/ربط نشاط من خلال صفحة الطلب." 
                  : "No businesses are linked to your account yet. Request one from the business request page."}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {businesses.map((b) => (
                  <div key={b.id} className="sbc-card rounded-2xl p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold">{ar ? b.name.ar : b.name.en}</div>
                        <div className="mt-1 text-xs text-(--muted-foreground)">
                          {b.city ? b.city : null}{b.city && b.category ? " • " : null}{b.category ? b.category : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${locale}/businesses/${b.slug}`}
                          className={buttonVariants({ variant: "primary", size: "sm" })}
                        >
                          {ar ? "عرض" : "View"}
                        </Link>
                        <Link
                          href={`/${locale}/directory/businesses/${b.id}/edit`}
                          className={buttonVariants({ variant: "secondary", size: "sm" })}
                        >
                          {ar ? "إدارة" : "Manage"}
                        </Link>
                        <Link
                          href={`/${locale}/directory/businesses/${b.id}/cards`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          {ar ? "بطاقات" : "Cards"}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 text-xs text-(--muted-foreground)">
            {ar
              ? "لتغيير الباقة أو تمديد المدة، قم بالشراء مرة أخرى من المتجر—وسيتم إضافة المدة تلقائياً." 
              : "To change package or extend time, purchase again from the store—time will be added automatically."}
          </div>
        </>
      )}
    </AppPage>
  );
}
