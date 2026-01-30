import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listLoyaltyProfiles } from "@/lib/db/loyalty";
import { listUsers } from "@/lib/db/users";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";

export const runtime = "nodejs";

export default async function AdminLoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const profiles = await listLoyaltyProfiles();
  const users = await listUsers();
  const usersById = new Map(users.map((u) => [u.id, u] as const));

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "برامج الولاء" : "Loyalty Programs"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? `${profiles.length} برنامج نشط` : `${profiles.length} active programs`}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة" : "Back"}
        </Link>
      </div>

      <div className="grid gap-4">
        {profiles.length === 0 ? (
          <div className="sbc-card p-8 text-center">
            <div className="text-(--muted-foreground)">
              {ar ? "لا توجد برامج ولاء نشطة" : "No active loyalty programs"}
            </div>
          </div>
        ) : (
          profiles.map((profile) => {
            const user = usersById.get(profile.userId);
            return (
              <div key={profile.userId} className="sbc-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {profile.logoUrl && (
                        <img
                          src={profile.logoUrl}
                          alt={profile.businessName}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{profile.businessName}</h3>
                        {user && (
                          <p className="text-sm text-(--muted-foreground)">{user.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                      {profile.joinCode && (
                        <div>
                          <span className="text-(--muted-foreground)">{ar ? "كود الانضمام:" : "Join Code:"}</span>{" "}
                          <span className="font-mono font-semibold">{profile.joinCode}</span>
                        </div>
                      )}
                      {profile.location && (
                        <div>
                          <span className="text-(--muted-foreground)">{ar ? "الموقع:" : "Location:"}</span>{" "}
                          <span className="font-medium">
                            {profile.location.label || `${profile.location.lat.toFixed(4)}, ${profile.location.lng.toFixed(4)}`}
                          </span>
                        </div>
                      )}
                      {profile.location && (
                        <div>
                          <span className="text-(--muted-foreground)">{ar ? "نطاق التنبيه:" : "Alert Radius:"}</span>{" "}
                          <span className="font-medium">{profile.location.radiusMeters}m</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-(--muted-foreground)">
                      {ar ? "تم الإنشاء:" : "Created:"} {new Date(profile.createdAt).toLocaleDateString(ar ? "ar" : "en")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppPage>
  );
}
