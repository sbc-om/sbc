"use client";

import { useState, useTransition } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { BusinessComment } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { IoHeart, IoHeartOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useBusinessEngagementRealtime } from "@/lib/hooks/useBusinessEngagementRealtime";
import {
  approveBusinessCommentAction,
  createBusinessCommentAction,
  deleteBusinessCommentAction,
  rejectBusinessCommentAction,
  toggleBusinessLikeAction,
} from "@/app/[locale]/explorer/[slug]/actions";

function fmtTime(iso: string, locale: Locale) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BusinessEngagement({
  locale,
  businessId,
  businessSlug,
  currentUserId,
  canModerate,
  initialLikeCount,
  initialLiked,
  approvedComments,
  myPendingComments,
  pendingForModeration,
  usersById,
}: {
  locale: Locale;
  businessId: string;
  businessSlug: string;
  currentUserId: string;
  canModerate: boolean;
  initialLikeCount: number;
  initialLiked: boolean;
  approvedComments: BusinessComment[];
  myPendingComments: BusinessComment[];
  pendingForModeration: BusinessComment[];
  usersById: Record<string, { displayName?: string; email?: string } | undefined>;
}) {
  const [isPending, startTransition] = useTransition();

  const [liked, setLiked] = useState(initialLiked);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [localMyPending, setLocalMyPending] = useState<BusinessComment[]>(myPendingComments);
  const [localApproved, setLocalApproved] = useState<BusinessComment[]>(approvedComments);
  const [localModerationQueue, setLocalModerationQueue] = useState<BusinessComment[]>(pendingForModeration);

  const liveCounts = useBusinessEngagementRealtime(businessId, {
    likes: initialLikeCount,
    comments: approvedComments.length,
  });

  const t = {
    title: locale === "ar" ? "التعليقات والتقييم" : "Comments & Reviews",
    like: locale === "ar" ? "إعجاب" : "Like",
    liked: locale === "ar" ? "تم الإعجاب" : "Liked",
    comments: locale === "ar" ? "التعليقات" : "Comments",
    write: locale === "ar" ? "اكتب تعليقاً..." : "Write a comment…",
    post: locale === "ar" ? "إرسال" : "Post",
    pendingHint:
      locale === "ar"
        ? "تعليقك سيظهر بعد موافقة صاحب النشاط."
        : "Your comment will be visible after the business approves it.",
    pendingTitle: locale === "ar" ? "تعليقاتك قيد المراجعة" : "Your pending comments",
    moderationTitle: locale === "ar" ? "إدارة التعليقات" : "Comment moderation",
    approve: locale === "ar" ? "موافقة" : "Approve",
    reject: locale === "ar" ? "رفض" : "Reject",
    remove: locale === "ar" ? "حذف" : "Delete",
    empty: locale === "ar" ? "لا توجد تعليقات بعد." : "No comments yet.",
    pendingEmpty: locale === "ar" ? "لا توجد تعليقات قيد المراجعة." : "No pending comments.",
  };

  function userLabel(userId: string) {
    const u = usersById[userId];
    return u?.displayName || u?.email || (locale === "ar" ? "مستخدم" : "User");
  }

  const onToggleLike = () => {
    setLikeAnimating(true);
    window.setTimeout(() => setLikeAnimating(false), 380);

    startTransition(async () => {
      try {
        const r = await toggleBusinessLikeAction(locale, businessId, businessSlug);
        setLiked(r.liked);
      } catch {
        // noop (could toast)
      }
    });
  };

  const onPostComment = () => {
    const text = commentText.trim();
    if (!text) return;

    startTransition(async () => {
      try {
        const c = await createBusinessCommentAction(locale, businessId, businessSlug, text);
        setCommentText("");
        if (c.userId === currentUserId && c.status === "pending") {
          setLocalMyPending((prev) => [...prev, c]);
        }
        if (canModerate && c.status === "pending") {
          setLocalModerationQueue((prev) => [...prev, c]);
        }
      } catch {
        // noop
      }
    });
  };

  const onModerate = (commentId: string, action: "approve" | "reject" | "delete") => {
    startTransition(async () => {
      try {
        if (action === "approve") {
          const updated = await approveBusinessCommentAction(locale, businessId, businessSlug, commentId);
          setLocalModerationQueue((prev) => prev.filter((c) => c.id !== commentId));
          setLocalApproved((prev) => [...prev, updated].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)));
          setLocalMyPending((prev) => prev.filter((c) => c.id !== commentId));
        } else if (action === "reject") {
          await rejectBusinessCommentAction(locale, businessId, businessSlug, commentId);
          setLocalModerationQueue((prev) => prev.filter((c) => c.id !== commentId));
          setLocalMyPending((prev) => prev.filter((c) => c.id !== commentId));
        } else {
          await deleteBusinessCommentAction(locale, businessId, businessSlug, commentId);
          setLocalModerationQueue((prev) => prev.filter((c) => c.id !== commentId));
          setLocalMyPending((prev) => prev.filter((c) => c.id !== commentId));
          setLocalApproved((prev) => prev.filter((c) => c.id !== commentId));
        }
      } catch {
        // noop
      }
    });
  };

  return (
    <section className="sbc-card rounded-2xl p-6 md:p-7">
      <div className="flex items-center justify-between gap-3 border-b border-(--surface-border) pb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-(--chip-bg) border border-(--surface-border)">
              <IoChatbubbleEllipsesOutline className="h-3.5 w-3.5" />
            </span>
            {t.comments}: {Math.max(liveCounts.comments, localApproved.length)}
          </h2>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={onToggleLike}
          className={`group relative isolate inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:opacity-60 motion-reduce:transition-none ${
            liked
              ? "border-red-500/35 bg-red-500/10 text-red-500 hover:shadow-red-500/20"
              : "border-(--surface-border) bg-(--chip-bg) text-(--muted-foreground) hover:text-foreground hover:shadow-[var(--shadow)]"
          }`}
          aria-label={liked ? t.liked : t.like}
        >
          <span className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${liked ? "bg-red-500/15" : "bg-(--surface)"}`}>
            {likeAnimating ? (
              <>
                <span className="pointer-events-none absolute inset-0 rounded-full bg-red-500/20 motion-safe:animate-ping" aria-hidden />
                <span className="pointer-events-none absolute -inset-0.5 rounded-full border border-red-500/30 motion-safe:animate-ping" aria-hidden />
              </>
            ) : null}
            {liked ? (
              <IoHeart className={`relative z-10 h-3.5 w-3.5 text-red-500 ${likeAnimating ? "motion-safe:animate-[pulse_260ms_ease-out_1]" : ""}`} />
            ) : (
              <IoHeartOutline className="relative z-10 h-3.5 w-3.5" />
            )}
          </span>

          <span className="font-medium truncate">{liked ? t.liked : t.like}</span>
          <span className={`rounded-full px-1.5 py-px text-xs font-semibold tabular-nums ${liked ? "bg-red-500/15 text-red-500" : "bg-(--surface) text-(--muted-foreground)"}`}>
            {liveCounts.likes}
          </span>
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t.write}
          disabled={isPending}
          className="min-h-28 rounded-2xl border-(--surface-border) bg-(--background) focus:border-(--accent)"
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-(--surface-border) bg-(--chip-bg) px-3 py-2.5">
          <div className="text-xs text-(--muted-foreground)">{t.pendingHint}</div>
          <Button variant="primary" size="sm" disabled={isPending || !commentText.trim()} onClick={onPostComment} className="min-w-20">
            {t.post}
          </Button>
        </div>
      </div>

      {localMyPending.length > 0 ? (
        <div className="mt-8">
          <div className="text-sm font-semibold">{t.pendingTitle}</div>
          <div className="mt-3 grid gap-3">
            {localMyPending.map((c) => (
              <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--chip-bg) p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-(--muted-foreground)">
                    {fmtTime(c.createdAt, locale)}
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    {locale === "ar" ? "قيد المراجعة" : "Pending"}
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="text-sm font-semibold">{t.comments}</div>
        {localApproved.length === 0 ? (
          <div className="mt-3 text-sm text-(--muted-foreground)">{t.empty}</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {localApproved.map((c) => (
              <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold truncate">{userLabel(c.userId)}</div>
                  <div className="text-xs text-(--muted-foreground)">{fmtTime(c.createdAt, locale)}</div>
                </div>
                <div className="mt-2 text-sm leading-6">{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canModerate ? (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">{t.moderationTitle}</div>
            <div className="text-xs text-(--muted-foreground)">
              {localModerationQueue.length} {locale === "ar" ? "معلق" : "pending"}
            </div>
          </div>

          {localModerationQueue.length === 0 ? (
            <div className="mt-3 text-sm text-(--muted-foreground)">{t.pendingEmpty}</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {localModerationQueue.map((c) => (
                <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4 shadow-[var(--shadow)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{userLabel(c.userId)}</div>
                      <div className="mt-1 text-xs text-(--muted-foreground)">{fmtTime(c.createdAt, locale)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="xs" variant="secondary" disabled={isPending} onClick={() => onModerate(c.id, "reject")}>
                        {t.reject}
                      </Button>
                      <Button size="xs" variant="primary" disabled={isPending} onClick={() => onModerate(c.id, "approve")}>
                        {t.approve}
                      </Button>
                      <Button size="xs" variant="destructive" disabled={isPending} onClick={() => onModerate(c.id, "delete")}>
                        {t.remove}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 text-sm leading-6">{c.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

    </section>
  );
}
