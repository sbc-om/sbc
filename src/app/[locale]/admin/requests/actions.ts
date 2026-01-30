"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getBusinessRequestById,
  updateBusinessRequestStatus,
  deleteBusinessRequest,
} from "@/lib/db/businessRequests";
import { createBusiness } from "@/lib/db/businesses";
import { getUserById } from "@/lib/db/users";
import { getCategoryById } from "@/lib/db/categories";

export async function respondToRequestAction(
  locale: Locale,
  requestId: string,
  status: "approved" | "rejected",
  response: string
) {
  const admin = await requireAdmin(locale);
  const request = await getBusinessRequestById(requestId);
  
  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  await updateBusinessRequestStatus(requestId, status, response, admin.id);

  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin`);
}

export async function convertRequestToBusinessAction(
  locale: Locale,
  requestId: string
) {
  await requireAdmin(locale);
  
  const request = await getBusinessRequestById(requestId);
  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  if (!request.userId) {
    throw new Error("USER_NOT_FOUND");
  }
  const user = await getUserById(request.userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Generate slug from name
  let baseSlug = slugify(request.businessName || request.name.en, {
    lower: true,
    strict: true,
    trim: true,
  });

  // If slug is empty, use a default
  if (!baseSlug) {
    baseSlug = "business";
  }

  // Try to create with the base slug, add numbers if taken
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      // Get category text if categoryId exists
      let category: string | undefined;
      if (request.categoryId) {
        const cat = await getCategoryById(request.categoryId);
        if (cat) {
          category = `${cat.name.en} | ${cat.name.ar}`;
        }
      }

      const business = await createBusiness({
        slug,
        ownerId: request.userId,
        name: {
          en: request.name.en,
          ar: request.name.ar,
        },
        description: request.description
          ? {
              en: request.description,
              ar: request.description,
            }
          : undefined,
        category,
        categoryId: request.categoryId,
        city: request.city,
        phone: request.phone,
        email: request.email,
        website: request.website,
      });

      // Success! Update request status if not already approved
      if (request.status !== "approved") {
        await updateBusinessRequestStatus(
          requestId,
          "approved",
          locale === "ar" 
            ? "تم تحويل طلبك إلى نشاط تجاري بنجاح" 
            : "Your request has been successfully converted to a business",
          (await getCurrentUser())?.id ?? "system"
        );
      }

      revalidatePath(`/${locale}/admin/requests`);
      revalidatePath(`/${locale}/admin/businesses`);
      revalidatePath(`/${locale}/admin`);
      revalidatePath(`/${locale}/businesses`);
      
      return business;
    } catch (err) {
      if (err instanceof Error && err.message === "SLUG_TAKEN") {
        // Try with a number suffix
        attempts++;
        slug = `${baseSlug}-${attempts}`;
      } else {
        throw err;
      }
    }
  }

  throw new Error("COULD_NOT_GENERATE_UNIQUE_SLUG");
}

export async function deleteRequestAction(locale: Locale, requestId: string) {
  await requireAdmin(locale);
  await deleteBusinessRequest(requestId);
  
  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin`);
}
