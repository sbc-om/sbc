import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { ProgramId, ProgramSubscription } from "./types";

const userIdSchema = z.string().trim().min(1);
const programSchema = z.enum(["directory", "loyalty", "marketing"]);
const planSchema = z.string().trim().min(1).max(64);
const durationDaysSchema = z.number().int().min(1).max(3650);

function subscriptionKey(userId: string, program: ProgramId) {
  return `${userId}::${program}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function getProgramSubscriptionByUser(userId: string, program: ProgramId): ProgramSubscription | null {
  const { programSubscriptions } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  const prog = programSchema.safeParse(program);
  if (!uid.success || !prog.success) return null;

  const key = subscriptionKey(uid.data, prog.data);
  return (programSubscriptions.get(key) as ProgramSubscription | undefined) ?? null;
}

export function isProgramSubscriptionActive(sub: ProgramSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  return new Date(sub.expiresAt).getTime() > Date.now();
}

export function ensureActiveProgramSubscription(userId: string, program: ProgramId): ProgramSubscription {
  const sub = getProgramSubscriptionByUser(userId, program);
  if (!isProgramSubscriptionActive(sub)) {
    throw new Error("SUBSCRIPTION_NOT_ACTIVE");
  }
  return sub!;
}

export function listProgramSubscriptionsByUser(userId: string): ProgramSubscription[] {
  const { programSubscriptions } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  if (!uid.success) return [];

  const prefix = `${uid.data}::`;
  const out: ProgramSubscription[] = [];
  for (const { key, value } of programSubscriptions.getRange()) {
    if (typeof key !== "string" || !key.startsWith(prefix)) continue;
    out.push(value as ProgramSubscription);
  }

  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  return out;
}

export function purchaseProgramSubscription(input: {
  userId: string;
  program: ProgramId;
  plan: string;
  durationDays: number;
}): ProgramSubscription {
  const { programSubscriptions } = getLmdb();
  const userId = userIdSchema.parse(input.userId);
  const program = programSchema.parse(input.program);
  const plan = planSchema.parse(input.plan);
  const durationDays = durationDaysSchema.parse(input.durationDays);

  const now = new Date().toISOString();
  const key = subscriptionKey(userId, program);
  const existing = programSubscriptions.get(key) as ProgramSubscription | undefined;

  const isStillActive = existing?.status === "active" && new Date(existing.expiresAt).getTime() > Date.now();

  const startedAt = isStillActive ? existing!.startedAt : now;
  const baseForExtension = isStillActive ? existing!.expiresAt : now;

  const next: ProgramSubscription = {
    userId,
    program,
    // If user buys a different plan, that becomes the active plan going forward.
    plan,
    status: "active",
    startedAt,
    expiresAt: addDays(baseForExtension, durationDays),
    updatedAt: now,
  };

  programSubscriptions.put(key, next);
  return next;
}
