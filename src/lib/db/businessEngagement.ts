import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { BusinessComment, BusinessCommentStatus } from "./types";

const businessIdSchema = z.string().trim().min(1);
const userIdSchema = z.string().trim().min(1);
const commentIdSchema = z.string().trim().min(1);
const commentTextSchema = z.string().trim().min(1).max(1200);

function likeKey(userId: string, businessId: string) {
  return `${userIdSchema.parse(userId)}:${businessIdSchema.parse(businessId)}`;
}

function ensureNonNegativeInt(n: unknown) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function getBusinessLikeCount(businessId: string): number {
  const { businessLikeCounts } = getLmdb();
  const bid = businessIdSchema.parse(businessId);
  const n = businessLikeCounts.get(bid) as number | undefined;
  return ensureNonNegativeInt(n);
}

export function hasUserLikedBusiness(userId: string, businessId: string): boolean {
  const { userBusinessLikes } = getLmdb();
  const key = likeKey(userId, businessId);
  return !!userBusinessLikes.get(key);
}

export function toggleBusinessLike(input: {
  userId: string;
  businessId: string;
}): { liked: boolean; count: number } {
  const { userBusinessLikes, businessLikeCounts } = getLmdb();
  const key = likeKey(input.userId, input.businessId);
  const bid = businessIdSchema.parse(input.businessId);

  const existing = userBusinessLikes.get(key) as string | undefined;
  const now = new Date().toISOString();

  const currentCount = getBusinessLikeCount(bid);

  if (existing) {
    userBusinessLikes.remove(key);
    const next = Math.max(0, currentCount - 1);
    businessLikeCounts.put(bid, next);
    return { liked: false, count: next };
  }

  userBusinessLikes.put(key, now);
  const next = currentCount + 1;
  businessLikeCounts.put(bid, next);
  return { liked: true, count: next };
}

function normalizeStatus(s: unknown): BusinessCommentStatus | null {
  if (s === "pending" || s === "approved" || s === "rejected") return s;
  return null;
}

export function listBusinessComments(businessId: string): BusinessComment[] {
  const { businessComments } = getLmdb();
  const bid = businessIdSchema.parse(businessId);
  const value = businessComments.get(bid) as BusinessComment[] | undefined;
  if (!Array.isArray(value)) return [];

  // Basic shape hardening (avoid breaking UI on old data)
  const out: BusinessComment[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const c = raw as BusinessComment;
    if (c.businessId !== bid) continue;
    if (!normalizeStatus(c.status)) continue;
    if (!c.id || !c.userId || !c.text || !c.createdAt) continue;
    out.push(c);
  }

  // Oldest -> newest for threaded feel
  out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return out;
}

