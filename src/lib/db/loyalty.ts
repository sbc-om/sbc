import { customAlphabet, nanoid } from "nanoid";
import { z } from "zod";
import { createHash } from "node:crypto";

import { getLmdb } from "./lmdb";
import { triggerWalletUpdate } from "@/lib/wallet/walletUpdates";
import type {
  AppleWalletRegistration,
  LoyaltyCard,
  LoyaltyCustomer,
  LoyaltyMessage,
  LoyaltyPlan,
  LoyaltyProfile,
  LoyaltyPushSubscription,
  LoyaltySettings,
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
  location: z
    .object({
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
      radiusMeters: z.number().int().min(25).max(20000),
      label: z.string().trim().min(1).max(200).optional(),
    })
    .optional(),
});

export type LoyaltyProfileInput = z.infer<typeof profileInputSchema>;

const cardDesignSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundStyle: z.enum(["solid", "gradient", "pattern"]),
  logoPosition: z.enum(["top", "center", "corner"]),
  showBusinessName: z.boolean(),
  showCustomerName: z.boolean(),
  cornerRadius: z.number().int().min(0).max(32),
});

const settingsInputSchema = z
  .object({
    pointsRequiredPerRedemption: z.number().int().min(1).max(100000).optional(),
    pointsDeductPerRedemption: z.number().int().min(1).max(100000).optional(),
    pointsIconMode: z.enum(["logo", "custom"]).optional(),
    pointsIconUrl: z.string().trim().min(1).max(2048).optional(),
    cardDesign: cardDesignSchema.optional(),

    // Wallet pass content (used in previews and pass generation)
    walletPassDescription: z.string().trim().min(1).max(2000).optional(),
    walletPassTerms: z.string().trim().min(1).max(4000).optional(),
    walletWebsiteUrl: z.string().trim().min(1).max(2048).optional(),
    walletSupportEmail: z.string().trim().min(1).max(320).optional(),
    walletSupportPhone: z.string().trim().min(1).max(80).optional(),
    walletAddress: z.string().trim().min(1).max(400).optional(),
    walletBarcodeFormat: z.enum(["qr", "code128"]).optional(),
    walletBarcodeMessage: z.string().trim().min(1).max(2048).optional(),
    walletNotificationTitle: z.string().trim().min(1).max(140).optional(),
    walletNotificationBody: z.string().trim().min(1).max(1200).optional(),
  })
  .strict();

export type LoyaltySettingsInput = z.infer<typeof settingsInputSchema>;

const genJoinCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const customerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  // Phone is required (used for quick lookup in-store).
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  memberId: z.string().trim().min(3).max(40).optional(),
});

export type LoyaltyCustomerInput = z.infer<typeof customerInputSchema>;

const messageInputSchema = z
  .object({
    customerId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(2).max(1200),
  })
  .strict();

export type LoyaltyMessageInput = z.infer<typeof messageInputSchema>;

const webPushSubscriptionSchema = z
  .object({
    endpoint: z.string().trim().min(1).max(4096),
    keys: z
      .object({
        p256dh: z.string().trim().min(1).max(2048),
        auth: z.string().trim().min(1).max(2048),
      })
      .strict(),
  })
  .strict();

export type WebPushSubscriptionInput = z.infer<typeof webPushSubscriptionSchema>;

function hashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 16);
}

function pushSubId(customerId: string, endpoint: string) {
  return `${customerId}:${hashEndpoint(endpoint)}`;
}

