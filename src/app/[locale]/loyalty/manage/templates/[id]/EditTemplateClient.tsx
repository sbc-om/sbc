"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import type { LoyaltyProfile, LoyaltyCardTemplate } from "@/lib/db/types";
import { CardTemplateDesigner } from "@/components/loyalty/CardTemplateDesigner";
import { buttonVariants } from "@/components/ui/Button";

interface Props {
  locale: Locale;
  profile: LoyaltyProfile | null;
  template: LoyaltyCardTemplate;
  issuedCount: number;
}

export function EditTemplateClient({ locale, profile, template, issuedCount }: Props) {
  const ar = locale === "ar";
  const router = useRouter();

  const handleSave = async (templateData: Partial<LoyaltyCardTemplate>) => {
    const res = await fetch(`/api/loyalty/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update template");
    }

    router.refresh();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-(--surface-border) bg-(--surface) p-7 sm:p-8">
        <div
          className="absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(900px circle at 20% 0%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px circle at 85% 10%, rgba(14,165,233,0.16), transparent 55%)",
          }}
        />

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {ar ? "تعديل القالب" : "Edit Template"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {template.name}
              {template.isDefault && (
                <span className="ms-2 text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  {ar ? "افتراضي" : "Default"}
                </span>
              )}
            </p>
            {issuedCount > 0 && (
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {ar
                  ? `${issuedCount} بطاقة مُصدرة تستخدم هذا القالب`
                  : `${issuedCount} issued card${issuedCount > 1 ? "s" : ""} using this template`}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/loyalty/manage/templates`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "العودة" : "Back"}
          </Link>
        </div>
      </div>

      {issuedCount > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <div className="font-medium text-amber-700 dark:text-amber-400">
                {ar ? "تحذير: القالب قيد الاستخدام" : "Warning: Template in use"}
              </div>
              <p className="mt-1 text-sm text-amber-600/80 dark:text-amber-400/80">
                {ar
                  ? "تغييرات التصميم ستظهر في البطاقات الجديدة فقط. البطاقات المُصدرة حالياً قد تحتاج إلى إعادة إصدار لتطبيق التغييرات."
                  : "Design changes will only appear in new cards. Existing issued cards may need to be re-issued to apply changes."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 sbc-card rounded-2xl p-6">
        <CardTemplateDesigner
          locale={locale}
          profile={profile}
          template={template}
          onSave={handleSave}
          isNew={false}
        />
      </div>
    </>
  );
}
