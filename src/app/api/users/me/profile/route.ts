import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserById, updateUserProfile } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const user = getUserById(auth.id);
  if (!user) return new Response("Not found", { status: 404 });

  return Response.json({
    ok: true,
    profile: {
      id: user.id,
      email: user.email,
      role: user.role,
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
    const body = (await req.json()) as { displayName?: string | null; bio?: string | null };
    const next = updateUserProfile(auth.id, {
      displayName: typeof body.displayName === "undefined" ? undefined : body.displayName,
      bio: typeof body.bio === "undefined" ? undefined : body.bio,
    });

    return Response.json({
      ok: true,
      profile: {
        id: next.id,
        email: next.email,
        role: next.role,
        displayName: next.displayName ?? next.email.split("@")[0],
        bio: next.bio ?? "",
        avatarUrl: next.avatarUrl ?? null,
        createdAt: next.createdAt,
        updatedAt: next.updatedAt ?? null,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
