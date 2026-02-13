"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { LoyaltyCardTemplate } from "@/lib/db/types";
import { useToast } from "@/components/ui/Toast";

interface Props {
  locale: Locale;
  templates: LoyaltyCardTemplate[];
  businessName: string;
}

export function TemplateListClient({ locale, templates, businessName }: Props) {
  const ar = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (templateId: string) => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا القالب؟" : "Are you sure you want to delete this template?")) {
      return;
    }

    setDeleting(templateId);
    try {
      const res = await fetch(`/api/loyalty/templates/${templateId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ message: data.error || "Failed to delete template", variant: "error" });
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast({ message: ar ? "حدث خطأ أثناء الحذف" : "Error deleting template", variant: "error" });
    } finally {
      setDeleting(null);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="mt-8 sbc-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-semibold">
          {ar ? "لا توجد قوالب بعد" : "No templates yet"}
        </h3>
        <p className="mt-2 text-sm text-(--muted-foreground) max-w-md mx-auto">
          {ar
            ? "قم بإنشاء قالب بطاقة ولاء لتبدأ في إصدار البطاقات لعملائك"
            : "Create a loyalty card template to start issuing cards to your customers"}
        </p>
        <Link
          href={`/${locale}/loyalty/manage/templates/new`}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground hover:opacity-90 transition"
        >
          {ar ? "إنشاء قالب جديد" : "Create New Template"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          locale={locale}
          businessName={businessName}
          deleting={deleting === template.id}
          onDelete={() => handleDelete(template.id)}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  locale,
  businessName,
  deleting,
  onDelete,
}: {
  template: LoyaltyCardTemplate;
  locale: Locale;
  businessName: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  const ar = locale === "ar";
  const design = template.design;

  const getBackground = () => {
    if (design.backgroundStyle === "gradient") {
      return `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;
    }
    return design.backgroundColor;
  };

  return (
    <div className="sbc-card rounded-2xl overflow-hidden">
      {/* Card Preview */}
      <div
        className="h-40 p-4 flex flex-col justify-between"
        style={{ background: getBackground() }}
      >
        <div className="flex justify-between items-start">
          <div>
            {design.showBusinessName && (
              <div className="text-sm font-semibold" style={{ color: design.textColor }}>
                {businessName}
              </div>
            )}
            <div className="text-xs opacity-70" style={{ color: design.textColor }}>
              {template.passContent.programName}
            </div>
          </div>
          {template.isDefault && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: design.textColor, color: design.backgroundColor }}
            >
              {ar ? "افتراضي" : "Default"}
            </span>
          )}
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold" style={{ color: design.textColor }}>
              125
            </div>
            <div className="text-xs opacity-70" style={{ color: design.textColor }}>
              {template.passContent.pointsLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70" style={{ color: design.textColor }}>
              {template.passContent.secondaryLabel || "Status"}
            </div>
            <div className="text-sm font-medium" style={{ color: design.textColor }}>
              {template.passContent.secondaryValue || "Active"}
            </div>
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{template.name}</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-(--surface-border) text-(--muted-foreground)">
            {template.barcode.format.toUpperCase()}
          </span>
        </div>
        <p className="mt-1 text-xs text-(--muted-foreground) line-clamp-2">
          {template.description || (ar ? "بدون وصف" : "No description")}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/${locale}/loyalty/manage/templates/${template.id}`}
            className="flex-1 h-9 flex items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition"
          >
            {ar ? "تعديل" : "Edit"}
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="h-9 px-3 rounded-lg border border-(--surface-border) text-sm font-medium text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
          >
            {deleting ? "..." : ar ? "حذف" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
