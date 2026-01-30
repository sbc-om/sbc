import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

import { consumePasskeyChallenge, getPasskeyById, updatePasskeyCounter } from "@/lib/db/passkeys";
import { base64UrlToBuffer, resolvePasskeyOrigin, resolvePasskeyRpId } from "@/lib/auth/passkeyConfig";
import { getUserById } from "@/lib/db/users";
import { getAuthCookieName, signAuthToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

const bodySchema = z.object({
  requestId: z.string().min(1),
  response: z.any(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { requestId, response } = bodySchema.parse(body);

  const challenge = await consumePasskeyChallenge(requestId);
  if (!challenge) {
    return NextResponse.json({ ok: false, error: "CHALLENGE_INVALID" }, { status: 400 });
  }

  const credentialId = response?.id as string | undefined;
  if (!credentialId) {
    return NextResponse.json({ ok: false, error: "CREDENTIAL_MISSING" }, { status: 400 });
  }

  const passkey = await getPasskeyById(credentialId);
  if (!passkey) {
    return NextResponse.json({ ok: false, error: "CREDENTIAL_NOT_FOUND" }, { status: 404 });
  }

  if (challenge.userId && passkey.userId !== challenge.userId) {
    return NextResponse.json({ ok: false, error: "CREDENTIAL_MISMATCH" }, { status: 400 });
  }

  // Resolve expected origin and RP ID from request
  const expectedOrigin = resolvePasskeyOrigin(req);
  const expectedRPID = resolvePasskeyRpId(req);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: passkey.id,
      publicKey: base64UrlToBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports,
    },
  });

  if (!verification.verified || !verification.authenticationInfo) {
    return NextResponse.json({ ok: false, error: "VERIFICATION_FAILED" }, { status: 401 });
  }

  const user = await getUserById(passkey.userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }
  if (user.approvalStatus && user.approvalStatus !== "approved") {
    return NextResponse.json({ ok: false, error: "ACCOUNT_PENDING_APPROVAL" }, { status: 403 });
  }
  if (user.isActive === false) {
    return NextResponse.json({ ok: false, error: "ACCOUNT_INACTIVE" }, { status: 403 });
  }

  await updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter);

  const token = await signAuthToken({ sub: user.id, email: user.email, role: user.role });
  const cookieName = getAuthCookieName();
  const secure = process.env.NODE_ENV === "production";

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName ?? user.email.split("@")[0],
    },
  });
}
