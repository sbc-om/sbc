import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";

export type BusinessRequest = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  categoryId?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  adminUserId?: string;
  respondedAt?: string;
  createdAt: string;
};

const requestSchema = z.object({
  userId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000).optional(),
  categoryId: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  address: z.string().trim().min(3).max(500).optional(),
  phone: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email().optional(),
  website: z.string().trim().min(3).max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type BusinessRequestInput = z.infer<typeof requestSchema>;

export function createBusinessRequest(input: BusinessRequestInput): BusinessRequest {
  const data = requestSchema.parse(input);
  const { businessRequests } = getLmdb();

  const req: BusinessRequest = {
    id: nanoid(),
    userId: data.userId,
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    city: data.city,
    address: data.address,
    phone: data.phone,
    email: data.email,
    website: data.website,
    latitude: data.latitude,
    longitude: data.longitude,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  businessRequests.put(req.id, req);
  return req;
}

export function listBusinessRequestsByUser(userId: string): BusinessRequest[] {
  const { businessRequests } = getLmdb();
  const uid = z.string().trim().min(1).parse(userId);

  const results: BusinessRequest[] = [];
  for (const { value } of businessRequests.getRange()) {
    const r = value as BusinessRequest;
    if (r.userId === uid) results.push(r);
  }

  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return results;
}

export function listAllBusinessRequests(): BusinessRequest[] {
  const { businessRequests } = getLmdb();
  const results: BusinessRequest[] = [];
  
  for (const { value } of businessRequests.getRange()) {
    results.push(value as BusinessRequest);
  }
  
  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return results;
}

export function getBusinessRequestById(id: string): BusinessRequest | null {
  const { businessRequests } = getLmdb();
  return (businessRequests.get(id) as BusinessRequest | undefined) ?? null;
}

export function updateBusinessRequestStatus(
  id: string,
  status: "approved" | "rejected",
  adminResponse: string,
  adminUserId: string
): BusinessRequest {
  const { businessRequests } = getLmdb();
  const current = businessRequests.get(id) as BusinessRequest | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const updated: BusinessRequest = {
    ...current,
    status,
    adminResponse,
    adminUserId,
    respondedAt: new Date().toISOString(),
  };

  businessRequests.put(id, updated);
  return updated;
}

export function deleteBusinessRequest(id: string): void {
  const { businessRequests } = getLmdb();
  businessRequests.remove(id);
}
