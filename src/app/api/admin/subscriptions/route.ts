import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  listAllSubscriptionsWithUsers,
  getProgramSubscriptionById,
  updateProgramSubscription,
  cancelProgramSubscription,
  extendProgramSubscription,
} from "@/lib/db/subscriptions";
import { query } from "@/lib/db/postgres";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";

export const runtime = "nodejs";

function isAdmin(user: any) {
  return user && user.role === "admin";
}

/* ── Helpers ── */
async function getUserPhone(userId: string): Promise<string> {
  const res = await query(`SELECT phone FROM users WHERE id = $1`, [userId]);
  return res.rows[0]?.phone || "";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-OM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function notifyUser(phone: string, text: string) {
  if (!phone || !isWAHAEnabled()) return;
  try {
    await sendText({ chatId: formatChatId(phone), text });
  } catch (err) {
    console.error("[Admin Subscriptions] WhatsApp notification failed:", err);
  }
}

function buildInvoiceText(sub: any, userName: string, locale: string) {
  const ar = locale === "ar";
  if (ar) {
    return [
      `🧾 فاتورة اشتراك`,
      ``,
      `👤 الاسم: ${userName}`,
      `📦 البرنامج: ${sub.program}`,
      `📋 الباقة: ${sub.plan || sub.productSlug}`,
      `💰 المبلغ: ${sub.amount} ${sub.currency}`,
      `📅 من: ${fmtDate(sub.startDate)}`,
      `📅 إلى: ${fmtDate(sub.endDate)}`,
      `✅ الحالة: ${sub.isActive ? "نشط" : "غير نشط"}`,
      ``,
      `🔖 رقم الدفع: ${sub.paymentId || "—"}`,
      `💳 طريقة الدفع: ${sub.paymentMethod || "—"}`,
      ``,
      `شكراً لاشتراككم في SBC! 🙏`,
    ].join("\n");
  }
  return [
    `🧾 Subscription Invoice`,
    ``,
    `👤 Name: ${userName}`,
    `📦 Program: ${sub.program}`,
    `📋 Plan: ${sub.plan || sub.productSlug}`,
    `💰 Amount: ${sub.amount} ${sub.currency}`,
    `📅 From: ${fmtDate(sub.startDate)}`,
    `📅 To: ${fmtDate(sub.endDate)}`,
    `✅ Status: ${sub.isActive ? "Active" : "Inactive"}`,
    ``,
    `🔖 Payment ID: ${sub.paymentId || "—"}`,
    `💳 Method: ${sub.paymentMethod || "—"}`,
    ``,
    `Thank you for subscribing to SBC! 🙏`,
  ].join("\n");
}

/** GET /api/admin/subscriptions — list all subscriptions */
export async function GET() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const subscriptions = await listAllSubscriptionsWithUsers();
  return NextResponse.json({ ok: true, subscriptions });
}

/** PATCH /api/admin/subscriptions — update a subscription */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
    }

    // Action: cancel
    if (action === "cancel") {
      const sub = await cancelProgramSubscription(id);
      // Notify user via WhatsApp
      const phone = await getUserPhone(sub.userId);
      const ar = body.locale === "ar";
      await notifyUser(
        phone,
        ar
          ? `❌ تم إلغاء اشتراكك في برنامج ${sub.program}.\nللاستفسار تواصل معنا.`
          : `❌ Your ${sub.program} subscription has been cancelled.\nContact us for any questions.`
      );
      return NextResponse.json({ ok: true, subscription: sub });
    }

    // Action: extend
    if (action === "extend" && updates.days) {
      const sub = await extendProgramSubscription(id, parseInt(updates.days, 10));
      // Notify user via WhatsApp
      const phone = await getUserPhone(sub.userId);
      const ar = body.locale === "ar";
      await notifyUser(
        phone,
        ar
          ? `✅ تم تمديد اشتراكك في برنامج ${sub.program} بمقدار ${updates.days} يوم.\n📅 تاريخ الانتهاء الجديد: ${fmtDate(sub.endDate)}`
          : `✅ Your ${sub.program} subscription has been extended by ${updates.days} days.\n📅 New end date: ${fmtDate(sub.endDate)}`
      );
      return NextResponse.json({ ok: true, subscription: sub });
    }

    // Action: activate
    if (action === "activate") {
      const sub = await updateProgramSubscription(id, { isActive: true });
      // Notify user via WhatsApp
      const phone = await getUserPhone(sub.userId);
      const ar = body.locale === "ar";
      await notifyUser(
        phone,
        ar
          ? `🎉 تم إعادة تفعيل اشتراكك في برنامج ${sub.program}.\n📅 صالح حتى: ${fmtDate(sub.endDate)}`
          : `🎉 Your ${sub.program} subscription has been reactivated.\n📅 Valid until: ${fmtDate(sub.endDate)}`
      );
      return NextResponse.json({ ok: true, subscription: sub });
    }

    // Action: send-invoice
    if (action === "send-invoice") {
      const subData = await getProgramSubscriptionById(id);
      if (!subData) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      const phone = await getUserPhone(subData.userId);
      if (!phone) {
        return NextResponse.json({ ok: false, error: "NO_PHONE" }, { status: 400 });
      }
      const userRes = await query(`SELECT COALESCE(display_name, email) as name FROM users WHERE id = $1`, [subData.userId]);
      const userName = userRes.rows[0]?.name || "";
      const invoiceText = buildInvoiceText(subData, userName, body.locale || "en");
      await notifyUser(phone, invoiceText);
      return NextResponse.json({ ok: true });
    }

    // General update
    const updatePayload: Record<string, any> = {};
    if (updates.program) updatePayload.program = updates.program;
    if (updates.plan) updatePayload.plan = updates.plan;
    if (updates.isActive !== undefined) updatePayload.isActive = updates.isActive;
    if (updates.endDate) updatePayload.endDate = new Date(updates.endDate);
    if (updates.amount !== undefined) updatePayload.amount = parseFloat(updates.amount);
    if (updates.currency) updatePayload.currency = updates.currency;

    const sub = await updateProgramSubscription(id, updatePayload);
    return NextResponse.json({ ok: true, subscription: sub });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "UPDATE_FAILED" },
      { status: 400 }
    );
  }
}
