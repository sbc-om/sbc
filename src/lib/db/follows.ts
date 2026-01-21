import { z } from "zod";

import { getLmdb } from "./lmdb";

const categoryIdSchema = z.string().trim().min(1);
const userIdSchema = z.string().trim().min(1);

function key(userId: string) {
  return userIdSchema.parse(userId);
}

function getDescendantCategoryIds(categoryId: string): string[] {
  const { categories } = getLmdb();
  const childrenByParent = new Map<string, string[]>();

  for (const { value } of categories.getRange()) {
    const c = value as { id: string; parentId?: string };
    if (!c.parentId) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c.id);
    childrenByParent.set(c.parentId, list);
  }

  const result: string[] = [];
  const seen = new Set<string>();
  const stack = [...(childrenByParent.get(categoryId) ?? [])];

  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    const children = childrenByParent.get(id);
    if (children?.length) stack.push(...children);
  }

  return result;
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
  const descendants = getDescendantCategoryIds(cat);

  const current = getFollowedCategoryIds(userId);
  const next = Array.from(new Set([...current, cat, ...descendants]));
  userCategoryFollows.put(k, next);
  return next;
}

export function unfollowCategory(userId: string, categoryId: string): string[] {
  const { userCategoryFollows } = getLmdb();
  const k = key(userId);
  const cat = categoryIdSchema.parse(categoryId);
  const descendants = new Set(getDescendantCategoryIds(cat));

  const current = getFollowedCategoryIds(userId);
  const next = current.filter((id) => id !== cat && !descendants.has(id));
  userCategoryFollows.put(k, next);
  return next;
}
