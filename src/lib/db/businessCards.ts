import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import type { BusinessCard } from "./types";

const businessCardSchema = z.object({
  businessId: z.string().min(1),
  ownerId: z.string().min(1),
  fullName: z.string().trim().min(1).max(120),
  title: z.string().trim().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(50).optional(),
  website: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().trim().max(500).optional(),
  isPublic: z.boolean().default(true),
});

export type BusinessCardInput = z.infer<typeof businessCardSchema>;

type BusinessCardRow = {
  id: string;
  business_id: string;
  owner_id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
  is_approved: boolean | null;
  approved_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToBusinessCard(r: BusinessCardRow): BusinessCard {
  return {
    id: r.id,
    businessId: r.business_id,
    ownerId: r.owner_id,
    fullName: r.full_name,
    title: r.title ?? undefined,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    website: r.website ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    bio: r.bio ?? undefined,
    isPublic: r.is_public ?? true,
    isApproved: r.is_approved ?? false,
    approvedAt: r.approved_at?.toISOString(),
    createdAt: r.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createBusinessCard(input: BusinessCardInput): Promise<BusinessCard> {
  const data = businessCardSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query<BusinessCardRow>(`
    INSERT INTO business_cards (
      id, business_id, owner_id, full_name, title, email, phone, website,
      avatar_url, bio, is_public, is_approved, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, $12, $12)
    RETURNING *
  `, [
    id, data.businessId, data.ownerId, data.fullName, data.title,
    data.email, data.phone, data.website, data.avatarUrl, data.bio,
    data.isPublic, now
  ]);

  return rowToBusinessCard(result.rows[0]);
}

export async function getBusinessCardById(id: string): Promise<BusinessCard | null> {
  const result = await query<BusinessCardRow>(`SELECT * FROM business_cards WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToBusinessCard(result.rows[0]) : null;
}

export async function getBusinessCardsByBusinessId(businessId: string): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`
    SELECT * FROM business_cards WHERE business_id = $1 ORDER BY created_at DESC
  `, [businessId]);
  return result.rows.map(rowToBusinessCard);
}

export async function getBusinessCardsByOwnerId(ownerId: string): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`
    SELECT * FROM business_cards WHERE owner_id = $1 ORDER BY created_at DESC
  `, [ownerId]);
  return result.rows.map(rowToBusinessCard);
}

export async function updateBusinessCard(
  id: string,
  input: Partial<BusinessCardInput>
): Promise<BusinessCard> {
  const currentRes = await query<BusinessCardRow>(`SELECT * FROM business_cards WHERE id = $1`, [id]);
  if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
  const current = rowToBusinessCard(currentRes.rows[0]);

  const result = await query<BusinessCardRow>(`
    UPDATE business_cards SET
      full_name = COALESCE($1, full_name),
      title = $2,
      email = $3,
      phone = $4,
      website = $5,
      avatar_url = $6,
      bio = $7,
      is_public = COALESCE($8, is_public),
      updated_at = $9
    WHERE id = $10
    RETURNING *
  `, [
    input.fullName,
    input.title !== undefined ? input.title : current.title,
    input.email !== undefined ? input.email : current.email,
    input.phone !== undefined ? input.phone : current.phone,
    input.website !== undefined ? input.website : current.website,
    input.avatarUrl !== undefined ? input.avatarUrl : current.avatarUrl,
    input.bio !== undefined ? input.bio : current.bio,
    input.isPublic,
    new Date(),
    id
  ]);

  return rowToBusinessCard(result.rows[0]);
}

export async function deleteBusinessCard(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM business_cards WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setBusinessCardApproved(id: string, isApproved: boolean): Promise<BusinessCard> {
  const now = new Date();
  const result = await query<BusinessCardRow>(`
    UPDATE business_cards SET
      is_approved = $1,
      approved_at = CASE WHEN $1 THEN $2::timestamptz ELSE NULL END,
      updated_at = $2
    WHERE id = $3
    RETURNING *
  `, [isApproved, now, id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusinessCard(result.rows[0]);
}

export async function listAllBusinessCards(): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`SELECT * FROM business_cards ORDER BY created_at DESC`);
  return result.rows.map(rowToBusinessCard);
}

export async function listApprovedBusinessCards(): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`
    SELECT * FROM business_cards WHERE is_approved = true AND is_public = true ORDER BY created_at DESC
  `);
  return result.rows.map(rowToBusinessCard);
}

// ==================== Alias Functions for API Compatibility ====================

/** List business cards for a business (with owner check) */
export async function listBusinessCardsByBusiness(input: {
  ownerId: string;
  businessId: string;
}): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`
    SELECT * FROM business_cards 
    WHERE business_id = $1 AND owner_id = $2
    ORDER BY created_at DESC
  `, [input.businessId, input.ownerId]);
  return result.rows.map(rowToBusinessCard);
}

/** List public business cards for a business */
export async function listPublicBusinessCardsByBusiness(businessId: string): Promise<BusinessCard[]> {
  const result = await query<BusinessCardRow>(`
    SELECT * FROM business_cards 
    WHERE business_id = $1 AND is_public = true AND is_approved = true
    ORDER BY created_at DESC
  `, [businessId]);
  return result.rows.map(rowToBusinessCard);
}

