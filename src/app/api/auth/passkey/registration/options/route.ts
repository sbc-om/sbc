import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRegistrationOptions } from "@simplewebauthn/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { resolvePasskeyRpId, resolvePasskeyRpName } from "@/lib/auth/passkeyConfig";
import { createPasskeyChallenge, listUserPasskeys } from "@/lib/db/passkeys";

export const runtime = "nodejs";

const bodySchema = z.object({
  label: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const rpID = resolvePasskeyRpId(req);
    const rpName = resolvePasskeyRpName();

    const body = await req.json().catch(() => ({}));
    const { label: rawLabel } = bodySchema.parse(body);
    const label = typeof rawLabel === "string" ? rawLabel.trim().slice(0, 120) || undefined : undefined;

    const existing = await listUserPasskeys(user.id);
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

    const challenge = await createPasskeyChallenge({
      challenge: options.challenge,
      userId: user.id,
      expiresInMs: 5 * 60 * 1000,
    });

    return NextResponse.json({
      ok: true,
      options,
      requestId: challenge.id,
      label,
    });
  } catch (err) {
    console.error("[passkey/reg/options]", {
      error: err instanceof Error ? err.message : String(err),
      origin: req.headers.get("origin"),
      forwardedProto: req.headers.get("x-forwarded-proto"),
      forwardedHost: req.headers.get("x-forwarded-host"),
      host: req.headers.get("host"),
      rpID: resolvePasskeyRpId(req),
    });
    return NextResponse.json({ ok: false, error: "OPTIONS_FAILED" }, { status: 500 });
  }
}
