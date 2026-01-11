import { customAlphabet, nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type {
  LoyaltyCard,
  LoyaltyCustomer,
  LoyaltyPlan,
  LoyaltyProfile,
  LoyaltySubscription,
} from "./types";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "./subscriptions";

const userIdSchema = z.string().trim().min(1);
const planSchema = z.enum(["starter", "pro"]);

const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,16}$/, "INVALID_JOIN_CODE");

const profileInputSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  logoUrl: z.string().trim().min(1).max(2048).optional(),
  joinCode: joinCodeSchema.optional(),
});

export type LoyaltyProfileInput = z.infer<typeof profileInputSchema>;

const genJoinCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const customerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  // Phone is required (used for quick lookup in-store).
  phone: z.string().trim().min(6).max(40),
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
  // New source of truth: store program subscription.
  const storeSub = getProgramSubscriptionByUser(userId, "loyalty");
  if (isProgramSubscriptionActive(storeSub)) {
    // Return a compatible shape for callers that expect a LoyaltySubscription.
    const now = new Date().toISOString();
    return {
      userId,
      plan: "starter",
      status: "active",
      createdAt: storeSub!.startedAt,
      updatedAt: now,
    } satisfies LoyaltySubscription;
  }

  // Backward compatibility: legacy loyaltySubscriptions table.
  const legacy = getLoyaltySubscriptionByUserId(userId);
  if (legacy && legacy.status === "active") return legacy;

  throw new Error("LOYALTY_NOT_ACTIVE");
}

export function getLoyaltyProfileByUserId(userId: string): LoyaltyProfile | null {
  const { loyaltyProfiles } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  if (!uid.success) return null;
  return (loyaltyProfiles.get(uid.data) as LoyaltyProfile | undefined) ?? null;
}

export function getLoyaltyProfileByJoinCode(code: string): LoyaltyProfile | null {
  const { loyaltyProfiles } = getLmdb();
  const parsed = joinCodeSchema.safeParse(code);
  if (!parsed.success) return null;
  const target = parsed.data;

  for (const { value } of loyaltyProfiles.getRange()) {
    const p = value as LoyaltyProfile;
    if ((p.joinCode ?? "").toUpperCase() === target) return p;
  }
  return null;
}

function ensureJoinCodeUnique(input: { code: string; excludeUserId?: string }) {
  const { loyaltyProfiles } = getLmdb();
  const code = joinCodeSchema.parse(input.code);
  for (const { value } of loyaltyProfiles.getRange()) {
    const p = value as LoyaltyProfile;
    if ((p.joinCode ?? "").toUpperCase() !== code) continue;
    if (input.excludeUserId && p.userId === input.excludeUserId) continue;
    throw new Error("JOIN_CODE_TAKEN");
  }
}

export function upsertLoyaltyProfile(input: {
  userId: string;
  profile: LoyaltyProfileInput;
}): LoyaltyProfile {
  // Only owners with an active subscription should be able to create a join link.
  ensureActiveLoyaltySubscription(input.userId);

  const { loyaltyProfiles } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const data = profileInputSchema.parse(input.profile);

  const existing = loyaltyProfiles.get(uid) as LoyaltyProfile | undefined;
  const now = new Date().toISOString();

  const joinCode = data.joinCode
    ? joinCodeSchema.parse(data.joinCode)
    : existing?.joinCode ?? genJoinCode();

  ensureJoinCodeUnique({ code: joinCode, excludeUserId: uid });

  const next: LoyaltyProfile = {
    userId: uid,
    businessName: data.businessName,
    logoUrl: data.logoUrl || undefined,
    joinCode,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  loyaltyProfiles.put(uid, next);
  return next;
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

export function getLoyaltyCustomerByPhone(input: {
  userId: string;
  phone: string;
}): LoyaltyCustomer | null {
  const { loyaltyCustomers } = getLmdb();
  const uid = userIdSchema.safeParse(input.userId);
  if (!uid.success) return null;
  
  const phoneNormalized = input.phone.trim().replace(/\s+/g, "");
  if (!phoneNormalized) return null;

  for (const { value } of loyaltyCustomers.getRange()) {
    const c = value as LoyaltyCustomer;
    if (c.userId !== uid.data) continue;
    const customerPhone = (c.phone ?? "").trim().replace(/\s+/g, "");
    if (customerPhone === phoneNormalized) return c;
  }
  
  return null;
}
