import { SignJWT, jwtVerify } from "jose";

import type { Role } from "@/lib/db/types";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

function getSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_JWT_SECRET is missing. Set it in .env (a long random string).",
    );
  }
  return new TextEncoder().encode(secret);
}

export function getAuthCookieName() {
  return process.env.AUTH_COOKIE_NAME || "sbc_auth";
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const ttlDays = Number(process.env.SESSION_TTL_DAYS || "30");
  const exp = Math.max(1, ttlDays) * 24 * 60 * 60;

  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${exp}s`)
    .sign(getSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());

  const sub = payload.sub;
  const email = payload.email;
  const role = payload.role;

  if (typeof sub !== "string") throw new Error("Invalid token");
  if (typeof email !== "string") throw new Error("Invalid token");
  if (role !== "admin" && role !== "agent" && role !== "user") throw new Error("Invalid token");

  return { sub, email, role } satisfies AuthTokenPayload;
}
