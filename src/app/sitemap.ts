import type { MetadataRoute } from "next";

import { listBusinesses } from "@/lib/db/businesses";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const locales = ["en", "ar"] as const;
const staticPaths = [
  "",
  "about",
  "contact",
  "businesses",
  "categories",
  "loyalty",
  "marketing-platform",
  "store",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      const url = path ? `${baseUrl}/${locale}/${path}` : `${baseUrl}/${locale}`;
      items.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path ? 0.7 : 1,
      });
    }
  }

  const businesses = await listBusinesses();
  for (const b of businesses) {
    for (const locale of locales) {
      items.push({
        url: `${baseUrl}/${locale}/businesses/${encodeURIComponent(b.slug)}`,
        lastModified: new Date(b.updatedAt),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return items;
}
