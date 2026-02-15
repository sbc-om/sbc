import fs from "node:fs/promises";

import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";
import { getLoyaltyStaffById, updateLoyaltyStaff } from "@/lib/db/loyaltyStaff";
import {
  diskPathFromMediaUrl,
  storeUserUpload,
  validateUserImageUpload,
} from "@/lib/uploads/storage";

export const runtime = "nodejs";

function requireOwnerScopedUrl(ownerUserId: string, url: string) {
  const prefix = `/media/users/${ownerUserId}/`;
  if (!url.startsWith(prefix)) throw new Error("INVALID_MEDIA_URL");
}

async function getAuthenticatedStaff() {
  const session = await getCurrentLoyaltyStaffSession();
  if (!session) return null;

  const staff = await getLoyaltyStaffById(session.staffId);
  if (!staff || !staff.isActive || staff.userId !== session.ownerUserId) return null;

  return staff;
}

export async function POST(req: Request) {
  const staff = await getAuthenticatedStaff();
  if (!staff) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "NO_FILE" }, { status: 400 });
    }

    validateUserImageUpload({ kind: "avatar", file });

    const previousUrl = staff.avatarUrl ?? null;
    const stored = await storeUserUpload({ userId: staff.userId, kind: "avatar", file });
    const updated = await updateLoyaltyStaff(staff.id, { avatarUrl: stored.url });

    if (previousUrl) {
      try {
        requireOwnerScopedUrl(staff.userId, previousUrl);
        const diskPath = diskPathFromMediaUrl(previousUrl);
        await fs.unlink(diskPath).catch(() => {});
        await fs.unlink(`${diskPath}.json`).catch(() => {});
      } catch {
        // ignore
      }
    }

    return Response.json({ ok: true, avatarUrl: updated.avatarUrl ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const staff = await getAuthenticatedStaff();
  if (!staff) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const previousUrl = staff.avatarUrl ?? null;

    if (previousUrl) {
      requireOwnerScopedUrl(staff.userId, previousUrl);
      const diskPath = diskPathFromMediaUrl(previousUrl);
      await fs.unlink(diskPath).catch(() => {});
      await fs.unlink(`${diskPath}.json`).catch(() => {});
    }

    const updated = await updateLoyaltyStaff(staff.id, { avatarUrl: null });
    return Response.json({ ok: true, avatarUrl: updated.avatarUrl ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DELETE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
