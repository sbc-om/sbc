import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { isLocale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; joinCode: string }> },
) {
  const { locale, joinCode } = await params;

  if (!isLocale(locale)) {
    return Response.json({ ok: false, error: "INVALID_LOCALE" }, { status: 400 });
  }

  const profile = await getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) {
    return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const startUrl = `/${locale}/loyalty/staff/${joinCode}`;
  const logo = profile.logoUrl || "/android-chrome-512x512.png";

  const manifest = {
    id: `/loyalty-staff/${joinCode}`,
    name: `${profile.businessName} Seller`,
    short_name: profile.businessName.slice(0, 24),
    description:
      locale === "ar"
        ? `بوابة البائع الخاصة بـ ${profile.businessName}`
        : `${profile.businessName} seller workspace`,
    start_url: startUrl,
    scope: `/${locale}/loyalty/staff/${joinCode}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0877FB",
    lang: locale,
    icons: [
      {
        src: logo,
        sizes: "192x192",
        type: logo.endsWith(".png") ? "image/png" : undefined,
        purpose: "any maskable",
      },
      {
        src: logo,
        sizes: "512x512",
        type: logo.endsWith(".png") ? "image/png" : undefined,
        purpose: "any maskable",
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
