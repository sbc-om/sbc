import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAllWithdrawalRequests } from "@/lib/db/wallet";
import { WithdrawalsClient } from "./WithdrawalsClient";

export const runtime = "nodejs";

export default async function AdminWithdrawalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  
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
  const requests = await getAllWithdrawalRequests(filterStatus, 100, 0);

  return (
    <AppPage>
      <WithdrawalsClient
        locale={locale as Locale}
        dict={dict}
        initialRequests={requests}
        currentStatus={requestedStatus as "pending" | "approved" | "rejected" | "all"}
      />
    </AppPage>
  );
}
