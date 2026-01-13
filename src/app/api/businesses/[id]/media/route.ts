import fs from "node:fs/promises";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  addBusinessMedia,
  getBusinessById,
  removeBusinessMedia,
  setBusinessSingleMedia,
  type BusinessMediaKind,
} from "@/lib/db/businesses";
import {
  diskPathFromMediaUrl,
  storeUpload,
  validateUpload,
  type UploadKind,
} from "@/lib/uploads/storage";

export const runtime = "nodejs";

function isKind(x: unknown): x is UploadKind {
  return x === "cover" || x === "logo" || x === "banner" || x === "gallery" || x === "video";
}

function requireBusinessScopedUrl(businessId: string, url: string) {
  const prefix = `/media/businesses/${businessId}/`;
  if (!url.startsWith(prefix)) throw new Error("INVALID_MEDIA_URL");
}

async function requireAdminApi() {
  const user = await getCurrentUser();
  return user ?? null;
}

function canEditBusiness(user: Awaited<ReturnType<typeof requireAdminApi>>, business: ReturnType<typeof getBusinessById>): boolean {
  if (!user || !business) return false;
  if (user.role === "admin") return true;
  return !!business.ownerId && business.ownerId === user.id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const business = getBusinessById(id);
  if (!business) return new Response("Not found", { status: 404 });

  const user = await requireAdminApi();
  if (!canEditBusiness(user, business)) return new Response("Unauthorized", { status: 401 });

  return Response.json({ ok: true, media: business.media ?? {} });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const business = getBusinessById(id);
  if (!business) return new Response("Not found", { status: 404 });

  const user = await requireAdminApi();
  if (!canEditBusiness(user, business)) return new Response("Unauthorized", { status: 401 });

  try {
    const formData = await req.formData();
    const rawKind = formData.get("kind");
    if (!isKind(rawKind)) {
      return Response.json({ ok: false, error: "INVALID_KIND" }, { status: 400 });
    }

    const kind: UploadKind = rawKind;

    const files = [
      ...(formData.getAll("files") ?? []),
      ...(formData.getAll("file") ?? []),
    ].filter((v): v is File => typeof v === "object" && v instanceof File);

    if (files.length === 0) {
      return Response.json({ ok: false, error: "NO_FILES" }, { status: 400 });
    }

    const selected = kind === "cover" || kind === "logo" || kind === "banner" ? [files[0]] : files;

    for (const f of selected) validateUpload({ kind, file: f });

    const stored = [] as { url: string }[];
    for (const f of selected) {
      const s = await storeUpload({ businessId: id, kind, file: f });
      stored.push({ url: s.url });
    }

    let business;
    if (kind === "cover" || kind === "logo" || kind === "banner") {
      // For single-image kinds, replace existing value.
      business = setBusinessSingleMedia(id, kind, stored[0].url);
    } else if (kind === "gallery") {
      business = addBusinessMedia(id, "gallery", stored.map((s) => s.url));
    } else {
      business = addBusinessMedia(id, "video", stored.map((s) => s.url));
    }

    return Response.json({ ok: true, urls: stored.map((s) => s.url), media: business.media });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UPLOAD_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const business = getBusinessById(id);
  if (!business) return new Response("Not found", { status: 404 });

  const user = await requireAdminApi();
  if (!canEditBusiness(user, business)) return new Response("Unauthorized", { status: 401 });

  try {
    const body = (await req.json()) as { kind?: BusinessMediaKind; url?: string };
    if (!body || !isKind(body.kind) || typeof body.url !== "string") {
      return Response.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
    }

    const kind = body.kind;
    const url = body.url;

    requireBusinessScopedUrl(id, url);

    const diskPath = diskPathFromMediaUrl(url);
    await fs.unlink(diskPath).catch(() => {});
    // Remove sidecar metadata if present.
    await fs.unlink(`${diskPath}.json`).catch(() => {});

    const business = removeBusinessMedia(id, kind, url);

    return Response.json({ ok: true, media: business.media });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DELETE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
