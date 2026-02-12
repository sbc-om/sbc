import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/lib/i18n/locales";
import { requireAgent } from "@/lib/auth/requireUser";
import { getAgentByUserId } from "@/lib/db/agents";
import { AgentSidebar } from "@/components/agent/AgentSidebar";

export const runtime = "nodejs";

const texts = {
  en: {
    title: "Agent Account Not Activated",
    message: "Your account has the agent role, but your agent profile has not been set up yet. Please contact the administrator to activate your agent panel.",
    back: "Back to Dashboard",
  },
  ar: {
    title: "حساب الوكيل غير مفعّل",
    message: "حسابك يحمل صلاحية وكيل، لكن لم يتم إعداد ملفك كوكيل بعد. يرجى التواصل مع المسؤول لتفعيل لوحة الوكيل.",
    back: "العودة للوحة التحكم",
  },
};

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Ensure only agents/admins can access
  const user = await requireAgent(locale as Locale);

  // Admins always pass through; agents must have a record in the agents table
  const agent = await getAgentByUserId(user.id);
  if (!agent && user.role !== "admin") {
    const t = texts[locale as Locale];
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950/30">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">{t.title}</h2>
          <p className="text-sm text-amber-700 dark:text-amber-300">{t.message}</p>
          <a
            href={`/${locale}/dashboard`}
            className="inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            {t.back}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      {/* Agent-specific sidebar — desktop only */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-e border-(--surface-border) bg-(--surface)">
        <AgentSidebar locale={locale as Locale} />
      </aside>

      {/* Mobile agent nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 border-b border-(--surface-border) bg-(--surface)/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-(--surface)/60">
        <AgentSidebar locale={locale as Locale} mobile />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
}
