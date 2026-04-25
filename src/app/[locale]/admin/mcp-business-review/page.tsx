import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getMcpSecurityConfig } from "@/lib/mcp/security";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { McpBusinessReviewAdminClient } from "./McpBusinessReviewAdminClient";

export const runtime = "nodejs";

export default async function AdminMcpBusinessReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const security = getMcpSecurityConfig();

  return (
    <AppPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "ar" ? "لوحة اختبار MCP" : "MCP Test Console"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "اختبر أدوات MCP العامة وراجع حالة الأمان والجاهزية من داخل لوحة الإدارة."
              : "Test the public MCP tools and inspect readiness and security from the admin area."}
          </p>
        </div>

        <McpBusinessReviewAdminClient
          locale={locale as Locale}
          publicEndpoint={`${baseUrl}/api/mcp/business-review`}
          infoEndpoint={`${baseUrl}/api/mcp/business-review/info`}
          authRequired={security.authRequired}
          authConfigured={security.authConfigured}
          rateLimit={{
            maxRequests: security.rateLimitMax,
            windowMs: security.rateLimitWindowMs,
          }}
        />
      </div>
    </AppPage>
  );
}