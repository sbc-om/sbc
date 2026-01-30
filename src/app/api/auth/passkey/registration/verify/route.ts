import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { bufferToBase64Url, resolvePasskeyOrigin, resolvePasskeyRpId } from "@/lib/auth/passkeyConfig";
import { addPasskeyCredential, consumePasskeyChallenge, listUserPasskeys } from "@/lib/db/passkeys";

export const runtime = "nodejs";

const bodySchema = z.object({
  requestId: z.string().min(1),
  response: z.any(),
  label: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json();
  const { requestId, response, label } = bodySchema.parse(body);

  const challenge = await consumePasskeyChallenge(requestId);
  if (!challenge || challenge.userId !== user.id) {
    return NextResponse.json({ ok: false, error: "CHALLENGE_INVALID" }, { status: 400 });
  }

  // Resolve expected origin and RP ID from request
  const expectedOrigin = resolvePasskeyOrigin(req);
  const expectedRPID = resolvePasskeyRpId(req);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin,
    expectedRPID,
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
}
