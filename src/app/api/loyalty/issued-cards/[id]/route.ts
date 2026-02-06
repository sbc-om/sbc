import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getLoyaltyIssuedCardById,
  updateIssuedCardPoints,
  addPointsToIssuedCard,
  deductPointsFromIssuedCard,
  updateIssuedCardStatus,
  getIssuedCardWithTemplate,
} from "@/lib/db/loyaltyTemplates";
import { updateGoogleWalletLoyaltyPoints } from "@/lib/wallet/sbcwallet";
import { notifyAppleWalletPassUpdated } from "@/lib/wallet/appleApns";

const updateCardSchema = z.object({
  points: z.number().min(0).optional(),
  addPoints: z.number().optional(),
  deductPoints: z.number().min(0).optional(),
  status: z.enum(["active", "suspended", "revoked"]).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/loyalty/issued-cards/{id}:
 *   get:
 *     summary: Get an issued card by ID
 *     tags: [Loyalty Issued Cards]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Card details with template
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getIssuedCardWithTemplate(id);
    
    if (!result) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (result.card.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, card: result.card, template: result.template });
  } catch (error) {
    console.error("Error getting issued card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/loyalty/issued-cards/{id}:
 *   patch:
 *     summary: Update an issued card (points, status)
 *     tags: [Loyalty Issued Cards]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: number
 *               addPoints:
 *                 type: number
 *               deductPoints:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, suspended, revoked]
 *     responses:
 *       200:
 *         description: Card updated successfully
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getLoyaltyIssuedCardById(id);
    
    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCardSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let card = existing;
    let pointsChanged = false;

    // Handle points updates (only one should be used)
    if (data.points !== undefined) {
      card = (await updateIssuedCardPoints(id, data.points)) ?? card;
      pointsChanged = true;
    } else if (data.addPoints !== undefined) {
      card = (await addPointsToIssuedCard(id, data.addPoints)) ?? card;
      pointsChanged = true;
    } else if (data.deductPoints !== undefined) {
      card = (await deductPointsFromIssuedCard(id, data.deductPoints)) ?? card;
      pointsChanged = true;
    }

    // Handle status update
    if (data.status) {
      card = (await updateIssuedCardStatus(id, data.status)) ?? card;
    }

    // If points changed, update wallet passes
    if (pointsChanged && card.status === "active") {
      const walletUpdateResults = {
        google: { updated: false, error: null as string | null },
        apple: { updated: false, error: null as string | null },
      };

      // Update Google Wallet pass
      try {
        await updateGoogleWalletLoyaltyPoints({
          cardId: existing.customerId, // Using legacy card system
          points: card.points,
        });
        walletUpdateResults.google.updated = true;
      } catch (err: any) {
        walletUpdateResults.google.error = err.message;
        console.warn("Google Wallet update failed:", err.message);
      }

      // Send Apple Wallet push notification
      if (card.appleRegistered) {
        try {
          await notifyAppleWalletPassUpdated({ cardId: id });
          walletUpdateResults.apple.updated = true;
        } catch (err: any) {
          walletUpdateResults.apple.error = err.message;
          console.warn("Apple Wallet update failed:", err.message);
        }
      }

      return NextResponse.json({ ok: true, card, walletUpdates: walletUpdateResults });
    }

    return NextResponse.json({ ok: true, card });
  } catch (error) {
    console.error("Error updating issued card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
