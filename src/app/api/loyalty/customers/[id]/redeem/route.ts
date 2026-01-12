import { getCurrentUser } from "@/lib/auth/currentUser";
import { redeemLoyaltyCustomerPoints } from "@/lib/db/loyalty";
import { notifyAppleWalletPassUpdated } from "@/lib/wallet/appleApns";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const { customer, settings } = redeemLoyaltyCustomerPoints({
      userId: auth.id,
      customerId: id,
    });

    // Best-effort: Wallet update alert.
    if (customer.cardId) {
      void notifyAppleWalletPassUpdated({ cardId: customer.cardId });
    }

    return Response.json({ ok: true, customer, settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "REDEEM_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
