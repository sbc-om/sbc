import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listAllBusinessRequests } from "@/lib/db/businessRequests";
import { listUsers, type UserListItem } from "@/lib/db/users";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { RequestCard } from "./RequestCard";

export const runtime = "nodejs";

export default async function AdminRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const requests = listAllBusinessRequests();
  const users = listUsers();
  const categories = listCategories();

  const usersById = new Map(users.map((u) => [u.id, u] as const));
  const categoriesById = new Map(categories.map((c) => [c.id, c] as const));

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "طلبات تسجيل الأنشطة" : "Business Registration Requests"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? `${pendingRequests.length} طلب معلق، ${requests.length} طلب إجمالي`
              : `${pendingRequests.length} pending, ${requests.length} total`}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة" : "Back"}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="sbc-card p-4">
          <div className="text-sm font-medium text-(--muted-foreground)">
            {ar ? "معلقة" : "Pending"}
          </div>
          <div className="mt-2 text-2xl font-bold">{pendingRequests.length}</div>
        </div>
        <div className="sbc-card p-4">
          <div className="text-sm font-medium text-(--muted-foreground)">
            {ar ? "موافق عليها" : "Approved"}
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {approvedRequests.length}
          </div>
        </div>
        <div className="sbc-card p-4">
          <div className="text-sm font-medium text-(--muted-foreground)">
            {ar ? "مرفوضة" : "Rejected"}
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {rejectedRequests.length}
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "الطلبات المعلقة" : "Pending Requests"}
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map((req) => {
              const user = usersById.get(req.userId);
              const category = req.categoryId ? categoriesById.get(req.categoryId) : null;
              return (
                <RequestCard
                  key={req.id}
                  request={req}
                  user={user}
                  category={category}
                  locale={locale as Locale}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "الطلبات الموافق عليها" : "Approved Requests"}
          </h2>
          <div className="grid gap-4">
            {approvedRequests.map((req) => {
              const user = usersById.get(req.userId);
              const category = req.categoryId ? categoriesById.get(req.categoryId) : null;
              return (
                <RequestCard
                  key={req.id}
                  request={req}
                  user={user}
                  category={category}
                  locale={locale as Locale}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "الطلبات المرفوضة" : "Rejected Requests"}
          </h2>
          <div className="grid gap-4">
            {rejectedRequests.map((req) => {
              const user = usersById.get(req.userId);
              const category = req.categoryId ? categoriesById.get(req.categoryId) : null;
              return (
                <RequestCard
                  key={req.id}
                  request={req}
                  user={user}
                  category={category}
                  locale={locale as Locale}
                />
              );
            })}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="sbc-card p-8 text-center">
          <div className="text-(--muted-foreground)">
            {ar ? "لا توجد طلبات حتى الآن" : "No requests yet"}
          </div>
        </div>
      )}
    </AppPage>
  );
}
