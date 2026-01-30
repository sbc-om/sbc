import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listAllBusinessCards } from "@/lib/db/businessCards";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { setBusinessCardApprovalAction } from "./actions";

export const runtime = "nodejs";

export default async function AdminBusinessCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const { filter = "pending", q = "" } = (await searchParams) ?? {};
  const query = q.trim().toLowerCase();

  const cards = await listAllBusinessCards();
  const businesses = await listBusinesses();
  const businessMap = new Map(businesses.map((b) => [b.id, b]));

  const filteredCards = cards.filter((card) => {
    const approved = card.isApproved ?? false;
    if (filter === "pending" && approved) return false;
    if (filter === "approved" && !approved) return false;

    if (!query) return true;
    const business = businessMap.get(card.businessId);
    const hay = [
      card.fullName,
      card.title,
      business?.name?.en,
      business?.name?.ar,
      business?.slug,
      business?.username,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });

  const pendingCount = cards.filter((c) => !(c.isApproved ?? false)).length;
  const approvedCount = cards.length - pendingCount;
  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "بطاقات الأعمال" : "Business Cards"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "مراجعة واعتماد بطاقات الأعمال" : "Review and approve business cards"}
          </p>
        </div>
        <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "لوحة الإدارة" : "Admin dashboard"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href={`/${locale}/admin/business-cards?filter=pending${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "pending" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "معلّقة" : "Pending"}
          <span className="ms-2 text-xs opacity-70">{pendingCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/business-cards?filter=approved${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "approved" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "معتمدة" : "Approved"}
          <span className="ms-2 text-xs opacity-70">{approvedCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/business-cards?filter=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "all" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "الكل" : "All"}
          <span className="ms-2 text-xs opacity-70">{cards.length}</span>
        </Link>

        <form className="ms-auto w-full sm:w-auto" action={`/${locale}/admin/business-cards`}>
          <input type="hidden" name="filter" value={filter} />
          <div className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder={ar ? "بحث في البطاقات..." : "Search cards..."}
              className="w-full sm:w-64 h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
            />
          </div>
        </form>
      </div>

      {filteredCards.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد بطاقات مطابقة." : "No matching cards."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredCards.map((card) => {
            const business = businessMap.get(card.businessId);
            const approved = card.isApproved ?? false;
            return (
              <div key={card.id} className="sbc-card rounded-2xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold">{card.fullName}</div>
                    <div className="mt-1 text-xs text-(--muted-foreground)">
                      {card.title || (ar ? "بدون مسمى" : "No title")}
                    </div>
                    <div className="mt-2 text-xs text-(--muted-foreground)">
                      {ar ? "النشاط" : "Business"}: {business ? (ar ? business.name.ar : business.name.en) : (ar ? "غير معروف" : "Unknown")}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-(--muted-foreground)">
                      {card.isPublic ? (ar ? "عام" : "Public") : (ar ? "خاص" : "Private")}
                    </span>
                    <span className="text-xs text-(--muted-foreground)">
                      {approved ? (ar ? "معتمد" : "Approved") : (ar ? "معلّق" : "Pending")}
                    </span>
                    {approved ? (
                      <form action={setBusinessCardApprovalAction.bind(null, locale as Locale, card.id, false)}>
                        <button type="submit" className={buttonVariants({ variant: "secondary", size: "xs" })}>
                          {ar ? "إلغاء الاعتماد" : "Revoke"}
                        </button>
                      </form>
                    ) : (
                      <form action={setBusinessCardApprovalAction.bind(null, locale as Locale, card.id, true)}>
                        <button type="submit" className={buttonVariants({ variant: "primary", size: "xs" })}>
                          {ar ? "اعتماد" : "Approve"}
                        </button>
                      </form>
                    )}
                    {business ? (
                      <Link
                        href={`/${locale}/admin/${business.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "xs" })}
                      >
                        {ar ? "تعديل النشاط" : "Edit business"}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}