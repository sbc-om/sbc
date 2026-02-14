import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAgentByUserId, isAgentClient, createCommission } from "@/lib/db/agents";
import { createBusinessRequest } from "@/lib/db/businessRequests";
import { getAvailableBalance, withdrawFromWallet, depositToWallet, ensureWallet } from "@/lib/db/wallet";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";
import { getStoreProductBySlug } from "@/lib/store/products";
import { query } from "@/lib/db/postgres";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Must be agent or admin
    if (user.role !== "agent" && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden — agent access required" },
        { status: 403 }
      );
    }

    // Verify agent record exists
    const agent = await getAgentByUserId(user.id);
    if (!agent && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Agent profile not found" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { clientUserId, productSlug } = body;

    if (clientUserId) {
      const verifiedRes = await query<{ is_phone_verified: boolean | null }>(
        `SELECT is_phone_verified FROM users WHERE id = $1 LIMIT 1`,
        [clientUserId]
      );
      const isVerified = (verifiedRes.rows[0]?.is_phone_verified ?? false) === true;
      if (!isVerified) {
        return NextResponse.json(
          { ok: false, error: "CLIENT_PHONE_NOT_VERIFIED" },
          { status: 403 }
        );
      }
    }

    // ── Plan purchase: deduct from client wallet & create subscription ──
    if (clientUserId && productSlug) {
      // Verify this is the agent's client
      if (user.role === "agent") {
        const isClient = await isAgentClient(user.id, clientUserId);
        if (!isClient) {
          return NextResponse.json(
            { ok: false, error: "NOT_YOUR_CLIENT" },
            { status: 403 }
          );
        }
      }

      // Fetch product
      const product = await getStoreProductBySlug(productSlug);
      if (!product) {
        return NextResponse.json(
          { ok: false, error: "PRODUCT_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Check client wallet balance
      const clientBalance = await getAvailableBalance(clientUserId);
      if (
        !clientBalance ||
        clientBalance.availableBalance < product.price.amount
      ) {
        return NextResponse.json(
          { ok: false, error: "CLIENT_INSUFFICIENT_BALANCE" },
          { status: 400 }
        );
      }

      // Ensure client wallet exists
      const clientRes = await query(
        `SELECT phone FROM users WHERE id = $1`,
        [clientUserId]
      );
      const clientPhone = clientRes.rows[0]?.phone;
      if (clientPhone) {
        await ensureWallet(clientUserId, clientPhone);
      }

      // Deduct from client wallet
      await withdrawFromWallet(
        clientUserId,
        product.price.amount,
        `Subscription: ${product.slug} (via agent business registration)`
      );

      // Deposit to SBC treasury if exists
      const treasuryExists = await query(
        `SELECT user_id FROM wallets WHERE user_id = 'sbc-treasury'`,
        []
      );
      if (treasuryExists.rows.length > 0) {
        await depositToWallet(
          "sbc-treasury",
          product.price.amount,
          `Subscription from client via agent: ${productSlug}`
        );
      }

      // Create subscription
      const sub = await purchaseProgramSubscription({
        userId: clientUserId,
        productId: product.id,
        productSlug: product.slug,
        program: product.program,
        durationDays: product.durationDays,
        amount: product.price.amount,
        currency: product.price.currency,
        paymentMethod: "wallet",
      });

      // Record agent commission
      if (agent && agent.commissionRate > 0) {
        await createCommission({
          agentUserId: user.id,
          clientUserId,
          subscriptionId: sub.id,
          amount: product.price.amount,
          commissionRate: agent.commissionRate,
        });
      }
    }

    // ── Create business request ──
    const request = await createBusinessRequest({
      userId: body.clientUserId || undefined, // client user id if registering for a specific client
      agentUserId: user.id,
      businessName: body.name_en || body.businessName || body.name || "",
      nameEn: body.name_en || body.nameEn,
      nameAr: body.name_ar || body.nameAr,
      descEn: body.desc_en || body.descEn,
      descAr: body.desc_ar || body.descAr,
      description: body.description,
      categoryId: body.categoryId,
      city: body.city,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      tags: body.tags,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return NextResponse.json({ ok: true, request });
  } catch (error: unknown) {
    console.error("Agent business request error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 400 }
    );
  }
}
