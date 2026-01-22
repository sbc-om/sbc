import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { listBusinessCardsByBusiness } from "@/lib/db/businessCards";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createBusinessCardAction } from "./actions";

export const runtime = "nodejs";

export default async function BusinessCardsManagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const business = getBusinessById(id);
  if (!business || business.ownerId !== user.id) notFound();

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;
  const isApproved = business.isApproved ?? business.isVerified ?? false;
  const cards = isApproved
    ? listBusinessCardsByBusiness({ ownerId: user.id, businessId: business.id })
    : [];

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "بطاقات الأعمال" : "Business Cards"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? `إدارة بطاقات الأعمال الخاصة بـ ${businessName}`
              : `Manage business cards for ${businessName}`}
          </p>
        </div>

        <Link
          href={`/${locale}/directory/businesses/${business.id}/edit`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "رجوع" : "Back"}
        </Link>
      </div>

      {!isApproved ? (
        <div className="mt-8 sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar
            ? "لا يمكن إنشاء بطاقات أعمال قبل اعتماد النشاط للظهور."
            : "You can create business cards after your business is approved for listing."}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-4 text-sm font-semibold">
              {ar ? "البطاقات الحالية" : "Existing cards"}
            </div>
            {cards.length === 0 ? (
              <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
                {ar
                  ? "لا توجد بطاقات حتى الآن. أضف أول بطاقة من النموذج." 
                  : "No business cards yet. Add your first card using the form."}
              </div>
            ) : (
              <div className="grid gap-3">
                {cards.map((card) => (
                  <div key={card.id} className="sbc-card rounded-2xl p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold">{card.fullName}</div>
                        <div className="mt-1 text-xs text-(--muted-foreground)">
                          {card.title || (ar ? "بدون مسمى" : "No title")}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {card.isPublic && card.isApproved ? (
                          <Link
                            href={`/${locale}/business-card/${card.id}`}
                            className={buttonVariants({ variant: "ghost", size: "xs" })}
                          >
                            {ar ? "عرض" : "View"}
                          </Link>
                        ) : null}
                        <Link
                          href={`/${locale}/directory/businesses/${business.id}/cards/${card.id}`}
                          className={buttonVariants({ variant: "secondary", size: "xs" })}
                        >
                          {ar ? "تعديل" : "Edit"}
                        </Link>
                        <span className="text-xs text-(--muted-foreground)">
                          {card.isPublic ? (ar ? "عام" : "Public") : (ar ? "خاص" : "Private")}
                        </span>
                        <span className="text-xs text-(--muted-foreground)">
                          {card.isApproved ? (ar ? "معتمد" : "Approved") : (ar ? "بانتظار الاعتماد" : "Pending approval")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sbc-card rounded-2xl p-6">
            <div className="text-sm font-semibold mb-4">
              {ar ? "إضافة بطاقة جديدة" : "Create new card"}
            </div>
            <form action={createBusinessCardAction.bind(null, locale as Locale, business.id)} className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">
                  {ar ? "الاسم الكامل" : "Full name"}
                </label>
                <input name="fullName" required className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">
                  {ar ? "المسمى الوظيفي" : "Title"}
                </label>
                <input name="title" className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "البريد" : "Email"}</label>
                  <input name="email" type="email" className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "الهاتف" : "Phone"}</label>
                  <input name="phone" className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "الموقع" : "Website"}</label>
                <input name="website" className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "السيرة المختصرة" : "Bio"}</label>
                <textarea name="bio" rows={4} className="w-full px-3 py-2 rounded-xl border border-(--surface-border) bg-(--surface) text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" defaultChecked className="h-4 w-4" />
                {ar ? "متاح للعامة" : "Publicly visible"}
              </label>
              <div className="text-xs text-amber-600">
                {ar ? "تحتاج البطاقة إلى اعتماد الإدارة قبل الظهور للعامة." : "Cards need admin approval before public display."}
              </div>
              <div>
                <button type="submit" className={buttonVariants({ variant: "primary", size: "md" })}>
                  {ar ? "حفظ البطاقة" : "Save card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppPage>
  );
}
