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
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
};

const requestSchema = z.object({
  userId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000).optional(),
  categoryId: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email().optional(),
  website: z.string().trim().min(3).max(200).optional(),
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
    phone: data.phone,
    email: data.email,
    website: data.website,
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
