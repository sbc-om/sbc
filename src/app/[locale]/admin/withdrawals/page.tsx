import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAllWithdrawalRequests, countWithdrawalRequests } from "@/lib/db/wallet";
import { WithdrawalsClient } from "./WithdrawalsClient";

export const runtime = "nodejs";

const PER_PAGE = 20;

export default async function AdminWithdrawalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}) {
  const { locale } = await params;
  const { status, page, search } = await searchParams;
  
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  
  // Only admins can access
  if (user.role !== "admin") {
    redirect(`/${locale}/wallet`);
  }

  const dict = await getDictionary(locale as Locale);

  // Get withdrawal requests (filter by status - default to pending)
  const validStatuses = ["pending", "approved", "rejected", "all"] as const;
  const requestedStatus = validStatuses.includes(status as any) ? status : "pending";
  const filterStatus = requestedStatus === "all" ? undefined : requestedStatus as "pending" | "approved" | "rejected";
  
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const offset = (currentPage - 1) * PER_PAGE;
  
  const [requests, total] = await Promise.all([
    getAllWithdrawalRequests(filterStatus, PER_PAGE, offset, search),
    countWithdrawalRequests(filterStatus, search),
  ]);
  
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <AppPage>
      <WithdrawalsClient
        locale={locale as Locale}
        dict={dict}
        initialRequests={requests}
        currentStatus={requestedStatus as "pending" | "approved" | "rejected" | "all"}
        initialSearch={search || ""}
        pagination={{
          page: currentPage,
          perPage: PER_PAGE,
          total,
          totalPages,
        }}
      />
    </AppPage>
  );
}
