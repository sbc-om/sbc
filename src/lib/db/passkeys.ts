import { nanoid } from "nanoid";

import { getLmdb } from "./lmdb";
import type { PasskeyCredential } from "./types";

export type PasskeyChallenge = {
  id: string;
  challenge: string;
  type: "registration" | "authentication";
  userId?: string;
  identifier?: string;
  expectedOrigin: string;
  expectedRpId: string;
  createdAt: string;
  expiresAt: string;
};

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function createPasskeyChallenge(input: Omit<PasskeyChallenge, "id" | "createdAt" | "expiresAt">) {
  const { passkeyChallenges } = getLmdb();
  const now = Date.now();
  const challenge: PasskeyChallenge = {
    id: nanoid(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CHALLENGE_TTL_MS).toISOString(),
    ...input,
  };

  passkeyChallenges.put(challenge.id, challenge);
  return challenge;
}

export function consumePasskeyChallenge(id: string): PasskeyChallenge | null {
  const { passkeyChallenges } = getLmdb();
  const record = passkeyChallenges.get(id) as PasskeyChallenge | undefined;
  if (!record) return null;

  passkeyChallenges.remove(id);

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return record;
}

export function listUserPasskeys(userId: string): PasskeyCredential[] {
  const { userPasskeys, passkeyCredentials } = getLmdb();
  const ids = (userPasskeys.get(userId) as string[] | undefined) ?? [];
  return ids
    .map((id) => passkeyCredentials.get(id) as PasskeyCredential | undefined)
    .filter(Boolean) as PasskeyCredential[];
}

export function getPasskeyById(id: string): PasskeyCredential | null {
  const { passkeyCredentials } = getLmdb();
  return (passkeyCredentials.get(id) as PasskeyCredential | undefined) ?? null;
}

export function addPasskeyCredential(input: PasskeyCredential): PasskeyCredential {
  const { passkeyCredentials, userPasskeys } = getLmdb();
  passkeyCredentials.put(input.id, input);

  const existing = (userPasskeys.get(input.userId) as string[] | undefined) ?? [];
  if (!existing.includes(input.id)) {
    userPasskeys.put(input.userId, [...existing, input.id]);
  }

  return input;
}

export function updatePasskeyCounter(id: string, counter: number, lastUsedAt?: string) {
  const { passkeyCredentials } = getLmdb();
  const current = passkeyCredentials.get(id) as PasskeyCredential | undefined;
  if (!current) return null;

  const next: PasskeyCredential = {
    ...current,
    counter,
    lastUsedAt: lastUsedAt ?? new Date().toISOString(),
  };

  passkeyCredentials.put(id, next);
  return next;
}
