import fs from "node:fs";
import path from "node:path";
import { open } from "lmdb";

export type LmdbHandles = {
  root: ReturnType<typeof open>;
  businesses: ReturnType<ReturnType<typeof open>["openDB"]>;
  businessSlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
  users: ReturnType<ReturnType<typeof open>["openDB"]>;
  userEmails: ReturnType<ReturnType<typeof open>["openDB"]>;
};

declare global {
  var __sbcLmdb: LmdbHandles | undefined;
}

function resolveDbPath() {
  const p = process.env.LMDB_PATH || ".data/lmdb";
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

export function getLmdb(): LmdbHandles {
  if (globalThis.__sbcLmdb) return globalThis.__sbcLmdb;

  const dbPath = resolveDbPath();
  fs.mkdirSync(dbPath, { recursive: true });

  const root = open({
    path: dbPath,
    compression: true,
  });

  const businesses = root.openDB({ name: "businesses" });
  const businessSlugs = root.openDB({ name: "businessSlugs" });
  const users = root.openDB({ name: "users" });
  const userEmails = root.openDB({ name: "userEmails" });

  globalThis.__sbcLmdb = {
    root,
    businesses,
    businessSlugs,
    users,
    userEmails,
  };

  return globalThis.__sbcLmdb;
}
