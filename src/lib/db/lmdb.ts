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
  userCategoryFollows: ReturnType<ReturnType<typeof open>["openDB"]>;
  chatConversations: ReturnType<ReturnType<typeof open>["openDB"]>;
  chatMessages: ReturnType<ReturnType<typeof open>["openDB"]>;
  businessRequests: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Purchased program packages / entitlements keyed per-user & program. */
  programSubscriptions: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltySubscriptions: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Loyalty business profile (join code, display name, logo) keyed by owner userId. */
  loyaltyProfiles: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltyCustomers: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltyCards: ReturnType<ReturnType<typeof open>["openDB"]>;
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
    existing.userCategoryFollows ??= existing.root.openDB({ name: "userCategoryFollows" });
    existing.chatConversations ??= existing.root.openDB({ name: "chatConversations" });
    existing.chatMessages ??= existing.root.openDB({ name: "chatMessages" });
    existing.businessRequests ??= existing.root.openDB({ name: "businessRequests" });

    // Program subscriptions (store purchases)
    existing.programSubscriptions ??= existing.root.openDB({ name: "programSubscriptions" });

    // Loyalty / CRM
    existing.loyaltySubscriptions ??= existing.root.openDB({ name: "loyaltySubscriptions" });
    existing.loyaltyProfiles ??= existing.root.openDB({ name: "loyaltyProfiles" });
    existing.loyaltyCustomers ??= existing.root.openDB({ name: "loyaltyCustomers" });
    existing.loyaltyCards ??= existing.root.openDB({ name: "loyaltyCards" });

    globalThis.__sbcLmdb = existing as LmdbHandles;
    return globalThis.__sbcLmdb;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(dbPath, { recursive: true });

  const root = open({
    path: dbPath,
    compression: true,
    // We keep adding named DBs (tables) over time.
    // LMDB has a maxdbs limit per environment; bump it to avoid MDB_DBS_FULL.
    maxDbs: 64,
  });

  const businesses = root.openDB({ name: "businesses" });
  const businessSlugs = root.openDB({ name: "businessSlugs" });
  const categories = root.openDB({ name: "categories" });
  const categorySlugs = root.openDB({ name: "categorySlugs" });
  const users = root.openDB({ name: "users" });
  const userEmails = root.openDB({ name: "userEmails" });
  const userCategoryFollows = root.openDB({ name: "userCategoryFollows" });
  const chatConversations = root.openDB({ name: "chatConversations" });
  const chatMessages = root.openDB({ name: "chatMessages" });
  const businessRequests = root.openDB({ name: "businessRequests" });

  const programSubscriptions = root.openDB({ name: "programSubscriptions" });

  // Loyalty / CRM
  const loyaltySubscriptions = root.openDB({ name: "loyaltySubscriptions" });
  const loyaltyProfiles = root.openDB({ name: "loyaltyProfiles" });
  const loyaltyCustomers = root.openDB({ name: "loyaltyCustomers" });
  const loyaltyCards = root.openDB({ name: "loyaltyCards" });

  globalThis.__sbcLmdb = {
    root,
    businesses,
    businessSlugs,
    categories,
    categorySlugs,
    users,
    userEmails,
    userCategoryFollows,
    chatConversations,
    chatMessages,
    businessRequests,
    programSubscriptions,
    loyaltySubscriptions,
    loyaltyProfiles,
    loyaltyCustomers,
    loyaltyCards,
  };

  return globalThis.__sbcLmdb;
}
