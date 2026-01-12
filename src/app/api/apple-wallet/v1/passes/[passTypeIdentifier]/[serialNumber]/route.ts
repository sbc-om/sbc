import { buildAppleLoyaltyPkpassBuffer, getAppleWalletLastUpdatedForSerial } from "@/lib/wallet/applePass";
import { assertApplePassAuth } from "@/lib/wallet/appleWebServiceAuth";

export const runtime = "nodejs";

function toHttpDate(d: Date): string {
  return d.toUTCString();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
  const { passTypeIdentifier, serialNumber } = await params;
  const passType = decodeURIComponent(passTypeIdentifier);
  const serial = decodeURIComponent(serialNumber);

  try {
    assertApplePassAuth(req, { passTypeIdentifier: passType, serialNumber: serial });

    const lastUpdated = getAppleWalletLastUpdatedForSerial(serial);

    const ifModifiedSince = req.headers.get("if-modified-since");
    if (ifModifiedSince) {
      const since = new Date(ifModifiedSince);
      if (!Number.isNaN(since.getTime()) && lastUpdated.getTime() <= since.getTime()) {
        return new Response(null, { status: 304 });
      }
    }

    const buffer = await buildAppleLoyaltyPkpassBuffer({ cardId: serial });
    const body = new Uint8Array(buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename=loyalty-${encodeURIComponent(serial)}.pkpass`,
        "Last-Modified": toHttpDate(lastUpdated),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PASS_FETCH_FAILED";
    const status = msg === "UNAUTHORIZED" || msg.startsWith("MISSING_AUTH") || msg.startsWith("INVALID_AUTH") ? 401 : 400;
    return new Response(msg, { status });
  }
}
