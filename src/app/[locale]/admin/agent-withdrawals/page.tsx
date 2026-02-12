import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { countAgentWithdrawalRequests, listAllAgentWithdrawalRequests } from "@/lib/db/agents";
import AgentWithdrawalsClient from "@/app/[locale]/admin/agent-withdrawals/AgentWithdrawalsClient";

export const runtime = "nodejs";
const PER_PAGE = 20;

export default async function AdminAgentWithdrawalsPage({
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
  if (user.role !== "admin") redirect(`/${locale}/dashboard`);

  const valid = ["pending", "approved", "rejected", "all"] as const;
  const currentStatus = valid.includes(status as any) ? status! : "pending";
  const filterStatus = currentStatus === "all" ? undefined : (currentStatus as "pending" | "approved" | "rejected");
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const offset = (currentPage - 1) * PER_PAGE;

  const [requests, total] = await Promise.all([
    listAllAgentWithdrawalRequests(filterStatus, PER_PAGE, offset, search),
    countAgentWithdrawalRequests(filterStatus, search),
  ]);

  return (
    <AppPage>
      <AgentWithdrawalsClient
        locale={locale as Locale}
        initialRequests={requests}
        currentStatus={currentStatus as "pending" | "approved" | "rejected" | "all"}
        initialSearch={search || ""}
        pagination={{
          page: currentPage,
          perPage: PER_PAGE,
          total,
          totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
        }}
      />
    </AppPage>
  );
}
