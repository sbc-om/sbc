import Link from "next/link";

import { AgentBuilder } from "@/components/ai/agent-builder/AgentBuilder";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByOwnerId } from "@/lib/db/businesses";
import { isLocale } from "@/lib/i18n/locales";

export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getBusinessByOwnerId(user.id);

  if (!business) {
    return (
      <div className="h-screen overflow-hidden bg-(--background) pb-20 lg:pb-0">
        <div className="flex h-full items-center justify-center p-4">
          <div className="sbc-card w-full max-w-xl rounded-2xl p-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "AI Agent Builder" : "AI Agent Builder"}
            </h1>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "لا يمكن إنشاء وكيل قبل ربط حسابك بنشاط تجاري."
                : "You need a business profile before creating your AI agent."}
            </p>
            <div className="mt-4">
              <Link href={`/${locale}/business-request`} className={buttonVariants({ size: "sm" })}>
                {locale === "ar" ? "إنشاء نشاط تجاري" : "Create Business"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const businessName = locale === "ar" ? business.name.ar : business.name.en;

  return (
    <div className="h-screen overflow-hidden bg-(--background) pb-20 lg:pb-0">
      <AgentBuilder locale={locale} businessName={businessName} />
    </div>
  );
}