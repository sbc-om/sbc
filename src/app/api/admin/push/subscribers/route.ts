import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAllUserPushSubscriptions, listUsers } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });
  if (auth.role !== "admin") return new Response("Forbidden", { status: 403 });

  const users = listUsers();
  const usersById = new Map(users.map((u) => [u.id, u] as const));
  const subs = listAllUserPushSubscriptions();

  const stats = new Map<string, { count: number; lastUpdatedAt: string }>();
  for (const sub of subs) {
    const existing = stats.get(sub.userId);
    if (!existing) {
      stats.set(sub.userId, { count: 1, lastUpdatedAt: sub.updatedAt });
    } else {
      existing.count += 1;
      if (sub.updatedAt > existing.lastUpdatedAt) existing.lastUpdatedAt = sub.updatedAt;
    }
  }

  const subscribers = Array.from(stats.entries())
    .map(([userId, info]) => {
      const user = usersById.get(userId);
      if (!user) return null;
      return {
        userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        subscriptionCount: info.count,
        lastUpdatedAt: info.lastUpdatedAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.lastUpdatedAt < b!.lastUpdatedAt ? 1 : -1));

  return Response.json({ ok: true, subscribers });
}
