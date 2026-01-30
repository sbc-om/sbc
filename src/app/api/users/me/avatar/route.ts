import fs from "node:fs/promises";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserById, setUserAvatar } from "@/lib/db/users";
import {
  diskPathFromMediaUrl,
  storeUserUpload,
  validateUserImageUpload,
} from "@/lib/uploads/storage";

export const runtime = "nodejs";

function requireUserScopedUrl(userId: string, url: string) {
  const prefix = `/media/users/${userId}/`;
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

    validateUserImageUpload({ kind: "avatar", file });

    const current = await getUserById(auth.id);
    const previousUrl = current?.avatarUrl ?? null;

    const stored = await storeUserUpload({ userId: auth.id, kind: "avatar", file });
    const next = await setUserAvatar(auth.id, stored.url);

    // Best-effort delete previous avatar file
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

    return Response.json({ ok: true, avatarUrl: next.avatarUrl ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPLOAD_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  void req;
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const current = await getUserById(auth.id);
    const previousUrl = current?.avatarUrl ?? null;

    if (previousUrl) {
      requireUserScopedUrl(auth.id, previousUrl);
      const diskPath = diskPathFromMediaUrl(previousUrl);
      await fs.unlink(diskPath).catch(() => {});
      await fs.unlink(`${diskPath}.json`).catch(() => {});
    }

    const next = await setUserAvatar(auth.id, null);
    return Response.json({ ok: true, avatarUrl: next.avatarUrl ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