export function upsertLoyaltyPushSubscription(input: {
  /** Business owner id (validated against the card). */
  userId: string;
  customerId: string;
  subscription: WebPushSubscriptionInput;
  userAgent?: string;
}): LoyaltyPushSubscription {
  const { loyaltyPushSubscriptions, loyaltyCustomers } = getLmdb();

  const uid = userIdSchema.parse(input.userId);
  const customerId = z.string().trim().min(1).parse(input.customerId);
  const sub = webPushSubscriptionSchema.parse(input.subscription);

  const customer = loyaltyCustomers.get(customerId) as LoyaltyCustomer | undefined;
  if (!customer || customer.userId !== uid) throw new Error("CUSTOMER_NOT_FOUND");

  const id = pushSubId(customerId, sub.endpoint);
  const existing = loyaltyPushSubscriptions.get(id) as LoyaltyPushSubscription | undefined;
  const now = new Date().toISOString();

  const next: LoyaltyPushSubscription = {
    id,
    userId: uid,
    customerId,
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    userAgent: input.userAgent?.slice(0, 300),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  loyaltyPushSubscriptions.put(id, next);
  return next;
}

export async function removeLoyaltyPushSubscription(input: {
  userId: string;
  customerId: string;
  /** Optional endpoint: remove only that subscription; otherwise remove all for this customer. */
  endpoint?: string;
}): Promise<number> {
  const { loyaltyPushSubscriptions, loyaltyCustomers } = getLmdb();

  const uid = userIdSchema.parse(input.userId);
  const customerId = z.string().trim().min(1).parse(input.customerId);

  const customer = loyaltyCustomers.get(customerId) as LoyaltyCustomer | undefined;
  if (!customer || customer.userId !== uid) throw new Error("CUSTOMER_NOT_FOUND");

  let removed = 0;
  if (input.endpoint) {
    const id = pushSubId(customerId, String(input.endpoint));
    if (await loyaltyPushSubscriptions.remove(id)) removed += 1;
    return removed;
  }

  for (const { key, value } of loyaltyPushSubscriptions.getRange()) {
    const s = value as LoyaltyPushSubscription;
    if (s.userId !== uid) continue;
    if (s.customerId !== customerId) continue;
    if (await loyaltyPushSubscriptions.remove(String(key))) removed += 1;
  }
  return removed;
}

export function listLoyaltyPushSubscriptionsByUser(input: {
  userId: string;
  customerId?: string;
}): LoyaltyPushSubscription[] {
  const { loyaltyPushSubscriptions } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const customerId = input.customerId ? z.string().trim().min(1).parse(input.customerId) : null;

  const out: LoyaltyPushSubscription[] = [];
  for (const { value } of loyaltyPushSubscriptions.getRange()) {
    const s = value as LoyaltyPushSubscription;
    if (s.userId !== uid) continue;
    if (customerId && s.customerId !== customerId) continue;
    out.push(s);
  }
  return out;
}

function appleRegId(passTypeIdentifier: string, serialNumber: string, deviceLibraryIdentifier: string) {
  return `${passTypeIdentifier}:${serialNumber}:${deviceLibraryIdentifier}`;
}

export function upsertAppleWalletRegistration(input: {
  passTypeIdentifier: string;
  serialNumber: string;
  deviceLibraryIdentifier: string;
  pushToken: string;
}): AppleWalletRegistration {
  const { appleWalletRegistrations } = getLmdb();
  const passTypeIdentifier = z.string().trim().min(1).max(200).parse(input.passTypeIdentifier);
  const serialNumber = z.string().trim().min(1).max(200).parse(input.serialNumber);
  const deviceLibraryIdentifier = z.string().trim().min(1).max(200).parse(input.deviceLibraryIdentifier);
  const pushToken = z.string().trim().min(1).max(512).parse(input.pushToken);

  const id = appleRegId(passTypeIdentifier, serialNumber, deviceLibraryIdentifier);
  const now = new Date().toISOString();
  const next: AppleWalletRegistration = {
    id,
    passTypeIdentifier,
    serialNumber,
    deviceLibraryIdentifier,
    pushToken,
    updatedAt: now,
  };
  appleWalletRegistrations.put(id, next);
  return next;
}

export async function removeAppleWalletRegistration(input: {
  passTypeIdentifier: string;
  serialNumber: string;
  deviceLibraryIdentifier: string;
}): Promise<boolean> {
  const { appleWalletRegistrations } = getLmdb();
  const passTypeIdentifier = z.string().trim().min(1).parse(input.passTypeIdentifier);
  const serialNumber = z.string().trim().min(1).parse(input.serialNumber);
  const deviceLibraryIdentifier = z.string().trim().min(1).parse(input.deviceLibraryIdentifier);
  const id = appleRegId(passTypeIdentifier, serialNumber, deviceLibraryIdentifier);
  return await appleWalletRegistrations.remove(id);
}

export function listAppleWalletPushTokensForSerial(input: {
  passTypeIdentifier: string;
  serialNumber: string;
}): string[] {
  const { appleWalletRegistrations } = getLmdb();
  const passTypeIdentifier = z.string().trim().min(1).parse(input.passTypeIdentifier);
  const serialNumber = z.string().trim().min(1).parse(input.serialNumber);
  const out = new Set<string>();
  for (const { value } of appleWalletRegistrations.getRange()) {
    const r = value as AppleWalletRegistration;
    if (r.passTypeIdentifier !== passTypeIdentifier) continue;
    if (r.serialNumber !== serialNumber) continue;
    out.add(r.pushToken);
  }
  return Array.from(out);
}

export function listAppleWalletRegistrationsForDevice(input: {
  passTypeIdentifier: string;
  deviceLibraryIdentifier: string;
}): AppleWalletRegistration[] {
  const { appleWalletRegistrations } = getLmdb();
  const passTypeIdentifier = z.string().trim().min(1).parse(input.passTypeIdentifier);
  const deviceLibraryIdentifier = z.string().trim().min(1).parse(input.deviceLibraryIdentifier);
  const out: AppleWalletRegistration[] = [];

  for (const { value } of appleWalletRegistrations.getRange()) {
    const r = value as AppleWalletRegistration;
    if (r.passTypeIdentifier !== passTypeIdentifier) continue;
    if (r.deviceLibraryIdentifier !== deviceLibraryIdentifier) continue;
    out.push(r);
  }

  return out;
}

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

export function listLoyaltyProfiles(): LoyaltyProfile[] {
  const { loyaltyProfiles } = getLmdb();
  const results: LoyaltyProfile[] = [];
  
  for (const { value } of loyaltyProfiles.getRange()) {
    results.push(value as LoyaltyProfile);
  }
  
  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return results;
}

export function defaultLoyaltySettings(userId: string): LoyaltySettings {
  const uid = userIdSchema.parse(userId);
  const now = new Date().toISOString();
  return {
    userId: uid,
    pointsRequiredPerRedemption: 10,
    pointsDeductPerRedemption: 10,
    pointsIconMode: "logo",
    pointsIconUrl: undefined,
    walletBarcodeFormat: "qr",
    createdAt: now,
    updatedAt: now,
  };
}

export function getLoyaltySettingsByUserId(userId: string): LoyaltySettings | null {
  const { loyaltySettings } = getLmdb();
  const uid = userIdSchema.safeParse(userId);
  if (!uid.success) return null;
  return (loyaltySettings.get(uid.data) as LoyaltySettings | undefined) ?? null;
}

export function upsertLoyaltySettings(input: {
  userId: string;
  settings: LoyaltySettingsInput;
}): LoyaltySettings {
  ensureActiveLoyaltySubscription(input.userId);

  const { loyaltySettings } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const data = settingsInputSchema.parse(input.settings);

  const existing = loyaltySettings.get(uid) as LoyaltySettings | undefined;
  const now = new Date().toISOString();
  const base = existing ?? defaultLoyaltySettings(uid);

  // If mode is custom but url is missing, keep existing url (if any).
  // If mode is logo, we clear custom url.
  const nextMode = data.pointsIconMode ?? base.pointsIconMode;
  const nextUrl =
    nextMode === "logo"
      ? undefined
      : (data.pointsIconUrl ?? base.pointsIconUrl ?? undefined);

  const next: LoyaltySettings = {
    ...base,
    pointsRequiredPerRedemption:
      data.pointsRequiredPerRedemption ?? base.pointsRequiredPerRedemption,
    pointsDeductPerRedemption:
      data.pointsDeductPerRedemption ?? base.pointsDeductPerRedemption,
    pointsIconMode: nextMode,
    pointsIconUrl: nextUrl,
    cardDesign: data.cardDesign ?? base.cardDesign,
    walletPassDescription: data.walletPassDescription ?? base.walletPassDescription,
    walletPassTerms: data.walletPassTerms ?? base.walletPassTerms,
    walletWebsiteUrl: data.walletWebsiteUrl ?? base.walletWebsiteUrl,
    walletSupportEmail: data.walletSupportEmail ?? base.walletSupportEmail,
    walletSupportPhone: data.walletSupportPhone ?? base.walletSupportPhone,
    walletAddress: data.walletAddress ?? base.walletAddress,
    walletBarcodeFormat: data.walletBarcodeFormat ?? base.walletBarcodeFormat,
    walletBarcodeMessage: data.walletBarcodeMessage ?? base.walletBarcodeMessage,
    walletNotificationTitle: data.walletNotificationTitle ?? base.walletNotificationTitle,
    walletNotificationBody: data.walletNotificationBody ?? base.walletNotificationBody,
    createdAt: base.createdAt ?? now,
    updatedAt: now,
  };

  loyaltySettings.put(uid, next);
  return next;
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
    location: data.location ?? existing?.location,
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

export function createLoyaltyMessage(input: {
  userId: string;
  message: LoyaltyMessageInput;
}): LoyaltyMessage {
  ensureActiveLoyaltySubscription(input.userId);

  const { loyaltyMessages, loyaltyCustomers } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const data = messageInputSchema.parse(input.message);

  // If targeted, validate the customer belongs to this business.
  if (data.customerId) {
    const c = loyaltyCustomers.get(data.customerId) as LoyaltyCustomer | undefined;
    if (!c || c.userId !== uid) throw new Error("CUSTOMER_NOT_FOUND");
  }

  const now = new Date().toISOString();
  // Prefix with timestamp so lexicographic order roughly matches creation time.
  const id = `${Date.now()}_${nanoid(10)}`;

  const msg: LoyaltyMessage = {
    id,
    userId: uid,
    customerId: data.customerId || undefined,
    title: data.title,
    body: data.body,
    createdAt: now,
  };

  loyaltyMessages.put(id, msg);
  return msg;
}

export function listLoyaltyMessagesForCustomer(input: {
  userId: string;
  customerId: string;
  limit?: number;
}): LoyaltyMessage[] {
  const { loyaltyMessages } = getLmdb();
  const uid = userIdSchema.parse(input.userId);
  const customerId = z.string().trim().min(1).parse(input.customerId);
  const limit = Math.min(50, Math.max(1, Math.trunc(input.limit ?? 10)));

  const all: LoyaltyMessage[] = [];
  for (const { value } of loyaltyMessages.getRange({ reverse: true })) {
    const m = value as LoyaltyMessage;
    if (m.userId !== uid) continue;
    if (m.customerId && m.customerId !== customerId) continue;
    all.push(m);
    if (all.length >= limit) break;
  }
  return all;
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

  // Generate stable memberId (shown in wallet QR/barcode)
  const memberId = data.memberId || `M${customerId.slice(0, 8).toUpperCase()}`;

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
    memberId,
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

    // Trigger wallet updates (Apple & Google Wallet) - fire and forget
    triggerWalletUpdate({
      cardId: existing.cardId,
      points: nextPoints,
      delta,
    });
  }

  return next;
}

export function redeemLoyaltyCustomerPoints(input: {
  userId: string;
  customerId: string;
}): { customer: LoyaltyCustomer; settings: LoyaltySettings } {
  ensureActiveLoyaltySubscription(input.userId);

  const uid = userIdSchema.parse(input.userId);
  const customerId = z.string().trim().min(1).parse(input.customerId);

  const settings = getLoyaltySettingsByUserId(uid) ?? defaultLoyaltySettings(uid);

  const { loyaltyCustomers, loyaltyCards } = getLmdb();
  const existing = loyaltyCustomers.get(customerId) as LoyaltyCustomer | undefined;
  if (!existing || existing.userId !== uid) throw new Error("NOT_FOUND");

  const points = existing.points ?? 0;
  if (points < settings.pointsRequiredPerRedemption) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  const nextPoints = Math.max(0, points - settings.pointsDeductPerRedemption);
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

    // Trigger wallet updates (Apple & Google Wallet) - fire and forget
    triggerWalletUpdate({
      cardId: existing.cardId,
      points: nextPoints,
      delta: -(settings.pointsDeductPerRedemption),
    });
  }

  return { customer: next, settings };
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
