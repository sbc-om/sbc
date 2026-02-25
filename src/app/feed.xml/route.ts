import { headers } from "next/headers";

import { listBusinesses } from "@/lib/db/businesses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getBaseUrl() {
  const h = (await headers()) as Headers;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = await getBaseUrl();
  const businesses = await listBusinesses();
  const now = new Date().toUTCString();

  const staticItems = [
    {
      title: "Smart Business Center",
      link: `${baseUrl}/en`,
      description: "Official homepage for Smart Business Center (SBC).",
      pubDate: now,
    },
    {
      title: "مركز الأعمال الذكية",
      link: `${baseUrl}/ar`,
      description: "الصفحة الرئيسية لمركز الأعمال الذكية (SBC).",
      pubDate: now,
    },
    {
      title: "Business Directory",
      link: `${baseUrl}/en/businesses`,
      description: "Browse all businesses in the SBC directory.",
      pubDate: now,
    },
    {
      title: "دليل الأعمال",
      link: `${baseUrl}/ar/businesses`,
      description: "تصفح جميع الأنشطة التجارية في دليل SBC.",
      pubDate: now,
    },
  ];

  function buildBusinessItem(locale: "en" | "ar", b: Awaited<ReturnType<typeof listBusinesses>>[number]) {
    const name = b.name[locale];
    const description = b.description?.[locale] || name;
    const link = `${baseUrl}/${locale}/businesses/${encodeURIComponent(b.slug)}`;
    const tags = [b.category, b.city, ...(b.tags || [])].filter(Boolean) as string[];

    return {
      title: name,
      link,
      description,
      pubDate: new Date(b.updatedAt).toUTCString(),
      categories: tags,
    };
  }

  const businessItems = businesses.flatMap((b) => [buildBusinessItem("en", b), buildBusinessItem("ar", b)]);

  const itemsXml = [...staticItems, ...businessItems]
    .map((item) => {
      const categories = (item as { categories?: string[] }).categories;
      const categoriesXml = Array.isArray(categories)
        ? categories.map((c) => `<category>${escapeXml(c)}</category>`).join("")
        : "";

      return `
      <item>
        <title>${escapeXml(item.title)}</title>
        <link>${escapeXml(item.link)}</link>
        <guid>${escapeXml(item.link)}</guid>
        <description>${escapeXml(item.description)}</description>
        <pubDate>${escapeXml(item.pubDate)}</pubDate>
        ${categoriesXml}
      </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml("Smart Business Center Feed")}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml("Clean, structured feed of SBC website pages and businesses.")}</description>
    <language>en</language>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
