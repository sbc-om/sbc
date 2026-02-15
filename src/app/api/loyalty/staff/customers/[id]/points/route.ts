import { headers } from "next/headers";
import { z } from "zod";

import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";
import { adjustLoyaltyCustomerPoints, getLoyaltyCustomerById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { updateWalletCardPoints } from "@/lib/wallet/walletUpdates";
import { sendLoyaltyPointsNotification } from "@/lib/waha/client";

export const runtime = "nodejs";

const patchSchema = z.object({
  delta: z.number().int().min(-1000).max(1000),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentLoyaltyStaffSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const existingCustomer = await getLoyaltyCustomerById(id);
    if (!existingCustomer) {
      return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (existingCustomer.userId !== session.ownerUserId) {
      return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const json = await req.json();
    const data = patchSchema.parse(json);

    const customer = await adjustLoyaltyCustomerPoints(id, data.delta);

    let walletUpdateInfo = null;
    if (customer.cardId) {
      try {
        const updateResult = await updateWalletCardPoints({
          cardId: customer.cardId,
          points: customer.points,
          delta: data.delta,
        });

        walletUpdateInfo = {
          success: updateResult.success,
          apple: updateResult.apple,
          google: updateResult.google,
          errors: updateResult.errors.length > 0 ? updateResult.errors : undefined,
        };
      } catch (error) {
        walletUpdateInfo = {
          success: false,
          errors: [error instanceof Error ? error.message : "WALLET_UPDATE_FAILED"],
        };
      }
    }

    let whatsappNotification = null;
    if (data.delta !== 0 && existingCustomer.phone) {
      try {
        const profile = await getLoyaltyProfileByUserId(existingCustomer.userId);
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
      } catch (error) {
        whatsappNotification = {
          sent: false,
          error: error instanceof Error ? error.message : "NOTIFICATION_FAILED",
        };
      }
    }

    return Response.json({
      ok: true,
      customer,
      walletUpdate: walletUpdateInfo,
      whatsappNotification,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
