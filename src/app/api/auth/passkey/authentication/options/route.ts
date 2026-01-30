import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

import { resolvePasskeyOrigin, resolvePasskeyRpId } from "@/lib/auth/passkeyConfig";
import { createPasskeyChallenge, listUserPasskeys } from "@/lib/db/passkeys";
import { getUserByEmail, getUserByPhone } from "@/lib/db/users";

export const runtime = "nodejs";

const bodySchema = z.object({
  identifier: z.string().trim().min(1).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { identifier } = bodySchema.parse(body);

  const origin = resolvePasskeyOrigin(req);
  const rpID = resolvePasskeyRpId(req);

  let userId: string | undefined;
  let allowCredentials:
    | {
        id: string;
        type: "public-key";
        transports?: AuthenticatorTransport[];
      }[]
    | undefined;

  if (identifier) {
    const user = identifier.includes("@")
      ? await getUserByEmail(identifier)
      : await getUserByPhone(identifier);

    if (!user) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    userId = user.id;
    const passkeys = await listUserPasskeys(user.id);
    if (passkeys.length === 0) {
      return NextResponse.json({ ok: false, error: "NO_PASSKEYS" }, { status: 404 });
    }

    allowCredentials = passkeys.map((credential) => ({
      id: credential.id,
      type: "public-key",
      transports: credential.transports,
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });

  const challenge = await createPasskeyChallenge({
    challenge: options.challenge,
    userId,
    expiresInMs: 5 * 60 * 1000,
  });

  return NextResponse.json({ ok: true, options, requestId: challenge.id });
}
