import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { WalletClient } from "./WalletClient";
import { getUserWallet, ensureWallet, getWalletTransactions, getUserWithdrawalRequests } from "@/lib/db/wallet";

export const runtime = "nodejs";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  // User must have a phone number for wallet
  if (!user.phone) {
    redirect(`/${locale}/settings?wallet_error=phone_required`);
  }

  // Get or create wallet
  let wallet = await getUserWallet(user.id);
  if (!wallet) {
    wallet = await ensureWallet(user.id, user.phone);
  }

  // Get recent transactions and withdrawal requests
  const [transactions, withdrawalRequests] = await Promise.all([
    getWalletTransactions(user.id, 20, 0),
    getUserWithdrawalRequests(user.id, 20, 0),
  ]);

  return (
    <AppPage>
      <WalletClient
        locale={locale as Locale}
        dict={dict}
        user={{
          id: user.id,
          role: user.role,
          displayName: user.displayName || user.email.split("@")[0],
          phone: user.phone,
        }}
        initialWallet={{
          balance: wallet.balance,
          accountNumber: wallet.accountNumber,
        }}
        initialTransactions={transactions}
        initialWithdrawalRequests={withdrawalRequests}
      />
    </AppPage>
  );
}
