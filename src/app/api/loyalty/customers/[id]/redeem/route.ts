import { getCurrentUser } from "@/lib/auth/currentUser";
import { redeemLoyaltyCustomerPoints, getLoyaltySettings, getLoyaltyCustomerById, defaultLoyaltySettings } from "@/lib/db/loyalty";
import { updateWalletCardPoints } from "@/lib/wallet/walletUpdates";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    // First get customer to find the owner's userId
    const existingCustomer = await getLoyaltyCustomerById(id);
    if (!existingCustomer) {
      return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Get settings for the business owner
    const settings = await getLoyaltySettings(existingCustomer.userId) ?? defaultLoyaltySettings(existingCustomer.userId);

    // Redeem points
    const customer = await redeemLoyaltyCustomerPoints(id, settings.pointsDeductPerRedemption);

    // Professional wallet update: Update both Apple & Google Wallet passes
    // This runs asynchronously and provides detailed results
    let walletUpdateInfo = null;
    if (customer.cardId) {
      try {
        console.log(`[WalletUpdate] Updating wallet for cardId: ${customer.cardId}, points: ${customer.points}, delta: -${settings.pointsDeductPerRedemption}`);
        
        const updateResult = await updateWalletCardPoints({
          cardId: customer.cardId,
          points: customer.points,
          delta: -(settings.pointsDeductPerRedemption),
        });
        
        console.log(`[WalletUpdate] Result:`, JSON.stringify(updateResult, null, 2));
        
        walletUpdateInfo = {
          success: updateResult.success,
          apple: updateResult.apple,
          google: updateResult.google,
          errors: updateResult.errors.length > 0 ? updateResult.errors : undefined,
        };
      } catch (error) {
        // Wallet update failure shouldn't block the main operation
        console.error(`[WalletUpdate] Error updating wallet:`, error);
        walletUpdateInfo = {
          success: false,
          errors: [error instanceof Error ? error.message : "WALLET_UPDATE_FAILED"],
        };
      }
    } else {
      console.log(`[WalletUpdate] No cardId found for customer, skipping wallet update`);
    }

    return Response.json({ 
      ok: true, 
      customer, 
      settings,
      walletUpdate: walletUpdateInfo,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "REDEEM_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
