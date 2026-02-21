import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = (localeParam === "ar" ? "ar" : "en") as Locale;
  const user = await getCurrentUser();
  const query = await searchParams;

  const qs = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") {
      qs.set(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => qs.append(key, entry));
    }
  });

  const targetPath = user ? `/${locale}/explorer` : `/${locale}/businesses`;
  const target = qs.toString() ? `${targetPath}?${qs.toString()}` : targetPath;

  redirect(target);

  return null;
}
