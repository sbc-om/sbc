import { getVapidPublicKey, isWebPushConfigured } from "@/lib/push/webPush";

export const runtime = "nodejs";

export async function GET() {
  if (!isWebPushConfigured()) {
    return Response.json({ ok: false, error: "WEB_PUSH_NOT_CONFIGURED" }, { status: 501 });
  }

  return Response.json({ ok: true, publicKey: getVapidPublicKey() });
}
