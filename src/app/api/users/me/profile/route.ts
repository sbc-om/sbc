import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserById, updateUserContact, updateUserProfile } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const user = await getUserById(auth.id);
  if (!user) return new Response("Not found", { status: 404 });

  return Response.json({
    ok: true,
    profile: {
      id: user.id,
      email: user.email,
      phone: user.phone ?? "",
      pendingEmail: user.pendingEmail ?? null,
      pendingPhone: user.pendingPhone ?? null,
      approvalStatus: user.approvalStatus ?? "approved",
      approvalReason: user.approvalReason ?? null,
      role: user.role,
      fullName: user.fullName,
      displayName: user.displayName ?? user.email.split("@")[0],
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const body = (await req.json()) as {
      displayName?: string | null;
      bio?: string | null;
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
    };

    // Normalize empty strings to undefined (no change) to avoid validation errors
    const normalizeString = (v: string | null | undefined) =>
      typeof v === "string" && v.trim() === "" ? undefined : v;

    const next = await updateUserProfile(auth.id, {
      displayName: normalizeString(body.displayName),
      bio: normalizeString(body.bio),
      fullName: normalizeString(body.fullName),
    });

    const nextWithContact = await updateUserContact(auth.id, {
      email: normalizeString(body.email),
      phone: normalizeString(body.phone),
    });

    return Response.json({
      ok: true,
      profile: {
        id: nextWithContact.id,
        email: nextWithContact.email,
        phone: nextWithContact.phone ?? "",
        pendingEmail: nextWithContact.pendingEmail ?? null,
        pendingPhone: nextWithContact.pendingPhone ?? null,
        approvalStatus: nextWithContact.approvalStatus ?? "approved",
        approvalReason: nextWithContact.approvalReason ?? null,
        role: nextWithContact.role,
        fullName: next.fullName,
        displayName: next.displayName ?? nextWithContact.email.split("@")[0],
        bio: next.bio ?? "",
        avatarUrl: nextWithContact.avatarUrl ?? null,
        createdAt: nextWithContact.createdAt,
        updatedAt: nextWithContact.updatedAt ?? null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
