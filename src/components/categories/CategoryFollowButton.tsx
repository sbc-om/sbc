"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HiCheck, HiPlus } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { followCategoryAction, unfollowCategoryAction } from "@/app/[locale]/categories/actions";

type CategoryFollowButtonProps = {
  locale: Locale;
  categoryId: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
};

export function CategoryFollowButton({
  locale,
  categoryId,
  initialFollowing,
  size = "sm",
}: CategoryFollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const labels = useMemo(() => {
    const ar = locale === "ar";
    return {
      follow: ar ? "متابعة" : "Follow",
      following: ar ? "متابَع" : "Following",
      pending: ar ? "جاري..." : "Saving...",
    };
  }, [locale]);

  const onToggle = () => {
    if (isPending) return;

    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);

    startTransition(async () => {
      try {
        if (nextFollowing) {
          await followCategoryAction(locale, categoryId);
        } else {
          await unfollowCategoryAction(locale, categoryId);
        }
        router.refresh();
      } catch {
        setIsFollowing(!nextFollowing);
      }
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "secondary" : "primary"}
      onClick={onToggle}
      disabled={isPending}
      className="min-w-[110px] rounded-full"
      aria-live="polite"
    >
      {isPending ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isFollowing ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <HiCheck className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
          <HiPlus className="h-3.5 w-3.5" />
        </span>
      )}

      <span>{isPending ? labels.pending : isFollowing ? labels.following : labels.follow}</span>
    </Button>
  );
}
