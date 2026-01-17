import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Role, User } from "./types";

export type UserListItem = Pick<User, "id" | "email" | "role" | "createdAt">;

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

  const user: User = {
    id: nanoid(),
    email,
    phone,
    fullName,
    passwordHash,
    role: input.role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    displayName: fullName,
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

export function listUsers(): UserListItem[] {
  const { users } = getLmdb();
  const out: UserListItem[] = [];

  for (const entry of users.getRange()) {
    const u = entry.value as User;
    out.push({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    });
  }

  // Newest first (ISO strings sort lexicographically)
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out;
}
