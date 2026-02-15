import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type LoyaltyStaffSessionPayload = {
  staffId: string;
  ownerUserId: string;
  joinCode: string;
  phone: string;
  fullName: string;
};

function getSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is missing. Set it in .env (a long random string).");
  }
  return new TextEncoder().encode(secret);
}

export function getLoyaltyStaffCookieName() {
  return process.env.LOYALTY_STAFF_COOKIE_NAME || "sbc_loyalty_staff";
}

export async function signLoyaltyStaffSession(payload: LoyaltyStaffSessionPayload) {
  const ttlDays = Number(process.env.LOYALTY_STAFF_SESSION_TTL_DAYS || "30");
  const exp = Math.max(1, ttlDays) * 24 * 60 * 60;

  return new SignJWT({
    ownerUserId: payload.ownerUserId,
    joinCode: payload.joinCode,
    phone: payload.phone,
    fullName: payload.fullName,
    typ: "loyalty_staff",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.staffId)
    .setIssuedAt()
    .setExpirationTime(`${exp}s`)
    .sign(getSecret());
}

export async function verifyLoyaltyStaffSession(token: string): Promise<LoyaltyStaffSessionPayload> {
  const { payload } = await jwtVerify(token, getSecret());

  const staffId = payload.sub;
  const ownerUserId = payload.ownerUserId;
  const joinCode = payload.joinCode;
  const phone = payload.phone;
  const fullName = payload.fullName;
  const typ = payload.typ;

  if (typ !== "loyalty_staff") throw new Error("Invalid token type");
  if (typeof staffId !== "string") throw new Error("Invalid token");
  if (typeof ownerUserId !== "string") throw new Error("Invalid token");
  if (typeof joinCode !== "string") throw new Error("Invalid token");
  if (typeof phone !== "string") throw new Error("Invalid token");
  if (typeof fullName !== "string") throw new Error("Invalid token");

  return { staffId, ownerUserId, joinCode, phone, fullName };
}

export async function getCurrentLoyaltyStaffSession() {
  const cookieName = getLoyaltyStaffCookieName();
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    return await verifyLoyaltyStaffSession(token);
  } catch {
    return null;
  }
}
