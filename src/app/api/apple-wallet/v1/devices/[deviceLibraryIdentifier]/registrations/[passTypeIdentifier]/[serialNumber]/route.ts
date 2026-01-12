import { z } from "zod";

import { upsertAppleWalletRegistration, removeAppleWalletRegistration } from "@/lib/db/loyalty";
import { assertApplePassAuth } from "@/lib/wallet/appleWebServiceAuth";

export const runtime = "nodejs";

const postSchema = z
  .object({
    pushToken: z.string().trim().min(1).max(512),
  })
  .strict();

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }>;
  }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  try {
    assertApplePassAuth(req, {
      passTypeIdentifier: decodeURIComponent(passTypeIdentifier),
      serialNumber: decodeURIComponent(serialNumber),
    });

    const json = await req.json();
    const data = postSchema.parse(json);

    upsertAppleWalletRegistration({
      passTypeIdentifier: decodeURIComponent(passTypeIdentifier),
      serialNumber: decodeURIComponent(serialNumber),
      deviceLibraryIdentifier: decodeURIComponent(deviceLibraryIdentifier),
      pushToken: data.pushToken,
    });

    // 201 = created; Apple accepts 200/201.
    return new Response(null, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "REGISTER_FAILED";
    const status = msg === "UNAUTHORIZED" || msg.startsWith("MISSING_AUTH") || msg.startsWith("INVALID_AUTH") ? 401 : 400;
    return new Response(msg, { status });
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }>;
  }
) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;

  try {
    assertApplePassAuth(req, {
      passTypeIdentifier: decodeURIComponent(passTypeIdentifier),
      serialNumber: decodeURIComponent(serialNumber),
    });

    await removeAppleWalletRegistration({
      passTypeIdentifier: decodeURIComponent(passTypeIdentifier),
      serialNumber: decodeURIComponent(serialNumber),
      deviceLibraryIdentifier: decodeURIComponent(deviceLibraryIdentifier),
    });

    return new Response(null, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNREGISTER_FAILED";
    const status = msg === "UNAUTHORIZED" || msg.startsWith("MISSING_AUTH") || msg.startsWith("INVALID_AUTH") ? 401 : 400;
    return new Response(msg, { status });
  }
}
