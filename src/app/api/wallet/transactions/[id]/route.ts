import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getWalletTransactionDetail } from "@/lib/db/wallet";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "TRANSACTION_ID_REQUIRED" }, { status: 400 });
    }

    const detail = await getWalletTransactionDetail(user.id, id);
    if (!detail) {
      return NextResponse.json({ ok: false, error: "TRANSACTION_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, transaction: detail });
  } catch (error) {
    console.error("Wallet transaction detail error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}
