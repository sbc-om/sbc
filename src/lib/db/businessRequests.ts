import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";

export type BusinessRequest = {
  id: string;
  userId?: string;
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
  businessName: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  nameAr: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  categoryId: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
  city: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().max(50).optional(),
});

export type BusinessRequestInput = z.infer<typeof businessRequestSchema>;

function rowToRequest(row: any): BusinessRequest {
  const businessName = row.business_name || "";
  return {
    id: row.id,
    userId: row.user_id,
    name: { 
      en: row.name_en || businessName, 
      ar: row.name_ar || businessName 
    },
    businessName,
    category: row.category,
    categoryId: row.category_id,
    description: row.description,
    city: row.city,
    phone: row.phone,
    email: row.email,
    website: row.website,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status,
    adminNotes: row.admin_notes,
    adminResponse: row.admin_response,
    respondedAt: row.responded_at?.toISOString(),
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createBusinessRequest(input: BusinessRequestInput): Promise<BusinessRequest> {
  const data = businessRequestSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query(`
    INSERT INTO business_requests (
      id, user_id, business_name, name_en, name_ar, category, category_id, description, 
      city, phone, email, website, contact_email, contact_phone, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15, $15)
    RETURNING *
  `, [
    id, data.userId, data.businessName, data.nameEn || data.businessName, data.nameAr || data.businessName,
    data.category, data.categoryId, data.description, data.city, data.phone, data.email, data.website,
    data.contactEmail, data.contactPhone, now
  ]);

  return rowToRequest(result.rows[0]);
}

export async function getBusinessRequestById(id: string): Promise<BusinessRequest | null> {
  const result = await query(`SELECT * FROM business_requests WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToRequest(result.rows[0]) : null;
}

export async function listBusinessRequests(): Promise<BusinessRequest[]> {
  const result = await query(`SELECT * FROM business_requests ORDER BY created_at DESC`);
  return result.rows.map(rowToRequest);
}

export async function listPendingBusinessRequests(): Promise<BusinessRequest[]> {
  const result = await query(`SELECT * FROM business_requests WHERE status = 'pending' ORDER BY created_at DESC`);
  return result.rows.map(rowToRequest);
}

export async function updateBusinessRequestStatus(
  id: string,
  status: "approved" | "rejected",
  adminNotes?: string,
  adminResponse?: string
): Promise<BusinessRequest> {
  const now = new Date();
  const result = await query(`
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
