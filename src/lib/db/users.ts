import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Role, User } from "./types";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

export async function createUser(input: {
  email: string;
  password: string;
  role: Role;
}): Promise<User> {
  const email = emailSchema.parse(input.email);
  const password = z.string().min(8).parse(input.password);

  const { users, userEmails } = getLmdb();

  const existingId = userEmails.get(email) as string | undefined;
  if (existingId) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user: User = {
    id: nanoid(),
    email,
    passwordHash,
    role: input.role,
    createdAt: new Date().toISOString(),
  };

  users.put(user.id, user);
  userEmails.put(email, user.id);

  return user;
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

export async function verifyUserPassword(input: {
  email: string;
  password: string;
}): Promise<User | null> {
  const user = getUserByEmail(input.email);
  if (!user) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  return ok ? user : null;
}
