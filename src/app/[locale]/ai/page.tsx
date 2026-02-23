import Link from "next/link";

import { AgentBuilder } from "@/components/ai/agent-builder/AgentBuilder";
import { AgentListPage } from "@/components/ai/agent-builder/AgentListPage";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByOwnerId } from "@/lib/db/businesses";
import { listBusinessAiAgents, countBusinessAiAgents, PLAN_LIMITS } from "@/lib/db/businessAiAgents";
import { hasActiveSubscription, getUserActiveSubscriptionForProgram } from "@/lib/db/subscriptions";
import { isLocale } from "@/lib/i18n/locales";

export default async function AiPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ agent?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getBusinessByOwnerId(user.id);
  const ar = locale === "ar";

  if (!business) {
    return (
      <div className="h-screen overflow-hidden bg-(--background) pb-20 lg:pb-0">
        <div className="flex h-full items-center justify-center p-4">
          <div className="sbc-card w-full max-w-xl rounded-2xl p-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {ar ? "منشئ الوكيل الذكي" : "AI Agent Builder"}
            </h1>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "لا يمكن إنشاء وكيل قبل ربط حسابك بنشاط تجاري."
                : "You need a business profile before creating your AI agent."}
            </p>
            <div className="mt-4">
              <Link href={`/${locale}/business-request`} className={buttonVariants({ size: "sm" })}>
                {ar ? "إنشاء نشاط تجاري" : "Create Business"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check subscription
  const hasSub = await hasActiveSubscription(user.id, "agent-builder");

  if (!hasSub) {
    return (
      <div className="h-screen overflow-hidden bg-(--background) pb-20 lg:pb-0">
        <div className="flex h-full items-center justify-center p-4">
          <div className="sbc-card w-full max-w-xl rounded-2xl p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/12">
              <svg className="h-8 w-8 text-violet-600 dark:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h9a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0015.75 4.5h-9A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5z" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {ar ? "منشئ الوكيل الذكي" : "AI Agent Builder"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-(--muted-foreground)">
              {ar
                ? "أنشئ وكلاء ذكيين لنشاطك التجاري — يردون على العملاء، يعالجون الطلبات، ويوفرون الدعم تلقائياً."
                : "Build smart AI agents for your business — automate customer support, process orders, and handle inquiries."}
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/${locale}/store?q=agent-builder`} className={buttonVariants({ size: "sm" })}>
                {ar ? "اشترك الآن" : "Subscribe Now"}
              </Link>
              <Link href={`/${locale}/dashboard`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                {ar ? "لوحة التحكم" : "Dashboard"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine plan
  const sub = await getUserActiveSubscriptionForProgram(user.id, "agent-builder");
  const planSlug = sub?.productSlug ?? "starter";
  const planKey = (
    planSlug.includes("enterprise") ? "enterprise"
    : planSlug.includes("professional") ? "professional"
    : "starter"
  ) as keyof typeof PLAN_LIMITS;

  const agents = await listBusinessAiAgents(business.id);
  const agentCount = await countBusinessAiAgents(business.id);
  const limits = PLAN_LIMITS[planKey];

  const sp = await searchParams;
  const editingAgentId = sp.agent;

  // If editing a specific agent, show the builder
  if (editingAgentId) {
    const agent = agents.find((a) => a.id === editingAgentId);
    if (!agent) return null;

    return (
      <div className="h-screen overflow-hidden bg-(--background) pb-20 lg:pb-0">
        <AgentBuilder
          locale={locale}
          businessName={ar ? business.name.ar : business.name.en}
          agentId={agent.id}
          initialWorkflow={agent.workflow}
          initialName={agent.name}
          planKey={planKey}
          maxNodes={limits.maxNodes}
        />
      </div>
    );
  }

  // Show agent list
  const businessName = ar ? business.name.ar : business.name.en;

  return (
    <AgentListPage
      locale={locale}
      agents={agents}
      agentCount={agentCount}
      maxAgents={limits.maxAgents}
      planKey={planKey}
      businessName={businessName}
      businessId={business.id}
    />
  );
}