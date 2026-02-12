import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getAgentByUserId,
  getAgentStats,
  listAgentClients,
  listAgentCommissions,
  addAgentClient,
  isAgentClient,
  createCommission,
} from "@/lib/db/agents";
import { query } from "@/lib/db/postgres";
import { ensureWallet, depositToWallet, getAvailableBalance, withdrawFromWallet } from "@/lib/db/wallet";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";

export const runtime = "nodejs";

function isAgentOrAdmin(user: any) {
  return user && (user.role === "agent" || user.role === "admin");
}

/** GET /api/agent — get agent dashboard data */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAgentOrAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const agentId = user.id;
  const agent = await getAgentByUserId(agentId);
  if (!agent) {
    return NextResponse.json({ ok: false, error: "NOT_AGENT" }, { status: 403 });
  }

  const [stats, clients, commissions] = await Promise.all([
    getAgentStats(agentId),
    listAgentClients(agentId),
    listAgentCommissions(agentId),
  ]);

  return NextResponse.json({ ok: true, agent, stats, clients, commissions });
}

/** POST /api/agent — agent actions */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAgentOrAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const agentId = user.id;
  const agent = await getAgentByUserId(agentId);
  if (!agent || !agent.isActive) {
    return NextResponse.json({ ok: false, error: "AGENT_INACTIVE" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // ── Create a new client account ──
    if (action === "create-client") {
      const { email, phone, fullName, password } = body;
      if (!phone || !fullName || !password) {
        return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
      }

      // Check if user already exists
      const normalizedPhone = phone.replace(/\D/g, "");
      const existingClauses = [`phone = $1`];
      const existingParams: string[] = [normalizedPhone];
      if (email) {
        existingClauses.push(`email = $2`);
        existingParams.push(email);
      }
      const existing = await query(
        `SELECT id FROM users WHERE ${existingClauses.join(" OR ")}`,
        existingParams
      );
      if (existing.rows.length > 0) {
        return NextResponse.json({ ok: false, error: "USER_EXISTS" }, { status: 409 });
      }

      // Hash password
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(password, 10);
      const { nanoid } = await import("nanoid");
      const id = nanoid();

      // Create user
      await query(
        `INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, display_name, approval_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'user', true, $4, 'approved', NOW(), NOW())`,
        [id, email || null, normalizedPhone, fullName, passwordHash]
      );

      // Ensure wallet for new user
      await ensureWallet(id, normalizedPhone);

      // Link as agent's client
      await addAgentClient(agentId, id);

      return NextResponse.json({ ok: true, clientId: id });
    }

    // ── Add existing user as client ──
    if (action === "add-client") {
      const { clientId } = body;
      if (!clientId) {
        return NextResponse.json({ ok: false, error: "CLIENT_ID_REQUIRED" }, { status: 400 });
      }
      const userCheck = await query(`SELECT id FROM users WHERE id = $1`, [clientId]);
      if (userCheck.rows.length === 0) {
        return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
      }
      await addAgentClient(agentId, clientId);
      return NextResponse.json({ ok: true });
    }

    // ── Search user by phone or email ──
    if (action === "search-user") {
      const { q } = body;
      if (!q || q.length < 3) {
        return NextResponse.json({ ok: false, error: "QUERY_TOO_SHORT" }, { status: 400 });
      }
      const result = await query(
        `SELECT id, email, phone, COALESCE(display_name, email) as name, avatar_url
         FROM users
         WHERE (email ILIKE $1 OR phone ILIKE $1 OR display_name ILIKE $1)
           AND role = 'user'
         LIMIT 10`,
        [`%${q}%`]
      );
      return NextResponse.json({
        ok: true,
        users: result.rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          phone: r.phone,
          name: r.name,
          avatarUrl: r.avatar_url,
        })),
      });
    }

    // ── Transfer funds to client wallet ──
    if (action === "transfer-to-client") {
      const { clientId, amount } = body;
      if (!clientId || !amount || amount <= 0) {
        return NextResponse.json({ ok: false, error: "INVALID_PARAMS" }, { status: 400 });
      }

      // Verify this is our client
      const isClient = await isAgentClient(agentId, clientId);
      if (!isClient) {
        return NextResponse.json({ ok: false, error: "NOT_YOUR_CLIENT" }, { status: 403 });
      }

      // Check agent wallet balance
      const agentBalanceInfo = await getAvailableBalance(agentId);
      if (!agentBalanceInfo || agentBalanceInfo.availableBalance < amount) {
        return NextResponse.json({ ok: false, error: "INSUFFICIENT_BALANCE" }, { status: 400 });
      }

      // Get client phone for wallet
      const clientRes = await query(`SELECT phone, COALESCE(display_name, email) as name FROM users WHERE id = $1`, [clientId]);
      const clientPhone = clientRes.rows[0]?.phone;
      const clientName = clientRes.rows[0]?.name || "";
      if (!clientPhone) {
        return NextResponse.json({ ok: false, error: "CLIENT_NO_PHONE" }, { status: 400 });
      }

      // Ensure client wallet exists
      await ensureWallet(clientId, clientPhone);

      // Withdraw from agent
      await withdrawFromWallet(agentId, amount, `Transfer to client: ${clientName}`);
      // Deposit to client
      await depositToWallet(clientId, amount, `Deposit from agent: ${user.displayName}`);

      // Notify client via WhatsApp
      if (clientPhone && isWAHAEnabled()) {
        try {
          await sendText({
            chatId: formatChatId(clientPhone),
            text: `${amount} OMR has been added to your wallet by ${user.displayName}.`,
          });
        } catch (err) {
          console.error("[Agent] WhatsApp transfer notification failed:", err);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ── Purchase subscription for client ──
    if (action === "purchase-for-client") {
      const { clientId, productSlug } = body;
      if (!clientId || !productSlug) {
        return NextResponse.json({ ok: false, error: "MISSING_PARAMS" }, { status: 400 });
      }

      // Verify this is our client
      const isClient = await isAgentClient(agentId, clientId);
      if (!isClient) {
        return NextResponse.json({ ok: false, error: "NOT_YOUR_CLIENT" }, { status: 403 });
      }

      // Fetch product
      const { getStoreProductBySlug } = await import("@/lib/store/products");
      const product = await getStoreProductBySlug(productSlug);
      if (!product) {
        return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND" }, { status: 404 });
      }

      // Check client wallet balance
      const clientBalanceInfo = await getAvailableBalance(clientId);
      if (!clientBalanceInfo || clientBalanceInfo.availableBalance < product.price.amount) {
        return NextResponse.json({ ok: false, error: "CLIENT_INSUFFICIENT_BALANCE" }, { status: 400 });
      }

      // Deduct from client wallet → SBC Treasury
      await withdrawFromWallet(clientId, product.price.amount, `Subscription: ${product.slug}`);

      const treasuryExists = await query(`SELECT user_id FROM wallets WHERE user_id = 'sbc-treasury'`, []);
      if (treasuryExists.rows.length > 0) {
        await depositToWallet("sbc-treasury", product.price.amount, `Subscription from client via agent: ${productSlug}`);
      }

      // Create subscription
      const sub = await purchaseProgramSubscription({
        userId: clientId,
        productId: product.id,
        productSlug: product.slug,
        program: product.program,
        durationDays: product.durationDays,
        amount: product.price.amount,
        currency: product.price.currency,
        paymentMethod: "wallet",
      });

      // Record agent commission
      if (agent.commissionRate > 0) {
        await createCommission({
          agentUserId: agentId,
          clientUserId: clientId,
          subscriptionId: sub.id,
          amount: product.price.amount,
          commissionRate: agent.commissionRate,
        });
      }

      return NextResponse.json({ ok: true, subscription: sub });
    }

    return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (e: any) {
    console.error("[Agent API]", e);
    return NextResponse.json(
      { ok: false, error: e.message || "ACTION_FAILED" },
      { status: 400 }
    );
  }
}
