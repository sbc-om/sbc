import type { NextRequest } from "next/server";
import { query } from "@/lib/db/postgres";

type RateLimitRow = {
  count: number;
  reset_at_ms: string | number;
};

export function getMcpSecurityConfig() {
  const apiKey = process.env.MCP_BUSINESS_REVIEW_API_KEY?.trim() || "";
  const requireApiKey = process.env.MCP_BUSINESS_REVIEW_REQUIRE_API_KEY === "true";
  const rateLimitWindowMs = Number.parseInt(process.env.MCP_BUSINESS_REVIEW_RATE_LIMIT_WINDOW_MS || "60000", 10);
  const rateLimitMax = Number.parseInt(process.env.MCP_BUSINESS_REVIEW_RATE_LIMIT_MAX || "60", 10);

  return {
    apiKey,
    requireApiKey,
    authConfigured: apiKey.length > 0,
    authRequired: requireApiKey && apiKey.length > 0,
    rateLimitWindowMs: Number.isFinite(rateLimitWindowMs) ? rateLimitWindowMs : 60000,
    rateLimitMax: Number.isFinite(rateLimitMax) ? rateLimitMax : 60,
  };
}

export function isAuthorizedMcpRequest(request: NextRequest) {
  const config = getMcpSecurityConfig();
  if (!config.authRequired) {
    return { ok: true as const };
  }

  const headerKey = request.headers.get("x-api-key")?.trim();
  const authHeader = request.headers.get("authorization")?.trim();
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const providedKey = headerKey || bearerKey;

  if (!providedKey || providedKey !== config.apiKey) {
    return {
      ok: false as const,
      status: 401,
      error: "UNAUTHORIZED_MCP_REQUEST",
    };
  }

  return { ok: true as const };
}

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const apiKey = request.headers.get("x-api-key")?.trim();
  return forwardedFor || realIp || apiKey || "anonymous";
}

export async function checkMcpRateLimit(request: NextRequest) {
  const config = getMcpSecurityConfig();
  const key = getClientIdentifier(request);
  const now = Date.now();
  const resetAt = now + config.rateLimitWindowMs;

  if (Math.random() < 0.02) {
    await query(
      `DELETE FROM mcp_rate_limits WHERE reset_at < NOW() - INTERVAL '1 hour'`
    );
  }

  const result = await query<RateLimitRow>(
    `INSERT INTO mcp_rate_limits (scope, client_key, count, reset_at, created_at, updated_at)
     VALUES ($1, $2, 1, to_timestamp($3 / 1000.0), NOW(), NOW())
     ON CONFLICT (scope, client_key)
     DO UPDATE SET
       count = CASE
         WHEN mcp_rate_limits.reset_at <= NOW() THEN 1
         ELSE mcp_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN mcp_rate_limits.reset_at <= NOW() THEN to_timestamp($3 / 1000.0)
         ELSE mcp_rate_limits.reset_at
       END,
       updated_at = NOW()
     RETURNING count, FLOOR(EXTRACT(EPOCH FROM reset_at) * 1000) AS reset_at_ms`,
    ["business-review", key, resetAt]
  );

  const current = result.rows[0];
  const currentCount = Number(current?.count ?? 1);
  const currentResetAt = Number(current?.reset_at_ms ?? resetAt);

  if (currentCount > config.rateLimitMax) {
    return {
      ok: false as const,
      status: 429,
      error: "MCP_RATE_LIMITED",
      retryAfterSeconds: Math.max(1, Math.ceil((currentResetAt - now) / 1000)),
      resetAt: currentResetAt,
      remaining: 0,
    };
  }

  return {
    ok: true as const,
    remaining: Math.max(0, config.rateLimitMax - currentCount),
    resetAt: currentResetAt,
  };
}