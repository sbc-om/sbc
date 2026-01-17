import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getUserById } from "@/lib/db/users";
import { getFollowedCategoryIds } from "@/lib/db/follows";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { getBusinessesFollowersCount } from "@/lib/db/businessEngagement";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { ProfileClient } from "./ProfileClient";

export const runtime = "nodejs";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireUser(locale as Locale);
  const user = getUserById(auth.id);
  if (!user) notFound();

  // Calculate stats
  const followedCategories = getFollowedCategoryIds(auth.id);
  const ownedBusinesses = listBusinessesByOwner(auth.id);
  const businessIds = ownedBusinesses.map(b => b.id);
  const followersCount = businessIds.length > 0 ? getBusinessesFollowersCount(businessIds) : 0;

  const initial = {
    email: user.email,
    phone: user.phone ?? "",
    pendingEmail: user.pendingEmail ?? null,
    pendingPhone: user.pendingPhone ?? null,
    approvalStatus: user.approvalStatus ?? "approved",
    approvalReason: user.approvalReason ?? null,
    role: user.role,
    fullName: user.fullName,
    displayName: user.displayName ?? user.email.split("@")[0],
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? null,
    stats: {
      followedCategories: followedCategories.length,
      followers: followersCount,
      businesses: ownedBusinesses.length,
    },
  };

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "ar" ? "الملف الشخصي" : "Profile"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "إدارة ملفك الشخصي." : "Manage your profile."}
          </p>
        </div>
      </div>

      <ProfileClient locale={locale as Locale} initial={initial} />
    </AppPage>
  );
}
