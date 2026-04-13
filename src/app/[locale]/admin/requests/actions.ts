"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getBusinessRequestById,
  updateBusinessRequestStatus,
  deleteBusinessRequest,
} from "@/lib/db/businessRequests";
import { convertBusinessRequestToBusiness } from "@/lib/businessRequests/convertRequestToBusiness";

export async function respondToRequestAction(
  locale: Locale,
  requestId: string,
  status: "approved" | "rejected" | "revision_requested",
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
  const admin = await requireAdmin(locale);
  const business = await convertBusinessRequestToBusiness(requestId, {
    actorUserId: admin.id,
    locale,
  });

  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/businesses`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/businesses`);

  return business;
}

export async function deleteRequestAction(locale: Locale, requestId: string) {
  await requireAdmin(locale);
  await deleteBusinessRequest(requestId);

  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin`);
}
