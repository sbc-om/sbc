import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Role, User } from "./types";

export type UserListItem = Pick<
  User,
  | "id"
  | "email"
  | "phone"
  | "fullName"
  | "role"
  | "isVerified"
  | "createdAt"
  | "updatedAt"
  | "approvalStatus"
  | "approvalReason"
  | "approvalRequestedAt"
  | "pendingEmail"
  | "pendingPhone"
  | "approvedAt"
>;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

const phoneSchema = z.string().trim().min(6).max(40);
const fullNameSchema = z.string().trim().min(2).max(120);

function normalizePhone(value: string) {
  return value.replace(/[\s\-()]+/g, "");
}

export async function createUser(input: {
  email: string;
  phone: string;
  fullName: string;
  password: string;
  role: Role;
}): Promise<User> {
  const email = emailSchema.parse(input.email);
  const fullName = fullNameSchema.parse(input.fullName);
  const phone = normalizePhone(phoneSchema.parse(input.phone));
  const password = z.string().min(8).parse(input.password);

  const { users, userEmails, userPhones } = getLmdb();

  const existingId = userEmails.get(email) as string | undefined;
  if (existingId) {
    throw new Error("EMAIL_TAKEN");
  }

  const existingPhoneId = userPhones.get(phone) as string | undefined;
  if (existingPhoneId) {
    throw new Error("PHONE_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const now = new Date().toISOString();
  const user: User = {
    id: nanoid(),
    email,
    phone,
    fullName,
    passwordHash,
    role: input.role,
    isVerified: false,
    createdAt: now,
    updatedAt: now,
    displayName: fullName,
    approvalStatus: "pending",
    approvalReason: "new",
    approvalRequestedAt: now,
  };

  users.put(user.id, user);
  userEmails.put(email, user.id);
  userPhones.put(phone, user.id);

  return user;
}

function ensureUser(id: string): User {
  const { users } = getLmdb();
  const current = users.get(id) as User | undefined;
  if (!current) throw new Error("NOT_FOUND");
  return current;
}

export function updateUserProfile(
  id: string,
  patch: { displayName?: string | null; bio?: string | null },
): User {
  const { users } = getLmdb();
  const current = ensureUser(id);

  const displayName = patch.displayName === null ? undefined : patch.displayName;
  const bio = patch.bio === null ? undefined : patch.bio;

  const next: User = {
    ...current,
    displayName: typeof displayName === "string" ? displayName.trim() || undefined : current.displayName,
    bio: typeof bio === "string" ? bio.trim() || undefined : current.bio,
    updatedAt: new Date().toISOString(),
  };

  users.put(id, next);
  return next;
}

export function updateUserContact(
  id: string,
  patch: { email?: string | null; phone?: string | null },
): User {
  const { users, userEmails, userPhones } = getLmdb();
  const current = ensureUser(id);
  const currentEmail = current.email;
  const currentPhone = current.phone ?? "";

  const nextEmail =
    typeof patch.email === "string" ? emailSchema.parse(patch.email) : currentEmail;
  const nextPhone =
    typeof patch.phone === "string"
      ? normalizePhone(phoneSchema.parse(patch.phone))
      : currentPhone;

  if (nextEmail !== currentEmail) {
    const existingId = userEmails.get(nextEmail) as string | undefined;
    if (existingId && existingId !== id) throw new Error("EMAIL_TAKEN");
  }

  if (nextPhone !== currentPhone) {
    const existingId = userPhones.get(nextPhone) as string | undefined;
    if (existingId && existingId !== id) throw new Error("PHONE_TAKEN");
  }

  const hasChange = nextEmail !== currentEmail || nextPhone !== currentPhone;
  if (!hasChange) return current;

  const now = new Date().toISOString();
  const next: User = {
    ...current,
    pendingEmail: nextEmail !== currentEmail ? nextEmail : current.pendingEmail,
    pendingPhone: nextPhone !== currentPhone ? nextPhone : current.pendingPhone,
    approvalStatus: "pending",
    approvalReason:
      current.approvalStatus === "pending" && current.approvalReason === "new"
        ? "new"
        : "contact_update",
    approvalRequestedAt: now,
    updatedAt: now,
  };

  users.put(id, next);
  return next;
}

export function approveUserAccount(id: string): User {
  const { users, userEmails, userPhones } = getLmdb();
  const current = ensureUser(id);

  const nextEmail = current.pendingEmail ?? current.email;
  const nextPhone = current.pendingPhone ?? current.phone;

  if (nextEmail !== current.email) {
    const existingId = userEmails.get(nextEmail) as string | undefined;
    if (existingId && existingId !== id) throw new Error("EMAIL_TAKEN");
  }

  if (nextPhone !== current.phone) {
    const existingId = userPhones.get(nextPhone) as string | undefined;
    if (existingId && existingId !== id) throw new Error("PHONE_TAKEN");
  }

  const now = new Date().toISOString();
  const next: User = {
    ...current,
    email: nextEmail,
    phone: nextPhone,
    pendingEmail: undefined,
    pendingPhone: undefined,
    approvalStatus: "approved",
    approvalReason: undefined,
    approvalRequestedAt: undefined,
    approvedAt: now,
    updatedAt: now,
  };

  users.put(id, next);

  if (nextEmail !== current.email) {
    userEmails.remove(current.email);
    userEmails.put(nextEmail, id);
  }

  if (nextPhone !== current.phone) {
    userPhones.remove(current.phone);
    userPhones.put(nextPhone, id);
  }

  return next;
}

export function setUserAvatar(id: string, url: string | null): User {
  const { users } = getLmdb();
  const current = ensureUser(id);

  const next: User = {
    ...current,
    avatarUrl: url ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  users.put(id, next);
  return next;
}

export function getUserById(id: string): User | null {
  const { users } = getLmdb();
  return (users.get(id) as User | undefined) ?? null;
}

export function getUserByEmail(email: string): User | null {
  const e = emailSchema.safeParse(email);
  if (!e.success) return null;

  const { users, userEmails } = getLmdb();
  const id = (userEmails.get(e.data) as string | undefined) ?? null;
  if (!id) return null;
  return (users.get(id) as User | undefined) ?? null;
}

export function getUserByPhone(phone: string): User | null {
  const p = phoneSchema.safeParse(phone);
  if (!p.success) return null;

  const { users, userPhones } = getLmdb();
  const normalized = normalizePhone(p.data);
  const id = (userPhones.get(normalized) as string | undefined) ?? null;
  if (!id) return null;
  return (users.get(id) as User | undefined) ?? null;
}

export async function verifyUserPassword(input: {
  identifier: string;
  password: string;
}): Promise<User | null> {
  const identifier = input.identifier.trim();
  const user = identifier.includes("@")
    ? getUserByEmail(identifier)
    : getUserByPhone(identifier);
  if (!user) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  return ok ? user : null;
}

export function updateUserRole(id: string, newRole: Role): User {
  const { users } = getLmdb();
  const current = ensureUser(id);

  const next: User = {
    ...current,
    role: newRole,
    updatedAt: new Date().toISOString(),
  };

  users.put(id, next);
  return next;
}

export function setUserVerified(id: string, isVerified: boolean): User {
  const { users } = getLmdb();
  const current = ensureUser(id);

  const next: User = {
    ...current,
    isVerified,
    updatedAt: new Date().toISOString(),
  };

  users.put(id, next);
  return next;
}

export function listUsers(): UserListItem[] {
  const { users } = getLmdb();
  const out: UserListItem[] = [];

  for (const entry of users.getRange()) {
    const u = entry.value as User;
    out.push({
      id: u.id,
      email: u.email,
      phone: u.phone ?? "",
      fullName: u.fullName ?? u.displayName ?? u.email.split("@")[0],
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      approvalStatus: u.approvalStatus,
      approvalReason: u.approvalReason,
      approvalRequestedAt: u.approvalRequestedAt,
      pendingEmail: u.pendingEmail,
      pendingPhone: u.pendingPhone,
      approvedAt: u.approvedAt,
    });
  }

  // Newest first (ISO strings sort lexicographically)
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out;
}
