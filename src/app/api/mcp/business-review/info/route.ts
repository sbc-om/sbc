import { NextResponse } from "next/server";

import { query } from "@/lib/db/postgres";
import { getMcpSecurityConfig } from "@/lib/mcp/security";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const security = getMcpSecurityConfig();
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await query("SELECT 1");
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const endpoint = `${baseUrl}/api/mcp/business-review`;

  return NextResponse.json(
    {
      ok: database === "connected",
      name: "sbc-business-review",
      transport: "streamable-http",
      endpoint,
      healthEndpoint: `${baseUrl}/api/mcp/business-review/info`,
      capabilities: [
        "list_member_businesses",
        "get_member_business",
        "review_member_businesses",
      ],
      authRequired: security.authRequired,
      authConfigured: security.authConfigured,
      rateLimit: {
        storage: "postgres",
        maxRequests: security.rateLimitMax,
        windowMs: security.rateLimitWindowMs,
      },
      database,
      aiReviewConfigured: Boolean(process.env.OPENAI_API_KEY),
      timestamp,
      uptime: process.uptime(),
    },
    { status: database === "connected" ? 200 : 503 }
  );
}