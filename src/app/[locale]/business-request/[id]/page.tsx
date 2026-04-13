import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { getBusinessRequestById } from "@/lib/db/businessRequests";
import { AppPage } from "@/components/AppPage";
import { BusinessRequestForm } from "../BusinessRequestForm";

export const runtime = "nodejs";

export default async function EditBusinessRequestPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const request = await getBusinessRequestById(id);

  // Must own the request
  if (!request || request.userId !== user.id) notFound();

  // Can only edit pending or revision_requested
  if (request.status !== "pending" && request.status !== "revision_requested") {
    notFound();
  }

  const categories = await listCategories();
  const ar = locale === "ar";

  return (
    <AppPage>
      {/* Revision banner */}
      {request.status === "revision_requested" && request.adminResponse && (
        <div className="mb-6 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {ar ? "مطلوب تعديل" : "Revision Requested"}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {request.adminResponse}
              </p>
            </div>
          </div>
        </div>
      )}

      <BusinessRequestForm
        locale={locale as Locale}
        categories={categories}
        editRequestId={id}
        initialData={{
          username: request.username ?? "",
          name_en: request.name.en,
          name_ar: request.name.ar,
          desc_en: request.descEn ?? "",
          desc_ar: request.descAr ?? "",
          categoryId: request.categoryId ?? "",
          city: request.city ?? "",
          address: request.address ?? "",
          phone: request.phone ?? "",
          email: request.email ?? "",
          website: request.website ?? "",
          tags: request.tags ?? "",
          latitude: request.latitude,
          longitude: request.longitude,
          logoUrl: request.logoUrl,
          coverUrl: request.coverUrl,
          bannerUrl: request.bannerUrl,
          galleryUrls: request.galleryUrls,
        }}
      />
    </AppPage>
  );
}
