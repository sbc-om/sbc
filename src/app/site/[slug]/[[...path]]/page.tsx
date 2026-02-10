import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { getWebsiteBySlug, getWebsiteHomepage, getWebsitePageBySlug, listWebsitePages } from "@/lib/db/websites";
import type { Locale } from "@/lib/db/types";
import WebsiteRenderer from "../WebsiteRenderer";

type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, path } = await params;
  const website = await getWebsiteBySlug(slug);
  if (!website || !website.isPublished) return {};

  const pageSlug = path?.[0];
  const page = pageSlug
    ? await getWebsitePageBySlug(website.id, pageSlug)
    : await getWebsiteHomepage(website.id);

  const headersList = await headers();
  const xLocale = headersList.get("x-locale") as Locale | null;
  const locale: Locale = xLocale === "ar" ? "ar" : "en";

  const title = page
    ? page.seo?.title || page.title[locale] || page.title.en
    : website.title[locale] || website.title.en;
  const description = page?.seo?.description
    || website.metaDescription?.[locale]
    || website.metaDescription?.en
    || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page?.seo?.ogImage
        ? [page.seo.ogImage]
        : website.branding.ogImageUrl
          ? [website.branding.ogImageUrl]
          : [],
    },
  };
}

export default async function SitePage({ params }: Props) {
  const { slug, path } = await params;

  /* Determine locale from x-locale header (set by proxy rewrite) */
  const headersList = await headers();
  const xLocale = headersList.get("x-locale") as Locale | null;
  const locale: Locale = xLocale === "ar" ? "ar" : "en";

  const website = await getWebsiteBySlug(slug);
  if (!website || !website.isPublished) notFound();

  /* Resolve the page — homepage or a sub-page by slug */
  const pageSlug = path?.[0];
  const page = pageSlug
    ? await getWebsitePageBySlug(website.id, pageSlug)
    : await getWebsiteHomepage(website.id);

  if (!page || !page.isPublished) notFound();

  const pages = await listWebsitePages(website.id);

  return (
    <WebsiteRenderer
      website={website}
      page={page}
      pages={pages.filter((p) => p.isPublished)}
      locale={locale}
    />
  );
}
