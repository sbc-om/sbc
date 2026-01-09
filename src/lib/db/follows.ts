import { z } from "zod";

import { getLmdb } from "./lmdb";

const categoryIdSchema = z.string().trim().min(1);
const userIdSchema = z.string().trim().min(1);

function key(userId: string) {
  return userIdSchema.parse(userId);
}

export function getFollowedCategoryIds(userId: string): string[] {
  const { userCategoryFollows } = getLmdb();
  const k = key(userId);
  const value = userCategoryFollows.get(k) as unknown;
  if (!Array.isArray(value)) return [];
  return value.filter((x) => typeof x === "string") as string[];
}

export function isCategoryFollowed(userId: string, categoryId: string): boolean {
  const cat = categoryIdSchema.parse(categoryId);
  return getFollowedCategoryIds(userId).includes(cat);
}

export function followCategory(userId: string, categoryId: string): string[] {
  const { userCategoryFollows } = getLmdb();
  const k = key(userId);
  const cat = categoryIdSchema.parse(categoryId);

  const current = getFollowedCategoryIds(userId);
  const next = Array.from(new Set([...current, cat]));
  userCategoryFollows.put(k, next);
  return next;
}

export function unfollowCategory(userId: string, categoryId: string): string[] {
  const { userCategoryFollows } = getLmdb();
  const k = key(userId);
  const cat = categoryIdSchema.parse(categoryId);

  const current = getFollowedCategoryIds(userId);
  const next = current.filter((id) => id !== cat);
  userCategoryFollows.put(k, next);
  return next;
}
