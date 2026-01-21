import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByUsername } from "@/lib/db/businesses";
import { isLocale } from "@/lib/i18n/locales";
import PublicBusinessPage from "@/app/[locale]/businesses/[slug]/page";
import ExplorerBusinessPage from "@/app/[locale]/explorer/[slug]/page";

export default async function BusinessHandlePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  if (!isLocale(locale)) notFound();

  const handle = username.replace(/^@/, "").trim().toLowerCase();
  const business = getBusinessByUsername(handle);
  if (!business) notFound();

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
