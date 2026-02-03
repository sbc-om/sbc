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

  // Get withdrawal requests (filter by status if provided)
  const validStatus = status === "pending" || status === "approved" || status === "rejected" ? status : undefined;
  const requests = await getAllWithdrawalRequests(validStatus, 100, 0);

  return (
    <AppPage>
      <WithdrawalsClient
        locale={locale as Locale}
        dict={dict}
        initialRequests={requests}
        currentStatus={validStatus}
      />
    </AppPage>
  );
}
