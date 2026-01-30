import { headers } from "next/headers";
import { z } from "zod";

import {
  removeAppleWalletRegistration,
  upsertAppleWalletRegistration,
} from "@/lib/db/loyalty";
import { verifyAppleWalletAuthToken } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

const registerSchema = z.object({
  pushToken: z.string().trim().min(1),
});

function isPassTypeAllowed(passTypeIdentifier: string): boolean {
  return Boolean(process.env.APPLE_PASS_TYPE_ID && passTypeIdentifier === process.env.APPLE_PASS_TYPE_ID);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;
  if (!isPassTypeAllowed(passTypeIdentifier)) return new Response("Not found", { status: 404 });

  const authHeader = (await headers()).get("authorization");
  const authorized = verifyAppleWalletAuthToken({
    authorization: authHeader,
    serialNumber,
    passTypeIdentifier,
  });
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const body = registerSchema.parse(await req.json());

  upsertAppleWalletRegistration({
    passTypeIdentifier,
    serialNumber,
    deviceLibraryIdentifier,
    pushToken: body.pushToken,
  });

  return new Response("", { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> },
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;
  if (!isPassTypeAllowed(passTypeIdentifier)) return new Response("Not found", { status: 404 });

  const authHeader = (await headers()).get("authorization");
  const authorized = verifyAppleWalletAuthToken({
    authorization: authHeader,
    serialNumber,
    passTypeIdentifier,
  });
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  await removeAppleWalletRegistration({
    passTypeIdentifier,
    serialNumber,
    deviceLibraryIdentifier,
  });

  return new Response("", { status: 200 });
}
