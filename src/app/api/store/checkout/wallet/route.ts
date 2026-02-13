/**
 * POST /api/store/checkout/wallet - Process checkout with wallet payment
 * Deducts from user wallet and transfers to SBC Treasury
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";
import { getStoreProductBySlug, type StoreProduct } from "@/lib/store/products";
import { getUserWallet, getAvailableBalance, ensureWallet } from "@/lib/db/wallet";
import { createOrder, SBC_TREASURY_ACCOUNT_NUMBER, SBC_TREASURY_USER_ID } from "@/lib/db/orders";
import { transaction, initSchema } from "@/lib/db/postgres";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  slugs: z.array(z.string()).min(1, "At least one product is required"),
  locale: z.enum(["en", "ar"]).optional().default("en"),
});

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Check if user has phone number
  if (!auth.phone) {
    return NextResponse.json(
      { ok: false, error: "PHONE_REQUIRED", message: "Phone number is required for wallet payment" },
      { status: 400 }
    );
  }

  try {
    // Ensure database schema is up to date
    await initSchema();

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { slugs, locale } = parsed.data;
    const uniqueSlugs = Array.from(new Set(slugs));
    const ar = locale === "ar";

    // Get all products and calculate total
    const products: StoreProduct[] = [];
    let totalAmount = 0;
    const currency = "OMR";

    for (const slug of uniqueSlugs) {
      const product = await getStoreProductBySlug(slug);
      if (!product) {
        return NextResponse.json(
          { ok: false, error: "PRODUCT_NOT_FOUND", slug },
          { status: 404 }
        );
      }
      products.push(product);
      totalAmount += product.price.amount;
    }

    // Check user wallet balance - create if doesn't exist
    let wallet = await getUserWallet(auth.id);
    if (!wallet) {
      wallet = await ensureWallet(auth.id, auth.phone);
    }

    const balanceInfo = await getAvailableBalance(auth.id);
    if (!balanceInfo || balanceInfo.availableBalance < totalAmount) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "INSUFFICIENT_BALANCE",
          required: totalAmount,
          available: balanceInfo?.availableBalance || 0,
        },
        { status: 400 }
      );
    }

    // Process the payment in a transaction
    const result = await transaction(async (client) => {
      // 0. Ensure treasury wallet exists
      await client.query(`
        INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, is_verified, display_name, approval_status, created_at, updated_at)
        VALUES ('sbc-treasury', 'treasury@sbc.om', 'sbc', 'SBC Treasury', '$2b$10$placeholder', 'system', true, true, 'SBC Treasury', 'approved', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      await client.query(`
        INSERT INTO wallets (user_id, balance, account_number, created_at, updated_at)
        VALUES ('sbc-treasury', 0, 'sbc', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING
      `);

      // 1. Lock user wallet and deduct balance
      const userWalletResult = await client.query(
        `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [auth.id]
      );
      
      if (userWalletResult.rows.length === 0) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const userBalance = parseFloat(userWalletResult.rows[0].balance);
      if (userBalance < totalAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const newUserBalance = userBalance - totalAmount;
      await client.query(
        `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
        [newUserBalance, auth.id]
      );

      // 2. Lock treasury wallet and add balance
      const treasuryResult = await client.query(
        `SELECT balance FROM wallets WHERE account_number = $1 FOR UPDATE`,
        [SBC_TREASURY_ACCOUNT_NUMBER]
      );

      if (treasuryResult.rows.length === 0) {
        throw new Error("TREASURY_NOT_FOUND");
      }

      const treasuryBalance = parseFloat(treasuryResult.rows[0].balance);
      const newTreasuryBalance = treasuryBalance + totalAmount;
      await client.query(
        `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE account_number = $2`,
        [newTreasuryBalance, SBC_TREASURY_ACCOUNT_NUMBER]
      );

      // 3. Create transaction records
      const outTxId = nanoid();
      await client.query(
        `INSERT INTO wallet_transactions 
         (id, wallet_user_id, type, amount, balance_before, balance_after, 
          related_user_id, related_phone, description, created_at)
         VALUES ($1, $2, 'transfer_out', $3, $4, $5, $6, $7, $8, NOW())`,
        [
          outTxId,
          auth.id,
          totalAmount,
          userBalance,
          newUserBalance,
          SBC_TREASURY_USER_ID,
          SBC_TREASURY_ACCOUNT_NUMBER,
          `Store purchase: ${products.map(p => p.slug).join(", ")}`,
        ]
      );

      const inTxId = nanoid();
      await client.query(
        `INSERT INTO wallet_transactions 
         (id, wallet_user_id, type, amount, balance_before, balance_after, 
          related_user_id, related_phone, description, created_at)
         VALUES ($1, $2, 'transfer_in', $3, $4, $5, $6, $7, $8, NOW())`,
        [
          inTxId,
          SBC_TREASURY_USER_ID,
          totalAmount,
          treasuryBalance,
          newTreasuryBalance,
          auth.id,
          wallet.accountNumber,
          `Store sale from ${auth.email || wallet.accountNumber}`,
        ]
      );

      return { outTxId, inTxId };
    });

    // Create order record
    const order = await createOrder({
      userId: auth.id,
      items: products.map((p) => ({
        productId: p.id,
        productSlug: p.slug,
        productName: p.name.en || p.name.ar,
        quantity: 1,
        unitPrice: p.price.amount,
        currency: p.price.currency,
      })),
      paymentMethod: "wallet",
      walletTransactionId: result.outTxId,
    });

    // Activate subscriptions for each product
    let activated = 0;
    for (const product of products) {
      await purchaseProgramSubscription({
        userId: auth.id,
        productId: product.id,
        productSlug: product.slug,
        program: product.program,
        durationDays: product.durationDays,
        paymentId: order.id,
        paymentMethod: "wallet",
        amount: product.price.amount,
        currency: product.price.currency,
      });
      activated += 1;
    }

    // Refresh pages
    revalidatePath(`/en/dashboard`);
    revalidatePath(`/ar/dashboard`);
    revalidatePath(`/en/loyalty/manage`);
    revalidatePath(`/ar/loyalty/manage`);
    revalidatePath(`/en/store`);
    revalidatePath(`/ar/store`);

    // Send WhatsApp notification
    if (auth.phone && isWAHAEnabled()) {
      try {
        const productList = products
          .map((p) => `• ${ar ? (p.name.ar || p.name.en) : (p.name.en || p.name.ar)} - ${p.price.amount.toFixed(3)} OMR`)
          .join("\\n");
        
        const newBalance = (await getAvailableBalance(auth.id))?.availableBalance || 0;
        
        const message = ar 
          ? `✅ *عملية شراء ناجحة - SBC Store*

🧾 رقم الطلب: *${order.orderNumber}*

📦 المنتجات:
${productList}

💰 المجموع: *${totalAmount.toFixed(3)} OMR*
💳 طريقة الدفع: المحفظة
💵 الرصيد الجديد: *${newBalance.toFixed(3)} OMR*

🎉 تم تفعيل اشتراكك!

شكراً لتسوقك معنا

https://sbc.om`
          : `✅ *Purchase Successful - SBC Store*

🧾 Order Number: *${order.orderNumber}*

📦 Products:
${productList}

💰 Total: *${totalAmount.toFixed(3)} OMR*
💳 Payment Method: Wallet
💵 New Balance: *${newBalance.toFixed(3)} OMR*

🎉 Your subscription is now active!

Thank you for your purchase

https://sbc.om`;

        await sendText({
          chatId: formatChatId(auth.phone),
          text: message,
        });
      } catch (wahaError) {
        console.error("[Checkout] WhatsApp notification failed:", wahaError);
        // Don't fail the checkout if WhatsApp fails
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      activated,
      total: totalAmount,
      currency,
      newBalance: (await getAvailableBalance(auth.id))?.availableBalance || 0,
    });

  } catch (e) {
    console.error("[Checkout] Error:", e);
    const message = e instanceof Error ? e.message : "CHECKOUT_FAILED";
    
    // Return user-friendly error messages
    const errorMessages: Record<string, string> = {
      WALLET_NOT_FOUND: "Wallet not found. Please contact support.",
      INSUFFICIENT_BALANCE: "Insufficient wallet balance.",
      TREASURY_NOT_FOUND: "System error. Please try again later.",
    };

    return NextResponse.json(
      { ok: false, error: errorMessages[message] || message },
      { status: 400 }
    );
  }
}
