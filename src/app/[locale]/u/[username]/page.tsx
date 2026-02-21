import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByUsername } from "@/lib/db/businesses";
import { getUserByUsername } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import PublicBusinessPage from "@/app/[locale]/businesses/[slug]/page";
import ExplorerBusinessPage from "@/app/[locale]/explorer/[slug]/page";
import { UserProfilePage } from "./UserProfilePage";

function getAbsoluteUrl(pathOrUrl: string | undefined) {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}): Promise<Metadata> {
  const { locale, username } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";
  const decodedUsername = decodeURIComponent(username);
  const handle = decodedUsername.replace(/^@/, "").trim().toLowerCase();

  const business = await getBusinessByUsername(handle);
  if (business) {
    const businessName = ar ? business.name.ar : business.name.en;
    const title = businessName;
    const description = (ar ? business.description?.ar : business.description?.en)?.trim()
      || (ar
        ? `تعرف على ${businessName} وتفاصيل الخدمات وطرق التواصل.`
        : `Explore ${businessName}, its services, and contact details.`);
    const previewImage =
      getAbsoluteUrl(business.media?.banner)
      ?? getAbsoluteUrl(business.media?.cover)
      ?? getAbsoluteUrl(business.media?.logo)
      ?? getAbsoluteUrl("/images/sbc.svg");
    const canonical = `/${locale}/@${handle}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "article",
        locale: ar ? "ar_OM" : "en_US",
        url: canonical,
        title,
        description,
        images: previewImage
          ? [
              {
                url: previewImage,
                alt: businessName,
                width: 1200,
                height: 630,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: previewImage ? [previewImage] : undefined,
      },
    };
  }

  const user = await getUserByUsername(handle);
  if (user) {
    const title = ar ? `الملف الشخصي • ${user.displayName}` : `${user.displayName} • Profile`;
    const description = ar
      ? `الملف الشخصي للمستخدم ${user.displayName}.`
      : `Public profile of ${user.displayName}.`;
    const canonical = `/${locale}/@${handle}`;

    return {
      title,
      description,
      alternates: { canonical },
    };
  }

  return {};
}

export default async function HandlePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  if (!isLocale(locale)) notFound();

  const decodedUsername = decodeURIComponent(username);
  const handle = decodedUsername.replace(/^@/, "").trim().toLowerCase();
  
  // Try business first
  const business = await getBusinessByUsername(handle);
  if (business) {
    const user = await getCurrentUser();
    if (user) {
      return ExplorerBusinessPage({
        params: Promise.resolve({ locale, slug: business.slug }),
      });
    }
    return PublicBusinessPage({
      params: Promise.resolve({ locale, slug: business.slug }),
    });
  }

  // Try user
  const targetUser = await getUserByUsername(handle);
  if (targetUser) {
    return <UserProfilePage locale={locale as Locale} user={targetUser} />;
  }

  notFound();
}
