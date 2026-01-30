import fs from "node:fs/promises";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getLoyaltyProfileByUserId,
  upsertLoyaltyProfile,
} from "@/lib/db/loyalty";
import {
  diskPathFromMediaUrl,
  storeUserUpload,
  validateUserImageUpload,
} from "@/lib/uploads/storage";

export const runtime = "nodejs";

function requireUserScopedUrl(userId: string, url: string) {
  const prefix = `/media/users/${userId}/loyalty-logo/`;
  if (!url.startsWith(prefix)) throw new Error("INVALID_MEDIA_URL");
}

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "NO_FILE" }, { status: 400 });
    }

    validateUserImageUpload({ kind: "loyalty-logo", file });

    const currentProfile = await getLoyaltyProfileByUserId(auth.id);
    const previousUrl = currentProfile?.logoUrl ?? null;

    const stored = await storeUserUpload({ userId: auth.id, kind: "loyalty-logo", file });

    // If profile doesn't exist yet, create one using a reasonable default name.
    const next = await upsertLoyaltyProfile({
      userId: auth.id,
      businessName: currentProfile?.businessName ?? auth.displayName,
      joinCode: currentProfile?.joinCode ?? "",
      logoUrl: stored.url,
    });

    // Best-effort delete previous logo file
    if (previousUrl) {
      try {
        requireUserScopedUrl(auth.id, previousUrl);
        const diskPath = diskPathFromMediaUrl(previousUrl);
        await fs.unlink(diskPath).catch(() => {});
        await fs.unlink(`${diskPath}.json`).catch(() => {});
      } catch {
        // ignore
      }
    }

    return Response.json({ ok: true, logoUrl: next.logoUrl ?? null, profile: next });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPLOAD_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const currentProfile = await getLoyaltyProfileByUserId(auth.id);
    const previousUrl = currentProfile?.logoUrl ?? null;

    if (previousUrl) {
      requireUserScopedUrl(auth.id, previousUrl);
      const diskPath = diskPathFromMediaUrl(previousUrl);
      await fs.unlink(diskPath).catch(() => {});
      await fs.unlink(`${diskPath}.json`).catch(() => {});
    }

    if (currentProfile) {
      const next = await upsertLoyaltyProfile({
        userId: auth.id,
        businessName: currentProfile.businessName,
        joinCode: currentProfile.joinCode,
        logoUrl: undefined,
      });
      return Response.json({ ok: true, logoUrl: null, profile: next });
    }

    return Response.json({ ok: true, logoUrl: null, profile: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
