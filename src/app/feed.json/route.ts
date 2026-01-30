import { headers } from "next/headers";

import { listBusinesses } from "@/lib/db/businesses";

export const runtime = "nodejs";

async function getBaseUrl() {
  const h = (await headers()) as Headers;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET() {
  const baseUrl = await getBaseUrl();

  const businesses = await listBusinesses();
  const nowIso = new Date().toISOString();

  const staticItems = [
    {
      id: "home",
      title: "Smart Business Center",
      url: `${baseUrl}/en`,
      content_text: "Official homepage for Smart Business Center (SBC).",
      date_modified: nowIso,
      language: "en",
    },
    {
      id: "home-ar",
      title: "مركز الأعمال الذكية",
      url: `${baseUrl}/ar`,
      content_text: "الصفحة الرئيسية لمركز الأعمال الذكية (SBC).",
      date_modified: nowIso,
      language: "ar",
    },
    {
      id: "businesses",
      title: "Business Directory",
      url: `${baseUrl}/en/businesses`,
      content_text: "Browse all businesses in the SBC directory.",
      date_modified: nowIso,
      language: "en",
    },
    {
      id: "businesses-ar",
      title: "دليل الأعمال",
      url: `${baseUrl}/ar/businesses`,
      content_text: "تصفح جميع الأنشطة التجارية في دليل SBC.",
      date_modified: nowIso,
      language: "ar",
    },
  ];

  function buildBusinessItem(locale: "en" | "ar", b: Awaited<ReturnType<typeof listBusinesses>>[number]) {
    const name = b.name[locale];
    const description = b.description?.[locale] || name;
    const url = `${baseUrl}/${locale}/businesses/${encodeURIComponent(b.slug)}`;
    const image = b.media?.cover || b.media?.banner || b.media?.logo || undefined;
    const tags = [b.category, b.city, ...(b.tags || [])].filter(Boolean) as string[];

    const labels =
      locale === "ar"
        ? {
            category: "التصنيف",
            city: "المدينة",
            address: "العنوان",
            phone: "الهاتف",
            website: "الموقع",
            email: "البريد",
          }
        : {
            category: "Category",
            city: "City",
            address: "Address",
            phone: "Phone",
            website: "Website",
            email: "Email",
          };

    const details = [
      b.category ? `${labels.category}: ${b.category}` : null,
      b.city ? `${labels.city}: ${b.city}` : null,
      b.address ? `${labels.address}: ${b.address}` : null,
      b.phone ? `${labels.phone}: ${b.phone}` : null,
      b.website ? `${labels.website}: ${b.website}` : null,
      b.email ? `${labels.email}: ${b.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `${b.id}:${locale}`,
      url,
      external_url: b.website || undefined,
      title: name,
      summary: [b.category, b.city].filter(Boolean).join(" • ") || undefined,
      content_text: [description, details].filter(Boolean).join("\n\n"),
      date_published: b.createdAt,
      date_modified: b.updatedAt,
      tags: tags.length ? tags : undefined,
      image,
      language: locale,
      authors: [{ name }],
    };
  }

  const businessItems = businesses.flatMap((b) => [buildBusinessItem("en", b), buildBusinessItem("ar", b)]);

  const payload = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Smart Business Center Feed",
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    description: "Clean, structured feed of SBC website pages and businesses.",
    language: "en",
    icon: `${baseUrl}/favicon-32x32.png`,
    favicon: `${baseUrl}/favicon.ico`,
    items: [...staticItems, ...businessItems],
  };

  return Response.json(payload, {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
