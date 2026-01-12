import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";
import { getStoreProductBySlug } from "@/lib/store/products";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const body = (await req.json()) as unknown;
    const rawSlugs = isRecord(body) ? body.slugs : undefined;
    const slugs: string[] = Array.isArray(rawSlugs) ? rawSlugs.map((s) => String(s)).filter(Boolean) : [];

    const unique = Array.from(new Set(slugs));
    if (unique.length === 0) {
      return Response.json({ ok: true, activated: 0 });
    }

    let activated = 0;
    for (const slug of unique) {
      const product = getStoreProductBySlug(slug);
      if (!product) continue;

      purchaseProgramSubscription({
        userId: auth.id,
        program: product.program,
        plan: product.plan,
        durationDays: product.durationDays,
      });
      activated += 1;
    }

    // refresh program pages
    revalidatePath(`/${"en"}/dashboard`);
    revalidatePath(`/${"ar"}/dashboard`);
    revalidatePath(`/${"en"}/loyalty/manage`);
    revalidatePath(`/${"ar"}/loyalty/manage`);

    return Response.json({ ok: true, activated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "FINALIZE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
