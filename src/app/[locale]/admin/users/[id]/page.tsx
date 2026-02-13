import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getUserById } from "@/lib/db/users";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { listUserProgramSubscriptions } from "@/lib/db/subscriptions";
import { buttonVariants } from "@/components/ui/Button";
import { EditUserForm } from "./EditUserForm";

export const runtime = "nodejs";

function formatDate(date: string | undefined, locale: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const user = await getUserById(id);

  if (!user) notFound();

  const businesses = await listBusinessesByOwner(id);
  const subscriptions = await listUserProgramSubscriptions(id);

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.fullName}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{user.email}</p>
        </div>
        <Link
          href={`/${locale}/admin/users`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          {ar ? "رجوع" : "Back"}
        </Link>
      </div>

      {/* User Info Card */}
      <div className="sbc-card rounded-2xl p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">{ar ? "معلومات المستخدم" : "User Information"}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "الهاتف" : "Phone"}</div>
            <div className="mt-1 font-medium">{user.phone || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "الدور" : "Role"}</div>
            <div className="mt-1 font-medium capitalize">{user.role}</div>
          </div>
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "الحالة" : "Status"}</div>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                user.isActive
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-red-500/15 text-red-600"
              }`}>
                {user.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "توثيق الهاتف" : "Phone Verified"}</div>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                user.isPhoneVerified
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-gray-500/15 text-gray-600"
              }`}>
                {user.isPhoneVerified ? (ar ? "موثق" : "Verified") : (ar ? "غير موثق" : "Not verified")}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "الشارة الزرقاء" : "Blue Badge"}</div>
            <div className="mt-1">
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600">
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                  </svg>
                  {ar ? "موثق" : "Verified"}
                </span>
              ) : (
                <span className="text-sm text-(--muted-foreground)">-</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-(--muted-foreground)">{ar ? "تاريخ التسجيل" : "Joined"}</div>
            <div className="mt-1 font-medium">{formatDate(user.createdAt, locale)}</div>
          </div>
        </div>
      </div>

      {/* Businesses Section */}
      <div className="sbc-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{ar ? "الأنشطة التجارية" : "Businesses"}</h2>
          <span className="text-sm text-(--muted-foreground)">
            {businesses.length} {ar ? "نشاط" : businesses.length === 1 ? "business" : "businesses"}
          </span>
        </div>
        {businesses.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
            {businesses.map((biz) => (
              <div key={biz.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link 
                    href={`/${locale}/admin/${biz.id}/edit`}
                    className="font-medium hover:text-accent transition-colors"
                  >
                    {ar ? biz.name.ar : biz.name.en}
                  </Link>
                  <div className="text-xs text-(--muted-foreground) mt-0.5">
                    {biz.city || "-"} • {formatDate(biz.createdAt, locale)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {biz.isApproved ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600">
                      {ar ? "موافق عليه" : "Approved"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600">
                      {ar ? "قيد المراجعة" : "Pending"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-(--muted-foreground)">
            {ar ? "لا توجد أنشطة تجارية" : "No businesses"}
          </p>
        )}
      </div>

      {/* Subscriptions Section */}
      <div className="sbc-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{ar ? "الاشتراكات والمشتريات" : "Subscriptions & Purchases"}</h2>
          <span className="text-sm text-(--muted-foreground)">
            {subscriptions.length} {ar ? "اشتراك" : subscriptions.length === 1 ? "subscription" : "subscriptions"}
          </span>
        </div>
        {subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-start" style={{ borderColor: "var(--surface-border)" }}>
                  <th className="py-2 pe-4 text-start font-semibold">{ar ? "المنتج" : "Product"}</th>
                  <th className="py-2 pe-4 text-start font-semibold">{ar ? "البرنامج" : "Program"}</th>
                  <th className="py-2 pe-4 text-start font-semibold">{ar ? "المبلغ" : "Amount"}</th>
                  <th className="py-2 pe-4 text-start font-semibold">{ar ? "تاريخ البدء" : "Start"}</th>
                  <th className="py-2 pe-4 text-start font-semibold">{ar ? "تاريخ الانتهاء" : "End"}</th>
                  <th className="py-2 text-start font-semibold">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const isExpired = new Date(sub.endDate) < new Date();
                  const isActive = sub.isActive && !isExpired;
                  return (
                    <tr key={sub.id} className="border-b" style={{ borderColor: "var(--surface-border)" }}>
                      <td className="py-3 pe-4">{sub.productSlug}</td>
                      <td className="py-3 pe-4 capitalize">{sub.program}</td>
                      <td className="py-3 pe-4">{sub.amount} {sub.currency}</td>
                      <td className="py-3 pe-4">{formatDate(sub.startDate, locale)}</td>
                      <td className="py-3 pe-4">{formatDate(sub.endDate, locale)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-gray-500/15 text-gray-600"
                        }`}>
                          {isActive ? (ar ? "نشط" : "Active") : (ar ? "منتهي" : "Expired")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-(--muted-foreground)">
            {ar ? "لا توجد اشتراكات" : "No subscriptions"}
          </p>
        )}
      </div>

      {/* Edit Form */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">{ar ? "تعديل المستخدم" : "Edit User"}</h2>
        <EditUserForm locale={locale as Locale} user={user} />
      </div>
    </AppPage>
  );
}
