import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";

export type BusinessRequest = {
  id: string;
  userId?: string;
  agentUserId?: string;
  /** Business name for the request (bilingual object) */
  name: { en: string; ar: string };
  /** Legacy single string business name - deprecated */
  businessName: string;
  category?: string;
  categoryId?: string;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  adminResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const businessRequestSchema = z.object({
  userId: z.string().optional(),
  agentUserId: z.string().optional(),
  businessName: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  nameAr: z.string().trim().max(200).optional(),
  descEn: z.string().trim().max(2000).optional(),
  descAr: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(100).optional(),
  categoryId: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().max(50).optional(),
  tags: z.string().trim().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type BusinessRequestInput = z.infer<typeof businessRequestSchema>;

type BusinessRequestRow = {
  id: string;
  user_id: string | null;
  agent_user_id: string | null;
  business_name: string | null;
  name_en: string | null;
  name_ar: string | null;
  category: string | null;
  category_id: string | null;
  description: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: BusinessRequest["status"];
  admin_notes: string | null;
  admin_response: string | null;
  responded_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToRequest(r: BusinessRequestRow): BusinessRequest {
  const businessName = r.business_name || "";
  return {
    id: r.id,
    userId: r.user_id ?? undefined,
    agentUserId: r.agent_user_id || undefined,
    name: { 
      en: r.name_en || businessName, 
      ar: r.name_ar || businessName 
    },
    businessName,
    category: r.category ?? undefined,
    categoryId: r.category_id ?? undefined,
    description: r.description ?? undefined,
    city: r.city ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    website: r.website ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    contactPhone: r.contact_phone ?? undefined,
    status: r.status,
    adminNotes: r.admin_notes ?? undefined,
    adminResponse: r.admin_response ?? undefined,
    respondedAt: r.responded_at?.toISOString(),
    createdAt: r.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createBusinessRequest(input: BusinessRequestInput): Promise<BusinessRequest> {
  const data = businessRequestSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query<BusinessRequestRow>(`
    INSERT INTO business_requests (
      id, user_id, agent_user_id, business_name, name_en, name_ar, desc_en, desc_ar, category, category_id, description, 
      city, address, phone, email, website, contact_email, contact_phone, tags, latitude, longitude, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'pending', $22, $22)
    RETURNING *
  `, [
    id, data.userId, data.agentUserId || null, data.businessName, data.nameEn || data.businessName, data.nameAr || data.businessName,
    data.descEn, data.descAr, data.category, data.categoryId, data.description, data.city, data.address,
    data.phone, data.email || null, data.website || null, data.contactEmail, data.contactPhone, data.tags,
    data.latitude, data.longitude, now
  ]);

  return rowToRequest(result.rows[0]);
}

export async function getBusinessRequestById(id: string): Promise<BusinessRequest | null> {
  const result = await query<BusinessRequestRow>(`SELECT * FROM business_requests WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToRequest(result.rows[0]) : null;
}

export async function listBusinessRequests(): Promise<BusinessRequest[]> {
  const result = await query<BusinessRequestRow>(`SELECT * FROM business_requests ORDER BY created_at DESC`);
  return result.rows.map(rowToRequest);
}

export async function listBusinessRequestsByAgent(agentUserId: string): Promise<BusinessRequest[]> {
  const result = await query<BusinessRequestRow>(
    `SELECT * FROM business_requests WHERE agent_user_id = $1 ORDER BY created_at DESC`,
    [agentUserId]
  );
  return result.rows.map(rowToRequest);
}

export async function listPendingBusinessRequests(): Promise<BusinessRequest[]> {
  const result = await query<BusinessRequestRow>(`SELECT * FROM business_requests WHERE status = 'pending' ORDER BY created_at DESC`);
  return result.rows.map(rowToRequest);
}

export async function updateBusinessRequestStatus(
  id: string,
  status: "approved" | "rejected",
  adminNotes?: string,
  adminResponse?: string
): Promise<BusinessRequest> {
  const now = new Date();
  const result = await query<BusinessRequestRow>(`
    UPDATE business_requests SET
      status = $1,
      admin_notes = $2,
      admin_response = $3,
      responded_at = $4,
      updated_at = $4
    WHERE id = $5
    RETURNING *
  `, [status, adminNotes, adminResponse, now, id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToRequest(result.rows[0]);
}

export async function deleteBusinessRequest(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM business_requests WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/** Return a map of userId → request status for users that have at least one business request */
export async function getBusinessRequestStatusByUserIds(
  userIds: string[]
): Promise<Map<string, "pending" | "approved" | "rejected">> {
  if (userIds.length === 0) return new Map();
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
  // Pick the "best" status per user: approved > pending > rejected
  const result = await query<{ user_id: string; status: "pending" | "approved" | "rejected" }>(
    `SELECT DISTINCT ON (user_id) user_id, status
     FROM business_requests
     WHERE user_id IN (${placeholders})
     ORDER BY user_id, CASE status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END`,
    userIds
  );
  const m = new Map<string, "pending" | "approved" | "rejected">();
  for (const row of result.rows) {
    m.set(row.user_id, row.status);
  }
  return m;
}
