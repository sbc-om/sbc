import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import type { Website, WebsitePage, WebsitePackage } from "./types";

/* ─── Package from subscription slug ───────────────────────── */

/**
 * Derives the website package tier from a store product slug.
 * e.g. "website-professional-monthly" → "professional"
 */
export function packageFromProductSlug(productSlug: string): WebsitePackage {
  if (productSlug.includes("enterprise")) return "enterprise";
  if (productSlug.includes("professional")) return "professional";
  return "starter";
}

/* ─── Zod Schemas ──────────────────────────────────────────── */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const localizedStringSchema = z.object({
  en: z.string().trim(),
  ar: z.string().trim(),
});

export const websiteInputSchema = z.object({
  slug: slugSchema,
  customDomain: z.string().trim().optional(),
  title: localizedStringSchema,
  tagline: localizedStringSchema.optional(),
  metaDescription: localizedStringSchema.optional(),
  package: z.enum(["starter", "professional", "enterprise"]).default("starter"),
  isPublished: z.boolean().default(false),
  templateId: z.string().default("minimal"),
  branding: z.object({
    primaryColor: z.string().default("#2563eb"),
    secondaryColor: z.string().default("#7c3aed"),
    fontFamily: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
    ogImageUrl: z.string().optional(),
  }).default({ primaryColor: "#2563eb", secondaryColor: "#7c3aed" }),
  navigation: z.array(z.any()).default([]),
  socials: z.object({
    instagram: z.string().optional(),
    x: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    whatsapp: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  footerText: localizedStringSchema.optional(),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    mapLatitude: z.number().optional(),
    mapLongitude: z.number().optional(),
  }).optional(),
  analytics: z.object({
    googleAnalyticsId: z.string().optional(),
    facebookPixelId: z.string().optional(),
    customHeadCode: z.string().optional(),
  }).optional(),
});

export type WebsiteInput = z.infer<typeof websiteInputSchema>;

export const websitePageInputSchema = z.object({
  slug: slugSchema,
  title: localizedStringSchema,
  isHomepage: z.boolean().default(false),
  blocks: z.array(z.any()).default([]),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }).optional(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});

export type WebsitePageInput = z.infer<typeof websitePageInputSchema>;

/* ─── Row Mappers ──────────────────────────────────────────── */