export function createBusinessComment(input: {
  businessId: string;
  userId: string;
  text: string;
}): BusinessComment {
  const { businessComments } = getLmdb();

  const bid = businessIdSchema.parse(input.businessId);
  const uid = userIdSchema.parse(input.userId);
  const text = commentTextSchema.parse(input.text);

  const now = new Date().toISOString();

  const comment: BusinessComment = {
    id: nanoid(),
    businessId: bid,
    userId: uid,
    text,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const current = listBusinessComments(bid);
  const next = [...current, comment].slice(-500);
  businessComments.put(bid, next);

  return comment;
}

function updateComment(
  businessId: string,
  commentId: string,
  updater: (c: BusinessComment) => BusinessComment,
): BusinessComment {
  const { businessComments } = getLmdb();
  const bid = businessIdSchema.parse(businessId);
  const cid = commentIdSchema.parse(commentId);

  const current = listBusinessComments(bid);
  const idx = current.findIndex((c) => c.id === cid);
  if (idx === -1) throw new Error("NOT_FOUND");

  const updated = updater(current[idx]!);

  const next = [...current];
  next[idx] = updated;
  businessComments.put(bid, next);

  return updated;
}

export function approveBusinessComment(input: {
  businessId: string;
  commentId: string;
  moderatedByUserId: string;
}): BusinessComment {
  return updateComment(input.businessId, input.commentId, (c) => {
    const now = new Date().toISOString();
    return {
      ...c,
      status: "approved",
      moderatedByUserId: userIdSchema.parse(input.moderatedByUserId),
      moderatedAt: now,
      updatedAt: now,
    };
  });
}

export function rejectBusinessComment(input: {
  businessId: string;
  commentId: string;
  moderatedByUserId: string;
}): BusinessComment {
  return updateComment(input.businessId, input.commentId, (c) => {
    const now = new Date().toISOString();
    return {
      ...c,
      status: "rejected",
      moderatedByUserId: userIdSchema.parse(input.moderatedByUserId),
      moderatedAt: now,
      updatedAt: now,
    };
  });
}

export function deleteBusinessComment(input: {
  businessId: string;
  commentId: string;
}): void {
  const { businessComments } = getLmdb();
  const bid = businessIdSchema.parse(input.businessId);
  const cid = commentIdSchema.parse(input.commentId);

  const current = listBusinessComments(bid);
  const next = current.filter((c) => c.id !== cid);
  businessComments.put(bid, next);
}

// =====================
// Business Save/Bookmark Functions
// =====================

function saveKey(userId: string, businessId: string) {
  return `${userIdSchema.parse(userId)}:${businessIdSchema.parse(businessId)}`;
}

export function hasUserSavedBusiness(userId: string, businessId: string): boolean {
  const { userBusinessSaves } = getLmdb();
  const key = saveKey(userId, businessId);
  return !!userBusinessSaves.get(key);
}

export function toggleBusinessSave(input: {
  userId: string;
  businessId: string;
}): { saved: boolean } {
  const { userBusinessSaves } = getLmdb();
  const key = saveKey(input.userId, input.businessId);

  const existing = userBusinessSaves.get(key) as string | undefined;
  const now = new Date().toISOString();

  if (existing) {
    userBusinessSaves.remove(key);
    return { saved: false };
  }

  userBusinessSaves.put(key, now);
  return { saved: true };
}

export function getUserSavedBusinessIds(userId: string): string[] {
  const { userBusinessSaves } = getLmdb();
  const uid = userIdSchema.parse(userId);
  const savedIds: string[] = [];

  // Iterate through all saved business entries for this user
  for (const { key } of userBusinessSaves.getRange({})) {
    const keyStr = String(key);
    if (keyStr.startsWith(`${uid}:`)) {
      const businessId = keyStr.substring(uid.length + 1);
      savedIds.push(businessId);
    }
  }

  return savedIds;
}

// =====================
// Business Follower Functions
// =====================

export function getBusinessFollowersCount(businessId: string): number {
  const { userBusinessLikes, userBusinessSaves } = getLmdb();
  const bid = businessIdSchema.parse(businessId);
  const followers = new Set<string>();

  // Count users who liked
  for (const { key } of userBusinessLikes.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId === bid && userId) {
      followers.add(userId);
    }
  }

  // Count users who saved (union)
  for (const { key } of userBusinessSaves.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId === bid && userId) {
      followers.add(userId);
    }
  }

  return followers.size;
}

export function getBusinessesFollowersCount(businessIds: string[]): number {
  const { userBusinessLikes, userBusinessSaves } = getLmdb();
  const followers = new Set<string>();
  const bidSet = new Set(businessIds.map(id => businessIdSchema.parse(id)));

  // Count users who liked any business
  for (const { key } of userBusinessLikes.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId && bidSet.has(bId) && userId) {
      followers.add(userId);
    }
  }

  // Count users who saved any business (union)
  for (const { key } of userBusinessSaves.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId && bidSet.has(bId) && userId) {
      followers.add(userId);
    }
  }

  return followers.size;
}

export function getBusinessFollowers(businessId: string): string[] {
  const { userBusinessLikes, userBusinessSaves } = getLmdb();
  const bid = businessIdSchema.parse(businessId);
  const followers = new Set<string>();

  // Get users who liked
  for (const { key } of userBusinessLikes.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId === bid && userId) {
      followers.add(userId);
    }
  }

  // Get users who saved
  for (const { key } of userBusinessSaves.getRange({})) {
    const keyStr = String(key);
    const [userId, bId] = keyStr.split(":");
    if (bId === bid && userId) {
      followers.add(userId);
    }
  }

  return Array.from(followers);
}
