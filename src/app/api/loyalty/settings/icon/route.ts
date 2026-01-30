import fs from "node:fs/promises";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  defaultLoyaltySettings,
  getLoyaltySettingsByUserId,
  upsertLoyaltySettings,
} from "@/lib/db/loyalty";
import {
  diskPathFromMediaUrl,
  storeUserUpload,
  validateUserImageUpload,
} from "@/lib/uploads/storage";

export const runtime = "nodejs";

function requireUserScopedUrl(userId: string, url: string) {
  const prefix = `/media/users/${userId}/loyalty-point-icon/`;
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

    validateUserImageUpload({ kind: "loyalty-point-icon", file });

    const current = (await getLoyaltySettingsByUserId(auth.id)) ?? defaultLoyaltySettings(auth.id);
    const previousUrl = current.pointsIconMode === "custom" ? current.pointsIconUrl ?? null : null;

    const stored = await storeUserUpload({
      userId: auth.id,
      kind: "loyalty-point-icon",
      file,
    });

    const next = await upsertLoyaltySettings(auth.id, {
      pointsIconMode: "custom",
      pointsIconUrl: stored.url,
    });

    // Best-effort delete previous icon file
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

    return Response.json({ ok: true, settings: next });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPLOAD_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const current = await getLoyaltySettingsByUserId(auth.id);
    const previousUrl =
      current && current.pointsIconMode === "custom" ? current.pointsIconUrl ?? null : null;

    if (previousUrl) {
      requireUserScopedUrl(auth.id, previousUrl);
      const diskPath = diskPathFromMediaUrl(previousUrl);
      await fs.unlink(diskPath).catch(() => {});
      await fs.unlink(`${diskPath}.json`).catch(() => {});
    }

    const next = await upsertLoyaltySettings(auth.id, {
      pointsIconMode: "logo",
      pointsIconUrl: undefined,
    });

    return Response.json({ ok: true, settings: next });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