type WebsiteRow = {
  id: string;
  owner_id: string;
  slug: string;
  custom_domain: string | null;
  title_en: string | null;
  title_ar: string | null;
  tagline_en: string | null;
  tagline_ar: string | null;
  meta_description_en: string | null;
  meta_description_ar: string | null;
  package: WebsitePackage | null;
  is_published: boolean | null;
  template_id: string | null;
  branding: Website["branding"] | null;
  navigation: Website["navigation"] | null;
  socials: Website["socials"] | null;
  footer_text_en: string | null;
  footer_text_ar: string | null;
  contact: Website["contact"] | null;
  analytics: Website["analytics"] | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type WebsitePageRow = {
  id: string;
  website_id: string;
  slug: string;
  title_en: string | null;
  title_ar: string | null;
  is_homepage: boolean | null;
  blocks: WebsitePage["blocks"] | null;
  seo: WebsitePage["seo"] | null;
  sort_order: number | null;
  is_published: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToWebsite(row: WebsiteRow): Website {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    customDomain: row.custom_domain || undefined,
    title: { en: row.title_en || "", ar: row.title_ar || "" },
    tagline: row.tagline_en || row.tagline_ar
      ? { en: row.tagline_en || "", ar: row.tagline_ar || "" }
      : undefined,
    metaDescription: row.meta_description_en || row.meta_description_ar
      ? { en: row.meta_description_en || "", ar: row.meta_description_ar || "" }
      : undefined,
    package: row.package || "starter",
    isPublished: row.is_published ?? false,
    templateId: row.template_id || "minimal",
    branding: row.branding || { primaryColor: "#2563eb", secondaryColor: "#7c3aed" },
    navigation: row.navigation || [],
    socials: row.socials || undefined,
    footerText: row.footer_text_en || row.footer_text_ar
      ? { en: row.footer_text_en || "", ar: row.footer_text_ar || "" }
      : undefined,
    contact: row.contact || undefined,
    analytics: row.analytics || undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToWebsitePage(row: WebsitePageRow): WebsitePage {
  return {
    id: row.id,
    websiteId: row.website_id,
    slug: row.slug,
    title: { en: row.title_en || "", ar: row.title_ar || "" },
    isHomepage: row.is_homepage ?? false,
    blocks: row.blocks || [],
    seo: row.seo || undefined,
    sortOrder: row.sort_order ?? 0,
    isPublished: row.is_published ?? true,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

/* ─── Website CRUD ─────────────────────────────────────────── */

export async function createWebsite(ownerId: string, input: WebsiteInput): Promise<Website> {
  const data = websiteInputSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  // Check slug uniqueness
  const existingSlug = await query(`SELECT id FROM websites WHERE slug = $1`, [data.slug]);
  if (existingSlug.rows.length > 0) throw new Error("SLUG_TAKEN");

  // Check domain uniqueness if provided
  if (data.customDomain) {
    const existingDomain = await query(`SELECT id FROM websites WHERE custom_domain = $1`, [data.customDomain]);
    if (existingDomain.rows.length > 0) throw new Error("DOMAIN_TAKEN");
  }

  const result = await query(`
    INSERT INTO websites (
      id, owner_id, slug, custom_domain,
      title_en, title_ar, tagline_en, tagline_ar,
      meta_description_en, meta_description_ar,
      package, is_published, template_id,
      branding, navigation, socials,
      footer_text_en, footer_text_ar,
      contact, analytics,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10,
      $11, $12, $13,
      $14, $15, $16,
      $17, $18,
      $19, $20,
      $21, $21
    ) RETURNING *
  `, [
    id, ownerId, data.slug, data.customDomain || null,
    data.title.en, data.title.ar, data.tagline?.en || null, data.tagline?.ar || null,
    data.metaDescription?.en || null, data.metaDescription?.ar || null,
    data.package, data.isPublished, data.templateId,
    JSON.stringify(data.branding), JSON.stringify(data.navigation), data.socials ? JSON.stringify(data.socials) : null,
    data.footerText?.en || null, data.footerText?.ar || null,
    data.contact ? JSON.stringify(data.contact) : null, data.analytics ? JSON.stringify(data.analytics) : null,
    now,
  ]);

  // Create default homepage
  await createWebsitePage(id, {
    slug: "home",
    title: { en: "Home", ar: "الرئيسية" },
    isHomepage: true,
    blocks: [
      {
        type: "hero",
        data: {
          heading: data.title,
          subheading: data.tagline || { en: "Welcome to our website", ar: "مرحباً بكم في موقعنا" },
        },
      },
    ],
    sortOrder: 0,
    isPublished: true,
  });

  return rowToWebsite(result.rows[0]);
}

export async function getWebsiteById(id: string): Promise<Website | null> {
  const result = await query(`SELECT * FROM websites WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToWebsite(result.rows[0]) : null;
}

export async function getWebsiteBySlug(slug: string): Promise<Website | null> {
  const result = await query(`SELECT * FROM websites WHERE slug = $1`, [slug]);
  return result.rows.length > 0 ? rowToWebsite(result.rows[0]) : null;
}

export async function getWebsiteByDomain(domain: string): Promise<Website | null> {
  const result = await query(`SELECT * FROM websites WHERE custom_domain = $1`, [domain]);
  return result.rows.length > 0 ? rowToWebsite(result.rows[0]) : null;
}

export async function getWebsiteByOwnerId(ownerId: string): Promise<Website | null> {
  const result = await query(`SELECT * FROM websites WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`, [ownerId]);
  return result.rows.length > 0 ? rowToWebsite(result.rows[0]) : null;
}

export async function listWebsitesByOwner(ownerId: string): Promise<Website[]> {
  const result = await query(`SELECT * FROM websites WHERE owner_id = $1 ORDER BY created_at DESC`, [ownerId]);
  return result.rows.map(rowToWebsite);
}

export async function listAllWebsites(): Promise<Website[]> {
  const result = await query(`SELECT * FROM websites ORDER BY created_at DESC`);
  return result.rows.map(rowToWebsite);
}

export async function listPublishedWebsites(): Promise<Website[]> {
  const result = await query(`SELECT * FROM websites WHERE is_published = true ORDER BY created_at DESC`);
  return result.rows.map(rowToWebsite);
}

export async function updateWebsite(id: string, input: Partial<WebsiteInput>): Promise<Website> {
  const existing = await getWebsiteById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const now = new Date();

  // Check slug uniqueness if changing
  if (input.slug && input.slug !== existing.slug) {
    const existingSlug = await query(`SELECT id FROM websites WHERE slug = $1 AND id != $2`, [input.slug, id]);
    if (existingSlug.rows.length > 0) throw new Error("SLUG_TAKEN");
  }

  // Check domain uniqueness if changing
  if (input.customDomain && input.customDomain !== existing.customDomain) {
    const existingDomain = await query(`SELECT id FROM websites WHERE custom_domain = $1 AND id != $2`, [input.customDomain, id]);
    if (existingDomain.rows.length > 0) throw new Error("DOMAIN_TAKEN");
  }

  const result = await query(`
    UPDATE websites SET
      slug = COALESCE($2, slug),
      custom_domain = $3,
      title_en = COALESCE($4, title_en),
      title_ar = COALESCE($5, title_ar),
      tagline_en = $6,
      tagline_ar = $7,
      meta_description_en = $8,
      meta_description_ar = $9,
      package = COALESCE($10, package),
      is_published = COALESCE($11, is_published),
      template_id = COALESCE($12, template_id),
      branding = COALESCE($13, branding),
      navigation = COALESCE($14, navigation),
      socials = $15,
      footer_text_en = $16,
      footer_text_ar = $17,
      contact = $18,
      analytics = $19,
      updated_at = $20
    WHERE id = $1
    RETURNING *
  `, [
    id,
    input.slug || null,
    input.customDomain !== undefined ? (input.customDomain || null) : existing.customDomain || null,
    input.title?.en || null,
    input.title?.ar || null,
    input.tagline?.en ?? existing.tagline?.en ?? null,
    input.tagline?.ar ?? existing.tagline?.ar ?? null,
    input.metaDescription?.en ?? existing.metaDescription?.en ?? null,
    input.metaDescription?.ar ?? existing.metaDescription?.ar ?? null,
    input.package || null,
    input.isPublished ?? null,
    input.templateId || null,
    input.branding ? JSON.stringify(input.branding) : null,
    input.navigation ? JSON.stringify(input.navigation) : null,
    input.socials !== undefined ? (input.socials ? JSON.stringify(input.socials) : null) : (existing.socials ? JSON.stringify(existing.socials) : null),
    input.footerText?.en ?? existing.footerText?.en ?? null,
    input.footerText?.ar ?? existing.footerText?.ar ?? null,
    input.contact !== undefined ? (input.contact ? JSON.stringify(input.contact) : null) : (existing.contact ? JSON.stringify(existing.contact) : null),
    input.analytics !== undefined ? (input.analytics ? JSON.stringify(input.analytics) : null) : (existing.analytics ? JSON.stringify(existing.analytics) : null),
    now,
  ]);

  return rowToWebsite(result.rows[0]);
}

export async function deleteWebsite(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM websites WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function publishWebsite(id: string, isPublished: boolean): Promise<Website> {
  const result = await query(`
    UPDATE websites SET is_published = $2, updated_at = $3 WHERE id = $1 RETURNING *
  `, [id, isPublished, new Date()]);
  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToWebsite(result.rows[0]);
}

/* ─── Website Page CRUD ────────────────────────────────────── */

export async function createWebsitePage(websiteId: string, input: WebsitePageInput): Promise<WebsitePage> {
  const data = websitePageInputSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  // If this is homepage, unset other homepages
  if (data.isHomepage) {
    await query(`UPDATE website_pages SET is_homepage = false WHERE website_id = $1`, [websiteId]);
  }

  const result = await query(`
    INSERT INTO website_pages (
      id, website_id, slug, title_en, title_ar,
      is_homepage, blocks, seo, sort_order, is_published,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
    RETURNING *
  `, [
    id, websiteId, data.slug, data.title.en, data.title.ar,
    data.isHomepage, JSON.stringify(data.blocks), data.seo ? JSON.stringify(data.seo) : null,
    data.sortOrder, data.isPublished,
    now,
  ]);

  return rowToWebsitePage(result.rows[0]);
}

export async function getWebsitePageById(id: string): Promise<WebsitePage | null> {
  const result = await query(`SELECT * FROM website_pages WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToWebsitePage(result.rows[0]) : null;
}

export async function getWebsitePageBySlug(websiteId: string, slug: string): Promise<WebsitePage | null> {
  const result = await query(`SELECT * FROM website_pages WHERE website_id = $1 AND slug = $2`, [websiteId, slug]);
  return result.rows.length > 0 ? rowToWebsitePage(result.rows[0]) : null;
}

export async function getWebsiteHomepage(websiteId: string): Promise<WebsitePage | null> {
  const result = await query(`SELECT * FROM website_pages WHERE website_id = $1 AND is_homepage = true LIMIT 1`, [websiteId]);
  return result.rows.length > 0 ? rowToWebsitePage(result.rows[0]) : null;
}

export async function listWebsitePages(websiteId: string): Promise<WebsitePage[]> {
  const result = await query(`SELECT * FROM website_pages WHERE website_id = $1 ORDER BY sort_order ASC, created_at ASC`, [websiteId]);
  return result.rows.map(rowToWebsitePage);
}

export async function updateWebsitePage(id: string, input: Partial<WebsitePageInput>): Promise<WebsitePage> {
  const existing = await getWebsitePageById(id);
  if (!existing) throw new Error("NOT_FOUND");

  const now = new Date();

  // If making this homepage, unset others
  if (input.isHomepage) {
    await query(`UPDATE website_pages SET is_homepage = false WHERE website_id = $1 AND id != $2`, [existing.websiteId, id]);
  }

  const result = await query(`
    UPDATE website_pages SET
      slug = COALESCE($2, slug),
      title_en = COALESCE($3, title_en),
      title_ar = COALESCE($4, title_ar),
      is_homepage = COALESCE($5, is_homepage),
      blocks = COALESCE($6, blocks),
      seo = $7,
      sort_order = COALESCE($8, sort_order),
      is_published = COALESCE($9, is_published),
      updated_at = $10
    WHERE id = $1
    RETURNING *
  `, [
    id,
    input.slug || null,
    input.title?.en || null,
    input.title?.ar || null,
    input.isHomepage ?? null,
    input.blocks ? JSON.stringify(input.blocks) : null,
    input.seo !== undefined ? (input.seo ? JSON.stringify(input.seo) : null) : (existing.seo ? JSON.stringify(existing.seo) : null),
    input.sortOrder ?? null,
    input.isPublished ?? null,
    now,
  ]);

  return rowToWebsitePage(result.rows[0]);
}

export async function deleteWebsitePage(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM website_pages WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function countWebsitePages(websiteId: string): Promise<number> {
  const result = await query(`SELECT COUNT(*)::int AS count FROM website_pages WHERE website_id = $1`, [websiteId]);
  return result.rows[0]?.count ?? 0;
}

/* ─── Domain Checks ────────────────────────────────────────── */

export async function checkWebsiteDomainAvailability(domain: string, excludeWebsiteId?: string): Promise<boolean> {
  const sql = excludeWebsiteId
    ? `SELECT id FROM websites WHERE custom_domain = $1 AND id != $2`
    : `SELECT id FROM websites WHERE custom_domain = $1`;
  const params = excludeWebsiteId ? [domain, excludeWebsiteId] : [domain];
  const result = await query(sql, params);
  return result.rows.length === 0;
}

export async function checkWebsiteSlugAvailability(slug: string, excludeWebsiteId?: string): Promise<boolean> {
  const sql = excludeWebsiteId
    ? `SELECT id FROM websites WHERE slug = $1 AND id != $2`
    : `SELECT id FROM websites WHERE slug = $1`;
  const params = excludeWebsiteId ? [slug, excludeWebsiteId] : [slug];
  const result = await query(sql, params);
  return result.rows.length === 0;
}
