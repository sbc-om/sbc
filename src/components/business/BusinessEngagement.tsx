"use client";

import { useMemo, useState, useTransition } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { BusinessComment } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
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
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const [commentText, setCommentText] = useState("");
  const [localMyPending, setLocalMyPending] = useState<BusinessComment[]>(myPendingComments);
  const [localApproved, setLocalApproved] = useState<BusinessComment[]>(approvedComments);
  const [localModerationQueue, setLocalModerationQueue] = useState<BusinessComment[]>(pendingForModeration);

  const commentCount = useMemo(() => localApproved.length, [localApproved.length]);

  const t = {
    title: locale === "ar" ? "التفاعل" : "Engagement",
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
    startTransition(async () => {
      try {
        const r = await toggleBusinessLikeAction(locale, businessId, businessSlug);
        setLiked(r.liked);
        setLikeCount(r.count);
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
    <section className="sbc-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
          <div className="mt-1 text-sm text-(--muted-foreground)">
            {t.comments}: {commentCount}
          </div>
        </div>

        <Button
          variant={liked ? "primary" : "secondary"}
          size="sm"
          disabled={isPending}
          onClick={onToggleLike}
          className="min-w-28"
        >
          <span aria-hidden>♥</span>
          {liked ? t.liked : t.like}
          <span className="text-xs opacity-80">{likeCount}</span>
        </Button>
      </div>

      <div className="mt-6 grid gap-3">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t.write}
          disabled={isPending}
          className="min-h-28"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-(--muted-foreground)">{t.pendingHint}</div>
          <Button variant="primary" size="sm" disabled={isPending || !commentText.trim()} onClick={onPostComment}>
            {t.post}
          </Button>
        </div>
      </div>

      {localMyPending.length > 0 ? (
        <div className="mt-8">
          <div className="text-sm font-semibold">{t.pendingTitle}</div>
          <div className="mt-3 grid gap-3">
            {localMyPending.map((c) => (
              <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--chip-bg) p-4">
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
              <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
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
                <div key={c.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
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
