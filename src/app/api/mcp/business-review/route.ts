import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest, NextResponse } from "next/server";

import { createBusinessReviewMcpServer } from "@/lib/mcp/businessReviewServer";
import { checkMcpRateLimit, getMcpSecurityConfig, isAuthorizedMcpRequest } from "@/lib/mcp/security";

export const runtime = "nodejs";

const mcpCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version, Retry-After, X-RateLimit-Remaining, X-RateLimit-Reset",
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(mcpCorsHeaders)) {
    headers.set(key, value);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleMcpRequest(request: NextRequest) {
  const auth = isAuthorizedMcpRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status, headers: mcpCorsHeaders }
    );
  }

  const rateLimit = await checkMcpRateLimit(request);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: rateLimit.error },
      {
        status: rateLimit.status,
        headers: {
          ...mcpCorsHeaders,
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  const server = createBusinessReviewMcpServer();

  await server.connect(transport);
  const response = await transport.handleRequest(request);
  const wrapped = withCors(response);
  wrapped.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  wrapped.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
  return wrapped;
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function OPTIONS() {
  const security = getMcpSecurityConfig();
  return NextResponse.json(
    {
      ok: true,
      authRequired: security.authRequired,
    },
    {
    status: 204,
    headers: mcpCorsHeaders,
    }
  );
}