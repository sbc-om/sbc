"use client";

import { IoShareSocialOutline } from "react-icons/io5";

import { useToast } from "@/components/ui/Toast";
import type { Locale } from "@/lib/i18n/locales";

export function ShareActionButton({
  locale,
  path,
  title,
  text,
  className,
  ariaLabel,
}: {
  locale: Locale;
  path: string;
  title?: string;
  text?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        message: locale === "ar" ? "تم نسخ الرابط" : "Link copied",
        variant: "success",
        icon: "share",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        message: locale === "ar" ? "تعذر النسخ" : "Copy failed",
        variant: "error",
        icon: "share",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={ariaLabel ?? (locale === "ar" ? "مشاركة" : "Share")}
      className={className}
    >
      <IoShareSocialOutline className="h-5 w-5" />
    </button>
  );
}
