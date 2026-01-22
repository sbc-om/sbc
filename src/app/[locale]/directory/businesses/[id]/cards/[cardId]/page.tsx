import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getBusinessCardById } from "@/lib/db/businessCards";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { deleteBusinessCardAction, updateBusinessCardAction } from "../actions";

export const runtime = "nodejs";

export default async function BusinessCardEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; cardId: string }>;
}) {
  const { locale, id, cardId } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const business = getBusinessById(id);
  if (!business || business.ownerId !== user.id) notFound();

  const card = getBusinessCardById(cardId);
  if (!card || card.businessId !== business.id) notFound();

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "تعديل بطاقة الأعمال" : "Edit Business Card"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {card.fullName}
          </p>
        </div>

        <Link
          href={`/${locale}/directory/businesses/${business.id}/cards`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "رجوع" : "Back"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="sbc-card rounded-2xl p-6">
          <form
            action={updateBusinessCardAction.bind(null, locale as Locale, business.id, card.id)}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1">
                {ar ? "الاسم الكامل" : "Full name"}
              </label>
              <input
                name="fullName"
                required
                defaultValue={card.fullName}
                className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1">
                {ar ? "المسمى الوظيفي" : "Title"}
              </label>
              <input
                name="title"
                defaultValue={card.title}
                className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "البريد" : "Email"}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={card.email}
                  className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "الهاتف" : "Phone"}</label>
                <input
                  name="phone"
                  defaultValue={card.phone}
                  className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "الموقع" : "Website"}</label>
              <input
                name="website"
                defaultValue={card.website}
                className="w-full h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1">{ar ? "السيرة المختصرة" : "Bio"}</label>
              <textarea
                name="bio"
                rows={4}
                defaultValue={card.bio}
                className="w-full px-3 py-2 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublic" defaultChecked={card.isPublic} className="h-4 w-4" />
              {ar ? "متاح للعامة" : "Publicly visible"}
            </label>
            {!card.isApproved ? (
              <div className="text-xs text-amber-600">
                {ar ? "بانتظار اعتماد الإدارة قبل الظهور للعامة." : "Waiting for admin approval before public display."}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={buttonVariants({ variant: "primary", size: "md" })}>
                {ar ? "حفظ التغييرات" : "Save changes"}
              </button>
              {card.isPublic && card.isApproved ? (
                <Link
                  href={`/${locale}/business-card/${card.id}`}
                  className={buttonVariants({ variant: "secondary", size: "md" })}
                >
                  {ar ? "عرض البطاقة" : "View card"}
                </Link>
              ) : null}
            </div>
          </form>
        </div>

        <div className="sbc-card rounded-2xl p-6">
          <div className="text-sm font-semibold mb-4">
            {ar ? "إجراءات" : "Actions"}
          </div>
          <form
            action={deleteBusinessCardAction.bind(null, locale as Locale, business.id, card.id)}
            className="space-y-3"
          >
            <div className="text-xs text-(--muted-foreground)">
              {ar
                ? "حذف البطاقة سيجعل الرابط العام غير متاح."
                : "Deleting the card will make the public link unavailable."}
            </div>
            <button type="submit" className={buttonVariants({ variant: "destructive", size: "md" })}>
              {ar ? "حذف البطاقة" : "Delete card"}
            </button>
          </form>
        </div>
      </div>
    </AppPage>
  );
}
