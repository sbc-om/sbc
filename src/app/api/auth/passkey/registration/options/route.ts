import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRegistrationOptions } from "@simplewebauthn/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { resolvePasskeyOrigin, resolvePasskeyRpId, resolvePasskeyRpName } from "@/lib/auth/passkeyConfig";
import { createPasskeyChallenge, listUserPasskeys } from "@/lib/db/passkeys";

export const runtime = "nodejs";

const bodySchema = z.object({
  label: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const origin = resolvePasskeyOrigin(req);
  const rpID = resolvePasskeyRpId(req);
  const rpName = resolvePasskeyRpName();

  const body = await req.json().catch(() => ({}));
  const { label } = bodySchema.parse(body);

  const existing = listUserPasskeys(user.id);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(user.id, "utf8"),
    userName: user.email,
    userDisplayName: user.displayName ?? user.email,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((credential) => ({
      id: credential.id,
      type: "public-key",
      transports: credential.transports,
    })),
  });

  const challenge = createPasskeyChallenge({
    challenge: options.challenge,
    type: "registration",
    userId: user.id,
    expectedOrigin: origin,
    expectedRpId: rpID,
  });

  return NextResponse.json({
    ok: true,
    options,
    requestId: challenge.id,
    label,
  });
}
