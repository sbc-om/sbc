import { getCurrentUser } from "@/lib/auth/currentUser";
import { listUsers } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const qRaw = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const limitRaw = url.searchParams.get("limit") ?? "20";
  const limit = Math.max(1, Math.min(50, Number(limitRaw) || 20));

  const all = listUsers();
  const filtered = qRaw
    ? all.filter((u) =>
        u.email.toLowerCase().includes(qRaw) ||
        u.id.toLowerCase().includes(qRaw) ||
        (u.phone ?? "").toLowerCase().includes(qRaw) ||
        (u.fullName ?? "").toLowerCase().includes(qRaw)
      )
    : all;

  const users = filtered.slice(0, limit).map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive ?? true,
    approvalStatus: u.approvalStatus,
    approvalReason: u.approvalReason,
  }));

  return Response.json({ ok: true, users });
}
