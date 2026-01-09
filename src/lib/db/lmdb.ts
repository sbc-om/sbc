import fs from "node:fs";
import path from "node:path";
import { open } from "lmdb";

export type LmdbHandles = {
  root: ReturnType<typeof open>;
  businesses: ReturnType<ReturnType<typeof open>["openDB"]>;
  businessSlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
  categories: ReturnType<ReturnType<typeof open>["openDB"]>;
  categorySlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
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
  // In dev/hot-reload, the global cached handles can outlive code changes.
  // If new DB handles are added over time (e.g. categories), upgrade the
  // cached object in-place instead of crashing on undefined.
  const existing = globalThis.__sbcLmdb as Partial<LmdbHandles> | undefined;
  if (existing?.root) {
    existing.businesses ??= existing.root.openDB({ name: "businesses" });
    existing.businessSlugs ??= existing.root.openDB({ name: "businessSlugs" });
    existing.categories ??= existing.root.openDB({ name: "categories" });
    existing.categorySlugs ??= existing.root.openDB({ name: "categorySlugs" });
    existing.users ??= existing.root.openDB({ name: "users" });
    existing.userEmails ??= existing.root.openDB({ name: "userEmails" });

    globalThis.__sbcLmdb = existing as LmdbHandles;
    return globalThis.__sbcLmdb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(dbPath, { recursive: true });

  const root = open({
    path: dbPath,
    compression: true,
  });

  const businesses = root.openDB({ name: "businesses" });
  const businessSlugs = root.openDB({ name: "businessSlugs" });
  const categories = root.openDB({ name: "categories" });
  const categorySlugs = root.openDB({ name: "categorySlugs" });
  const users = root.openDB({ name: "users" });
  const userEmails = root.openDB({ name: "userEmails" });

  globalThis.__sbcLmdb = {
    root,
    businesses,
    businessSlugs,
    categories,
    categorySlugs,
    users,
    userEmails,
  };

  return globalThis.__sbcLmdb;
}
