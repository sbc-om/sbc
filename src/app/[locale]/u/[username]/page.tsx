import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByUsername } from "@/lib/db/businesses";
import { getUserByUsername } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import PublicBusinessPage from "@/app/[locale]/businesses/[slug]/page";
import ExplorerBusinessPage from "@/app/[locale]/explorer/[slug]/page";
import { UserProfilePage } from "./UserProfilePage";

export default async function HandlePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  if (!isLocale(locale)) notFound();

  const handle = username.replace(/^@/, "").trim().toLowerCase();
  
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
