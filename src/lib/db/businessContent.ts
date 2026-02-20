import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import type { BusinessNews, BusinessProduct } from "./types";

type ModerationStatus = "pending" | "approved" | "rejected";

let businessContentSchemaPromise: Promise<void> | null = null;

async function ensureBusinessContentSchema() {
  if (!businessContentSchemaPromise) {
    businessContentSchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS business_news (
          id TEXT PRIMARY KEY,
          business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
          title_en TEXT NOT NULL,
          title_ar TEXT NOT NULL,
          content_en TEXT NOT NULL,
          content_ar TEXT NOT NULL,
          image_url TEXT,
          link_url TEXT,
          is_published BOOLEAN NOT NULL DEFAULT true,
          moderation_status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`ALTER TABLE business_news ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending';`);
      await query(`ALTER TABLE business_news ADD COLUMN IF NOT EXISTS reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;`);
      await query(`ALTER TABLE business_news ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;`);
      await query(`ALTER TABLE business_news ADD COLUMN IF NOT EXISTS link_url TEXT;`);

      await query(`CREATE INDEX IF NOT EXISTS idx_business_news_business_id ON business_news(business_id);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_business_news_created_at ON business_news(created_at DESC);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_business_news_moderation_status ON business_news(moderation_status);`);

      await query(`
        CREATE TABLE IF NOT EXISTS business_products (
          id TEXT PRIMARY KEY,
          business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
          slug TEXT NOT NULL,
          name_en TEXT NOT NULL,
          name_ar TEXT NOT NULL,
          description_en TEXT,
          description_ar TEXT,
          image_url TEXT,
          link_url TEXT,
          price DECIMAL(12, 3) NOT NULL DEFAULT 0,
          currency TEXT NOT NULL DEFAULT 'OMR',
          is_available BOOLEAN NOT NULL DEFAULT true,
          moderation_status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(business_id, slug)
        );
      `);

      await query(`ALTER TABLE business_products ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending';`);
      await query(`ALTER TABLE business_products ADD COLUMN IF NOT EXISTS reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;`);
      await query(`ALTER TABLE business_products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;`);
      await query(`ALTER TABLE business_products ADD COLUMN IF NOT EXISTS link_url TEXT;`);

      await query(`CREATE INDEX IF NOT EXISTS idx_business_products_business_id ON business_products(business_id);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_business_products_available ON business_products(is_available);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_business_products_sort_order ON business_products(sort_order);`);
      await query(`CREATE INDEX IF NOT EXISTS idx_business_products_moderation_status ON business_products(moderation_status);`);
    })();
  }

  await businessContentSchemaPromise;
}

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

const mediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/"),
    "Invalid media URL"
  );

const linkUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/"),
    "Invalid link URL"
  );

const newsInputSchema = z.object({
  businessId: z.string().trim().min(1),
  title: localizedStringSchema,
  content: localizedStringSchema,
  imageUrl: mediaUrlSchema.optional(),
  linkUrl: linkUrlSchema.optional(),
  isPublished: z.boolean().default(true),
});

const newsPatchSchema = z.object({
  title: localizedStringSchema.optional(),
  content: localizedStringSchema.optional(),
  imageUrl: mediaUrlSchema.nullable().optional(),
  linkUrl: linkUrlSchema.nullable().optional(),
  isPublished: z.boolean().optional(),
});

const productSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const productInputSchema = z.object({
  businessId: z.string().trim().min(1),
  slug: productSlugSchema.optional(),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  imageUrl: mediaUrlSchema.optional(),
  linkUrl: linkUrlSchema.optional(),
  price: z.number().min(0),
  currency: z.string().trim().min(1).default("OMR"),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const productPatchSchema = z.object({
  name: localizedStringSchema.optional(),
  description: localizedStringSchema.nullable().optional(),
  imageUrl: mediaUrlSchema.nullable().optional(),
  linkUrl: linkUrlSchema.nullable().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type BusinessNewsInput = z.infer<typeof newsInputSchema>;
export type BusinessProductInput = z.infer<typeof productInputSchema>;

type BusinessNewsRow = {
  id: string;
  business_id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  image_url: string | null;
  link_url: string | null;
  is_published: boolean | null;
  moderation_status: ModerationStatus | null;
  reviewed_by_user_id: string | null;
  reviewed_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type BusinessProductRow = {
  id: string;
  business_id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  price: string | number | null;
  currency: string | null;
  is_available: boolean | null;
  moderation_status: ModerationStatus | null;
  reviewed_by_user_id: string | null;
  reviewed_at: Date | null;
  sort_order: number | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToBusinessNews(row: BusinessNewsRow): BusinessNews {
  return {
    id: row.id,
    businessId: row.business_id,
    title: {
      en: row.title_en,
      ar: row.title_ar,
    },
    content: {
      en: row.content_en,
      ar: row.content_ar,
    },
    imageUrl: row.image_url ?? undefined,
    linkUrl: row.link_url ?? undefined,
    isPublished: row.is_published ?? true,
    moderationStatus: row.moderation_status ?? "pending",
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at?.toISOString(),
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToBusinessProduct(row: BusinessProductRow): BusinessProduct {
  const hasDescription = !!(row.description_en || row.description_ar);

  return {
    id: row.id,
    businessId: row.business_id,
    slug: row.slug,
    name: {
      en: row.name_en,
      ar: row.name_ar,
    },
    description: hasDescription
      ? {
          en: row.description_en || "",
          ar: row.description_ar || "",
        }
      : undefined,
    imageUrl: row.image_url ?? undefined,
    linkUrl: row.link_url ?? undefined,
    price: parseFloat(String(row.price ?? "0")) || 0,
    currency: row.currency || "OMR",
    isAvailable: row.is_available ?? true,
    moderationStatus: row.moderation_status ?? "pending",
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    reviewedAt: row.reviewed_at?.toISOString(),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function slugifyEnglish(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueBusinessProductSlug(
  businessId: string,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const exists = await query(
      `SELECT id FROM business_products WHERE business_id = $1 AND slug = $2`,
      [businessId, slug]
    );

    if (exists.rows.length === 0) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function listBusinessNews(
  businessId: string,
  options?: { publishedOnly?: boolean; approvedOnly?: boolean; limit?: number }
): Promise<BusinessNews[]> {
  await ensureBusinessContentSchema();
  const publishedOnly = options?.publishedOnly ?? true;
  const approvedOnly = options?.approvedOnly ?? true;
  const limit = options?.limit;

  const params: Array<string | number | boolean> = [businessId];
  let sql = `
    SELECT *
    FROM business_news
    WHERE business_id = $1
  `;

  if (publishedOnly) {
    sql += ` AND is_published = true`;
  }

  if (approvedOnly) {
    sql += ` AND moderation_status = 'approved'`;
  }

  sql += ` ORDER BY created_at DESC`;

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    params.push(Math.floor(limit));
    sql += ` LIMIT $${params.length}`;
  }

  const result = await query<BusinessNewsRow>(sql, params);
  return result.rows.map(rowToBusinessNews);
}

export async function createBusinessNews(input: BusinessNewsInput): Promise<BusinessNews> {
  await ensureBusinessContentSchema();
  const data = newsInputSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query<BusinessNewsRow>(
    `
      INSERT INTO business_news (
        id, business_id, title_en, title_ar, content_en, content_ar, image_url, link_url,
        is_published, moderation_status, reviewed_by_user_id, reviewed_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 'pending', NULL, NULL, $9, $9)
      RETURNING *
    `,
    [
      id,
      data.businessId,
      data.title.en,
      data.title.ar,
      data.content.en,
      data.content.ar,
      data.imageUrl ?? null,
      data.linkUrl ?? null,
      now,
    ]
  );

  return rowToBusinessNews(result.rows[0]);
}

export async function deleteBusinessNewsByBusiness(newsId: string, businessId: string): Promise<boolean> {
  await ensureBusinessContentSchema();
  const result = await query(
    `DELETE FROM business_news WHERE id = $1 AND business_id = $2`,
    [newsId, businessId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateBusinessNewsByBusiness(
  newsId: string,
  businessId: string,
  input: z.infer<typeof newsPatchSchema>
): Promise<BusinessNews | null> {
  await ensureBusinessContentSchema();
  const data = newsPatchSchema.parse(input);
  const imageTouched = data.imageUrl !== undefined;
  const linkTouched = data.linkUrl !== undefined;
  const contentEdited = !!(data.title || data.content || imageTouched || linkTouched);
  const result = await query<BusinessNewsRow>(
    `
      UPDATE business_news
      SET
        title_en = COALESCE($1, title_en),
        title_ar = COALESCE($2, title_ar),
        content_en = COALESCE($3, content_en),
        content_ar = COALESCE($4, content_ar),
        image_url = CASE WHEN $5 THEN $6 ELSE image_url END,
        link_url = CASE WHEN $7 THEN $8 ELSE link_url END,
        is_published = CASE WHEN $9 THEN false ELSE COALESCE($10, is_published) END,
        moderation_status = CASE WHEN $9 THEN 'pending' ELSE moderation_status END,
        reviewed_by_user_id = CASE WHEN $9 THEN NULL ELSE reviewed_by_user_id END,
        reviewed_at = CASE WHEN $9 THEN NULL ELSE reviewed_at END,
        updated_at = $11
      WHERE id = $12 AND business_id = $13
      RETURNING *
    `,
    [
      data.title?.en,
      data.title?.ar,
      data.content?.en,
      data.content?.ar,
      imageTouched,
      data.imageUrl ?? null,
      linkTouched,
      data.linkUrl ?? null,
      contentEdited,
      data.isPublished,
      new Date(),
      newsId,
      businessId,
    ]
  );

  return result.rows[0] ? rowToBusinessNews(result.rows[0]) : null;
}

export async function listBusinessProducts(
  businessId: string,
  options?: { availableOnly?: boolean; approvedOnly?: boolean; limit?: number }
): Promise<BusinessProduct[]> {
  await ensureBusinessContentSchema();
  const availableOnly = options?.availableOnly ?? true;
  const approvedOnly = options?.approvedOnly ?? true;
  const limit = options?.limit;

  const params: Array<string | number | boolean> = [businessId];
  let sql = `
    SELECT *
    FROM business_products
    WHERE business_id = $1
  `;

  if (availableOnly) {
    sql += ` AND is_available = true`;
  }

  if (approvedOnly) {
    sql += ` AND moderation_status = 'approved'`;
  }

  sql += ` ORDER BY sort_order ASC, created_at DESC`;

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    params.push(Math.floor(limit));
    sql += ` LIMIT $${params.length}`;
  }

  const result = await query<BusinessProductRow>(sql, params);
  return result.rows.map(rowToBusinessProduct);
}

export async function createBusinessProduct(input: BusinessProductInput): Promise<BusinessProduct> {
  await ensureBusinessContentSchema();
  const data = productInputSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const baseSlug = data.slug ?? slugifyEnglish(data.name.en);
  const safeBaseSlug = productSlugSchema.safeParse(baseSlug).success ? baseSlug : `item-${id.slice(0, 8)}`;
  const slug = await ensureUniqueBusinessProductSlug(data.businessId, safeBaseSlug);

  const result = await query<BusinessProductRow>(
    `
      INSERT INTO business_products (
        id, business_id, slug, name_en, name_ar, description_en, description_ar,
        image_url, link_url, price, currency, is_available, moderation_status, reviewed_by_user_id, reviewed_at,
        sort_order, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, 'pending', NULL, NULL, $12, $13, $13)
      RETURNING *
    `,
    [
      id,
      data.businessId,
      slug,
      data.name.en,
      data.name.ar,
      data.description?.en ?? null,
      data.description?.ar ?? null,
      data.imageUrl ?? null,
      data.linkUrl ?? null,
      data.price,
      data.currency,
      data.sortOrder,
      now,
    ]
  );

  return rowToBusinessProduct(result.rows[0]);
}

export async function deleteBusinessProductByBusiness(productId: string, businessId: string): Promise<boolean> {
  await ensureBusinessContentSchema();
  const result = await query(
    `DELETE FROM business_products WHERE id = $1 AND business_id = $2`,
    [productId, businessId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateBusinessProductByBusiness(
  productId: string,
  businessId: string,
  input: z.infer<typeof productPatchSchema>
): Promise<BusinessProduct | null> {
  await ensureBusinessContentSchema();
  const data = productPatchSchema.parse(input);
  const imageTouched = data.imageUrl !== undefined;
  const linkTouched = data.linkUrl !== undefined;
  const contentEdited = !!(data.name || data.description || imageTouched || linkTouched || data.price !== undefined || data.currency !== undefined);
  const result = await query<BusinessProductRow>(
    `
      UPDATE business_products
      SET
        name_en = COALESCE($1, name_en),
        name_ar = COALESCE($2, name_ar),
        description_en = COALESCE($3, description_en),
        description_ar = COALESCE($4, description_ar),
        image_url = CASE WHEN $5 THEN $6 ELSE image_url END,
        link_url = CASE WHEN $7 THEN $8 ELSE link_url END,
        price = COALESCE($9, price),
        currency = COALESCE($10, currency),
        is_available = CASE WHEN $11 THEN false ELSE COALESCE($12, is_available) END,
        moderation_status = CASE WHEN $11 THEN 'pending' ELSE moderation_status END,
        reviewed_by_user_id = CASE WHEN $11 THEN NULL ELSE reviewed_by_user_id END,
        reviewed_at = CASE WHEN $11 THEN NULL ELSE reviewed_at END,
        sort_order = COALESCE($13, sort_order),
        updated_at = $14
      WHERE id = $15 AND business_id = $16
      RETURNING *
    `,
    [
      data.name?.en,
      data.name?.ar,
      data.description?.en,
      data.description?.ar,
      imageTouched,
      data.imageUrl ?? null,
      linkTouched,
      data.linkUrl ?? null,
      data.price,
      data.currency,
      contentEdited,
      data.isAvailable,
      data.sortOrder,
      new Date(),
      productId,
      businessId,
    ]
  );

  return result.rows[0] ? rowToBusinessProduct(result.rows[0]) : null;
}

export type ModerationQueueNewsItem = BusinessNews & {
  businessSlug: string;
  businessName: { en: string; ar: string };
};

export type ModerationQueueProductItem = BusinessProduct & {
  businessSlug: string;
  businessName: { en: string; ar: string };
};

type ModerationQueueNewsRow = BusinessNewsRow & {
  business_slug: string;
  business_name_en: string;
  business_name_ar: string;
};

type ModerationQueueProductRow = BusinessProductRow & {
  business_slug: string;
  business_name_en: string;
  business_name_ar: string;
};

export async function listPendingBusinessNews(limit = 100): Promise<ModerationQueueNewsItem[]> {
  await ensureBusinessContentSchema();
  const result = await query<ModerationQueueNewsRow>(
    `
      SELECT n.*, b.slug AS business_slug, b.name_en AS business_name_en, b.name_ar AS business_name_ar
      FROM business_news n
      JOIN businesses b ON b.id = n.business_id
      WHERE n.moderation_status = 'pending'
      ORDER BY n.created_at ASC
      LIMIT $1
    `,
    [Math.max(1, Math.min(limit, 500))]
  );

  return result.rows.map((row) => ({
    ...rowToBusinessNews(row),
    businessSlug: row.business_slug,
    businessName: { en: row.business_name_en, ar: row.business_name_ar },
  }));
}

export async function listBusinessNewsModerationQueue(limit = 200): Promise<ModerationQueueNewsItem[]> {
  await ensureBusinessContentSchema();
  const result = await query<ModerationQueueNewsRow>(
    `
      SELECT n.*, b.slug AS business_slug, b.name_en AS business_name_en, b.name_ar AS business_name_ar
      FROM business_news n
      JOIN businesses b ON b.id = n.business_id
      ORDER BY
        CASE n.moderation_status
          WHEN 'pending' THEN 0
          WHEN 'rejected' THEN 1
          WHEN 'approved' THEN 2
          ELSE 3
        END,
        n.updated_at DESC,
        n.created_at DESC
      LIMIT $1
    `,
    [Math.max(1, Math.min(limit, 1000))]
  );

  return result.rows.map((row) => ({
    ...rowToBusinessNews(row),
    businessSlug: row.business_slug,
    businessName: { en: row.business_name_en, ar: row.business_name_ar },
  }));
}

export async function listPendingBusinessProducts(limit = 100): Promise<ModerationQueueProductItem[]> {
  await ensureBusinessContentSchema();
  const result = await query<ModerationQueueProductRow>(
    `
      SELECT p.*, b.slug AS business_slug, b.name_en AS business_name_en, b.name_ar AS business_name_ar
      FROM business_products p
      JOIN businesses b ON b.id = p.business_id
      WHERE p.moderation_status = 'pending'
      ORDER BY p.created_at ASC
      LIMIT $1
    `,
    [Math.max(1, Math.min(limit, 500))]
  );

  return result.rows.map((row) => ({
    ...rowToBusinessProduct(row),
    businessSlug: row.business_slug,
    businessName: { en: row.business_name_en, ar: row.business_name_ar },
  }));
}

export async function listBusinessProductsModerationQueue(limit = 200): Promise<ModerationQueueProductItem[]> {
  await ensureBusinessContentSchema();
  const result = await query<ModerationQueueProductRow>(
    `
      SELECT p.*, b.slug AS business_slug, b.name_en AS business_name_en, b.name_ar AS business_name_ar
      FROM business_products p
      JOIN businesses b ON b.id = p.business_id
      ORDER BY
        CASE p.moderation_status
          WHEN 'pending' THEN 0
          WHEN 'rejected' THEN 1
          WHEN 'approved' THEN 2
          ELSE 3
        END,
        p.updated_at DESC,
        p.created_at DESC
      LIMIT $1
    `,
    [Math.max(1, Math.min(limit, 1000))]
  );

  return result.rows.map((row) => ({
    ...rowToBusinessProduct(row),
    businessSlug: row.business_slug,
    businessName: { en: row.business_name_en, ar: row.business_name_ar },
  }));
}

export async function moderateBusinessNews(
  newsId: string,
  status: ModerationStatus,
  reviewerUserId: string
): Promise<BusinessNews | null> {
  await ensureBusinessContentSchema();
  const result = await query<BusinessNewsRow>(
    `
      UPDATE business_news
      SET
        moderation_status = $1,
        is_published = CASE WHEN $1 = 'approved' THEN true ELSE false END,
        reviewed_by_user_id = $2,
        reviewed_at = $3,
        updated_at = $3
      WHERE id = $4
      RETURNING *
    `,
    [status, reviewerUserId, new Date(), newsId]
  );

  return result.rows[0] ? rowToBusinessNews(result.rows[0]) : null;
}

export async function moderateBusinessProduct(
  productId: string,
  status: ModerationStatus,
  reviewerUserId: string
): Promise<BusinessProduct | null> {
  await ensureBusinessContentSchema();
  const result = await query<BusinessProductRow>(
    `
      UPDATE business_products
      SET
        moderation_status = $1,
        is_available = CASE WHEN $1 = 'approved' THEN true ELSE false END,
        reviewed_by_user_id = $2,
        reviewed_at = $3,
        updated_at = $3
      WHERE id = $4
      RETURNING *
    `,
    [status, reviewerUserId, new Date(), productId]
  );

  return result.rows[0] ? rowToBusinessProduct(result.rows[0]) : null;
}
