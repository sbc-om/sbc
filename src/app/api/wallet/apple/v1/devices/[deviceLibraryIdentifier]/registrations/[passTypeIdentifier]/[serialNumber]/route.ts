import { headers } from "next/headers";
import { z } from "zod";

import {
  removeAppleWalletRegistration,
  upsertAppleWalletRegistration,
} from "@/lib/db/loyalty";
import { verifyAppleWalletAuthToken, generateAppleWalletAuthToken } from "@/lib/wallet/sbcwallet";

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
  
  // Debug logging
  const expectedToken = generateAppleWalletAuthToken({ serialNumber, passTypeIdentifier });
  const receivedToken = authHeader?.startsWith("ApplePass ") ? authHeader.slice("ApplePass ".length) : authHeader;
  console.log("[AppleWallet] Register request:");
  console.log("  Device:", deviceLibraryIdentifier);
  console.log("  Serial:", serialNumber);
  console.log("  Auth header:", authHeader);
  console.log("  Received token:", receivedToken);
  console.log("  Expected token:", expectedToken);
  console.log("  Match:", receivedToken === expectedToken);
  
  const authorized = verifyAppleWalletAuthToken({
    authorization: authHeader,
    serialNumber,
    passTypeIdentifier,
  });
  if (!authorized) {
    console.log("[AppleWallet] ❌ Auth FAILED");
    return new Response("Unauthorized", { status: 401 });
  }
  
  console.log("[AppleWallet] ✅ Auth OK");

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

  await removeAppleWalletRegistration(
    passTypeIdentifier,
    serialNumber,
    deviceLibraryIdentifier
  );

  return new Response("", { status: 200 });
}
