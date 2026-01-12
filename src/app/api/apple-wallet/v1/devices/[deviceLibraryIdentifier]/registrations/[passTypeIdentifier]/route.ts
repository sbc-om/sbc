import { getLmdb } from "@/lib/db/lmdb";
import type { AppleWalletRegistration } from "@/lib/db/types";
import { getApplePassTypeIdentifier } from "@/lib/wallet/appleConfig";
import { getAppleWalletAuthenticationTokenForSerial } from "@/lib/wallet/applePass";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }>;
  }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  const passType = decodeURIComponent(passTypeIdentifier);

  try {
    const expectedPassType = getApplePassTypeIdentifier();
    if (passType !== expectedPassType) return new Response("UNAUTHORIZED", { status: 401 });

    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!auth || !auth.startsWith("ApplePass ")) return new Response("UNAUTHORIZED", { status: 401 });
    const token = auth.slice("ApplePass ".length).trim();
    if (!token) return new Response("UNAUTHORIZED", { status: 401 });

    const { appleWalletRegistrations } = getLmdb();
    const serials: string[] = [];
    const deviceLib = decodeURIComponent(deviceLibraryIdentifier);

    // Collect serials registered on this device for this pass type.
    for (const { value } of appleWalletRegistrations.getRange()) {
      const r = value as AppleWalletRegistration;
      if (r.passTypeIdentifier !== passType) continue;
      if (r.deviceLibraryIdentifier !== deviceLib) continue;
      serials.push(String(r.serialNumber));
    }

    // Since our authenticationToken is per-serial, validate the token matches
    // at least one serial registered for this device.
    const ok = serials.some((s) => getAppleWalletAuthenticationTokenForSerial(s) === token);
    if (!ok) return new Response("UNAUTHORIZED", { status: 401 });

    // Optional filter: passesUpdatedSince is an opaque tag; we return all serials (simple + safe).
    return Response.json({ serialNumbers: Array.from(new Set(serials)), lastUpdated: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LIST_FAILED";
    return new Response(msg, { status: 400 });
  }
}
