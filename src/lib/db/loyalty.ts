import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { LoyaltyCard, LoyaltyCustomer, LoyaltyPlan, LoyaltySubscription } from "./types";

const userIdSchema = z.string().trim().min(1);
const planSchema = z.enum(["starter", "pro"]);

const customerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email().optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
});

export type LoyaltyCustomerInput = z.infer<typeof customerInputSchema>;

export function getLoyaltySubscriptionByUserId(userId: string): LoyaltySubscription | null {
  const { loyaltySubscriptions } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  if (!uid.success) return null;
  return (loyaltySubscriptions.get(uid.data) as LoyaltySubscription | undefined) ?? null;
}

export function ensureActiveLoyaltySubscription(userId: string): LoyaltySubscription {
  const sub = getLoyaltySubscriptionByUserId(userId);
  if (!sub || sub.status !== "active") {
    throw new Error("LOYALTY_NOT_ACTIVE");
  }
  return sub;
}

export function purchaseLoyaltySubscription(input: {
  userId: string;
  plan: LoyaltyPlan;
}): LoyaltySubscription {
  const { loyaltySubscriptions } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const plan = planSchema.parse(input.plan);

  const now = new Date().toISOString();
  const existing = loyaltySubscriptions.get(uid) as LoyaltySubscription | undefined;

  const next: LoyaltySubscription = {
    userId: uid,
    plan,
    status: "active",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  loyaltySubscriptions.put(uid, next);
  return next;
}

export function createLoyaltyCustomer(input: {
  userId: string;
  customer: LoyaltyCustomerInput;
}): LoyaltyCustomer {
  ensureActiveLoyaltySubscription(input.userId);

  const { loyaltyCustomers, loyaltyCards } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const data = customerInputSchema.parse(input.customer);

  const now = new Date().toISOString();
  const customerId = nanoid();
  const cardId = nanoid();

  const card: LoyaltyCard = {
    id: cardId,
    userId: uid,
    customerId,
    status: "active",
    points: 0,
    createdAt: now,
    updatedAt: now,
  };

  const customer: LoyaltyCustomer = {
    id: customerId,
    userId: uid,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    tags: data.tags,
    cardId,
    points: 0,
    createdAt: now,
    updatedAt: now,
  };

  loyaltyCards.put(cardId, card);
  loyaltyCustomers.put(customerId, customer);

  return customer;
}

export function listLoyaltyCustomersByUser(userId: string): LoyaltyCustomer[] {
  const { loyaltyCustomers } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  if (!uid.success) return [];

  const out: LoyaltyCustomer[] = [];
  for (const { value } of loyaltyCustomers.getRange()) {
    const c = value as LoyaltyCustomer;
    if (c.userId === uid.data) out.push(c);
  }

  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out;
}

export function adjustLoyaltyCustomerPoints(input: {
  userId: string;
  customerId: string;
  delta: number;
}): LoyaltyCustomer {
  ensureActiveLoyaltySubscription(input.userId);

  const { loyaltyCustomers, loyaltyCards } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const customerId = z.string().trim().min(1).parse(input.customerId);
  const delta = z.number().int().min(-1000).max(1000).parse(input.delta);

  const existing = loyaltyCustomers.get(customerId) as LoyaltyCustomer | undefined;
  if (!existing || existing.userId !== uid) throw new Error("NOT_FOUND");

  const nextPoints = Math.max(0, (existing.points ?? 0) + delta);
  const now = new Date().toISOString();

  const next: LoyaltyCustomer = {
    ...existing,
    points: nextPoints,
    updatedAt: now,
  };

  loyaltyCustomers.put(customerId, next);

  const card = loyaltyCards.get(existing.cardId) as LoyaltyCard | undefined;
  if (card) {
    loyaltyCards.put(existing.cardId, {
      ...card,
      points: nextPoints,
      updatedAt: now,
    } satisfies LoyaltyCard);
  }

  return next;
}

export function getLoyaltyCardById(id: string): LoyaltyCard | null {
  const { loyaltyCards } = getLmdb();
  const cid = z.string().trim().min(1).safeParse(id);
  if (!cid.success) return null;
  return (loyaltyCards.get(cid.data) as LoyaltyCard | undefined) ?? null;
}

export function getLoyaltyCustomerById(id: string): LoyaltyCustomer | null {
  const { loyaltyCustomers } = getLmdb();
  const cid = z.string().trim().min(1).safeParse(id);
  if (!cid.success) return null;
  return (loyaltyCustomers.get(cid.data) as LoyaltyCustomer | undefined) ?? null;
}
