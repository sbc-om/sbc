import { headers } from "next/headers";

import { getLoyaltyCardById, listAppleWalletRegistrationsForDevice } from "@/lib/db/loyalty";
import { buildAppleWalletAuthToken } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function isPassTypeAllowed(passTypeIdentifier: string): boolean {
  return Boolean(process.env.APPLE_PASS_TYPE_ID && passTypeIdentifier === process.env.APPLE_PASS_TYPE_ID);
}

function parseUpdatedSince(value: string | null): number | null {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
  if (!isPassTypeAllowed(passTypeIdentifier)) return new Response("Not found", { status: 404 });

  const authHeader = (await headers()).get("authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const registrations = await listAppleWalletRegistrationsForDevice(
    deviceLibraryIdentifier,
    passTypeIdentifier
  );

  const authorized = registrations.some((r) => {
    const token = buildAppleWalletAuthToken({ serialNumber: r.serialNumber, passTypeIdentifier });
    return token ? authHeader.trim() === `ApplePass ${token}` : false;
  });

  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const url = new URL(_req.url);
  const since = parseUpdatedSince(url.searchParams.get("passesUpdatedSince"));

  const serialNumbers: string[] = [];
  let lastUpdatedMs: number | null = null;

  for (const reg of registrations) {
    const card = await getLoyaltyCardById(reg.serialNumber);
    if (!card || card.status !== "active") continue;

    const updatedAt = Date.parse(String(card.updatedAt ?? card.createdAt ?? new Date().toISOString()));
    if (since && updatedAt <= since) continue;

    serialNumbers.push(card.id);
    if (!lastUpdatedMs || updatedAt > lastUpdatedMs) lastUpdatedMs = updatedAt;
  }

  if (!serialNumbers.length) return new Response("", { status: 204 });

  return Response.json({
    serialNumbers,
    lastUpdated: lastUpdatedMs ? new Date(lastUpdatedMs).toISOString() : new Date().toISOString(),
  });
}
