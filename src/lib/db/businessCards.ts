import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import { getBusinessById } from "./businesses";
import type { BusinessCard } from "./types";

const idSchema = z.string().trim().min(1);
const ownerIdSchema = z.string().trim().min(1);
const businessIdSchema = z.string().trim().min(1);

const cardInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    title: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(6).max(40).optional(),
    website: z.string().trim().min(1).max(2048).optional(),
    avatarUrl: z.string().trim().min(1).max(2048).optional(),
    bio: z.string().trim().min(1).max(2000).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();

export type BusinessCardInput = z.infer<typeof cardInputSchema>;

function ensureOwnerForBusiness(ownerId: string, businessId: string) {
  const business = getBusinessById(businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");
  if (!business.ownerId || business.ownerId !== ownerId) throw new Error("UNAUTHORIZED");
  const approved = business.isApproved ?? business.isVerified ?? false;
  if (!approved) throw new Error("BUSINESS_NOT_APPROVED");
  return business;
}

export function createBusinessCard(input: {
  ownerId: string;
  businessId: string;
  data: BusinessCardInput;
}): BusinessCard {
  const { businessCards } = getLmdb();

  const ownerId = ownerIdSchema.parse(input.ownerId);
  const businessId = businessIdSchema.parse(input.businessId);
  const data = cardInputSchema.parse(input.data);

  ensureOwnerForBusiness(ownerId, businessId);

  const now = new Date().toISOString();
  const card: BusinessCard = {
    id: nanoid(12),
    businessId,
    ownerId,
    fullName: data.fullName,
    title: data.title || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    website: data.website || undefined,
    avatarUrl: data.avatarUrl || undefined,
    bio: data.bio || undefined,
    isPublic: data.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
  };

  businessCards.put(card.id, card);
  return card;
}

export function getBusinessCardById(cardId: string): BusinessCard | null {
  const { businessCards } = getLmdb();
  const id = idSchema.safeParse(cardId);
  if (!id.success) return null;
  return (businessCards.get(id.data) as BusinessCard | undefined) ?? null;
}

export function listBusinessCardsByBusiness(input: {
  ownerId: string;
  businessId: string;
}): BusinessCard[] {
  const { businessCards } = getLmdb();
  const ownerId = ownerIdSchema.parse(input.ownerId);
  const businessId = businessIdSchema.parse(input.businessId);

  ensureOwnerForBusiness(ownerId, businessId);

  const results: BusinessCard[] = [];
  for (const { value } of businessCards.getRange()) {
    const card = value as BusinessCard;
    if (card.businessId !== businessId) continue;
    results.push(card);
  }

  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return results;
}

export function listPublicBusinessCardsByBusiness(businessId: string): BusinessCard[] {
  const { businessCards } = getLmdb();
  const bid = businessIdSchema.safeParse(businessId);
  if (!bid.success) return [];

  const results: BusinessCard[] = [];
  for (const { value } of businessCards.getRange()) {
    const card = value as BusinessCard;
    if (card.businessId !== bid.data) continue;
    if (!card.isPublic) continue;
    results.push(card);
  }

  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return results;
}

export function updateBusinessCard(input: {
  ownerId: string;
  cardId: string;
  data: Partial<BusinessCardInput>;
}): BusinessCard {
  const { businessCards } = getLmdb();
  const ownerId = ownerIdSchema.parse(input.ownerId);
  const cardId = idSchema.parse(input.cardId);
  const data = cardInputSchema.partial().parse(input.data);

  const existing = businessCards.get(cardId) as BusinessCard | undefined;
  if (!existing) throw new Error("CARD_NOT_FOUND");
  if (existing.ownerId !== ownerId) throw new Error("UNAUTHORIZED");

  const now = new Date().toISOString();
  const next: BusinessCard = {
    ...existing,
    fullName: data.fullName ?? existing.fullName,
    title: data.title ?? existing.title,
    email: data.email ?? existing.email,
    phone: data.phone ?? existing.phone,
    website: data.website ?? existing.website,
    avatarUrl: data.avatarUrl ?? existing.avatarUrl,
    bio: data.bio ?? existing.bio,
    isPublic: data.isPublic ?? existing.isPublic,
    updatedAt: now,
  };

  businessCards.put(cardId, next);
  return next;
}

export function deleteBusinessCard(input: {
  ownerId: string;
  cardId: string;
}): void {
  const { businessCards } = getLmdb();
  const ownerId = ownerIdSchema.parse(input.ownerId);
  const cardId = idSchema.parse(input.cardId);

  const existing = businessCards.get(cardId) as BusinessCard | undefined;
  if (!existing) throw new Error("CARD_NOT_FOUND");
  if (existing.ownerId !== ownerId) throw new Error("UNAUTHORIZED");

  businessCards.remove(cardId);
}
