import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  bufferToBase64Url,
  resolvePasskeyExpectedOrigins,
  resolvePasskeyExpectedRpIds,
} from "@/lib/auth/passkeyConfig";
import { addPasskeyCredential, consumePasskeyChallenge, listUserPasskeys } from "@/lib/db/passkeys";

export const runtime = "nodejs";

const bodySchema = z.object({
  requestId: z.string().min(1),
  response: z.any(),
  label: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, response, label: rawLabel } = bodySchema.parse(body);
    const label = typeof rawLabel === "string" ? rawLabel.trim().slice(0, 120) || undefined : undefined;

    const challenge = await consumePasskeyChallenge(requestId);
    if (!challenge || challenge.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "CHALLENGE_INVALID" }, { status: 400 });
    }

    // Resolve expected origin(s) and RP ID(s) from request/env.
    const expectedOrigin = resolvePasskeyExpectedOrigins(req);
    const expectedRPID = resolvePasskeyExpectedRpIds(req);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ ok: false, error: "VERIFICATION_FAILED" }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    const id = credential.id;
    const existingPasskeys = await listUserPasskeys(user.id);
    const existing = existingPasskeys.some((item) => item.id === id);
    if (existing) {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }

    await addPasskeyCredential({
      id,
      userId: user.id,
      publicKey: bufferToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: response?.response?.transports ?? credential.transports,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      label,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[passkey/reg/verify]", {
      error: err instanceof Error ? err.message : String(err),
      origin: req.headers.get("origin"),
      forwardedProto: req.headers.get("x-forwarded-proto"),
      forwardedHost: req.headers.get("x-forwarded-host"),
      host: req.headers.get("host"),
      expectedOrigins: resolvePasskeyExpectedOrigins(req),
      expectedRpIds: resolvePasskeyExpectedRpIds(req),
    });
    return NextResponse.json({ ok: false, error: "VERIFICATION_FAILED" }, { status: 400 });
  }
}
