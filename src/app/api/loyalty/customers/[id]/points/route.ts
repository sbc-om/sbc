import { headers } from "next/headers";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { adjustLoyaltyCustomerPoints, getLoyaltyCustomerById, getLoyaltyProfile } from "@/lib/db/loyalty";
import { updateWalletCardPoints } from "@/lib/wallet/walletUpdates";
import { sendLoyaltyPointsNotification } from "@/lib/waha/client";

export const runtime = "nodejs";

const patchSchema = z.object({
  delta: z.number().int().min(-1000).max(1000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const json = await req.json();
    const data = patchSchema.parse(json);

    // Get customer info before update for notification
    const existingCustomer = await getLoyaltyCustomerById(id);
    if (!existingCustomer) {
      return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const customer = await adjustLoyaltyCustomerPoints(id, data.delta);

    // Professional wallet update: Update both Apple & Google Wallet passes
    // This runs asynchronously and provides detailed results
    let walletUpdateInfo = null;
    if (customer.cardId) {
      try {
        console.log(`[WalletUpdate] Updating wallet for cardId: ${customer.cardId}, points: ${customer.points}, delta: ${data.delta}`);
        
        const updateResult = await updateWalletCardPoints({
          cardId: customer.cardId,
          points: customer.points,
          delta: data.delta,
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

    // Send WhatsApp notification for any points change
    let whatsappNotification = null;
    if (data.delta !== 0 && existingCustomer.phone) {
      try {
        const profile = await getLoyaltyProfile(existingCustomer.userId);
        const businessName = profile?.businessName || "Your Business";
        const locale = (await headers()).get("x-locale") === "ar" ? "ar" : "en";
        
        await sendLoyaltyPointsNotification({
          phone: existingCustomer.phone,
          customerName: existingCustomer.fullName,
          businessName,
          points: customer.points,
          delta: data.delta,
          type: data.delta > 0 ? "earn" : "deduct",
          locale,
        });
        
        whatsappNotification = { sent: true };
        console.log(`[WhatsApp] Points notification sent to ${existingCustomer.phone}`);
      } catch (error) {
        console.error(`[WhatsApp] Failed to send notification:`, error);
        whatsappNotification = { 
          sent: false, 
          error: error instanceof Error ? error.message : "NOTIFICATION_FAILED" 
        };
      }
    }

    return Response.json({ 
      ok: true, 
      customer,
      walletUpdate: walletUpdateInfo,
      whatsappNotification,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
