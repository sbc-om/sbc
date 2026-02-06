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
}

export function NewTemplateClient({ locale, profile }: Props) {
  const ar = locale === "ar";
  const router = useRouter();

  const handleSave = async (templateData: Partial<LoyaltyCardTemplate>) => {
    const res = await fetch("/api/loyalty/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create template");
    }

    router.push(`/${locale}/loyalty/manage/templates`);
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
              {ar ? "إنشاء قالب جديد" : "Create New Template"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "صمم بطاقة ولاء جديدة وشاهد المعاينة مباشرة على iOS و Android"
                : "Design a new loyalty card and preview it live on iOS and Android"}
            </p>
          </div>
          <Link
            href={`/${locale}/loyalty/manage/templates`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "إلغاء" : "Cancel"}
          </Link>
        </div>
      </div>

      <div className="mt-8 sbc-card rounded-2xl p-6">
        <CardTemplateDesigner
          locale={locale}
          profile={profile}
          template={null}
          onSave={handleSave}
          isNew={true}
        />
      </div>
    </>
  );
}
