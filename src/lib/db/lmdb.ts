import fs from "node:fs";
import path from "node:path";
import { open } from "lmdb";
import { maybeEncrypt, maybeDecrypt, isEncryptionEnabled } from "./encryption";

export type LmdbHandles = {
  root: ReturnType<typeof open>;
  businesses: ReturnType<ReturnType<typeof open>["openDB"]>;
  businessSlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
  categories: ReturnType<ReturnType<typeof open>["openDB"]>;
  categorySlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
  users: ReturnType<ReturnType<typeof open>["openDB"]>;
  userEmails: ReturnType<ReturnType<typeof open>["openDB"]>;
  userPhones: ReturnType<ReturnType<typeof open>["openDB"]>;
  userCategoryFollows: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** User-business likes keyed by `${userId}:${businessId}`. Value is ISO timestamp. */
  userBusinessLikes: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** User-business saves keyed by `${userId}:${businessId}`. Value is ISO timestamp. */
  userBusinessSaves: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Like counts keyed by businessId. Value is number. */
  businessLikeCounts: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Comments keyed by businessId. Value is BusinessComment[]. */
  businessComments: ReturnType<ReturnType<typeof open>["openDB"]>;
  chatConversations: ReturnType<ReturnType<typeof open>["openDB"]>;
  chatMessages: ReturnType<ReturnType<typeof open>["openDB"]>;
  businessRequests: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Store products (packages for directory, loyalty, marketing). */
  products: ReturnType<ReturnType<typeof open>["openDB"]>;
  productSlugs: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Purchased program packages / entitlements keyed per-user & program. */
  programSubscriptions: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltySubscriptions: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Loyalty business profile (join code, display name, logo) keyed by owner userId. */
  loyaltyProfiles: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Loyalty settings keyed by owner userId. */
  loyaltySettings: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltyCustomers: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltyCards: ReturnType<ReturnType<typeof open>["openDB"]>;
  loyaltyMessages: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Web push subscriptions keyed by `${customerId}:${hash(endpoint)}`. */
  loyaltyPushSubscriptions: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Apple Wallet PassKit registrations keyed by `${passTypeId}:${serial}:${deviceLibId}`. */
  appleWalletRegistrations: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Passkey credentials keyed by credentialId (base64url). */
  passkeyCredentials: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** User passkey ids keyed by userId. */
  userPasskeys: ReturnType<ReturnType<typeof open>["openDB"]>;
  /** Passkey challenges keyed by requestId. */
  passkeyChallenges: ReturnType<ReturnType<typeof open>["openDB"]>;
};

/**
 * Wrapper for LMDB database with transparent encryption support
 */
class EncryptedDB {
  constructor(private db: ReturnType<ReturnType<typeof open>["openDB"]>) {}

  get(key: any) {
    const value = this.db.get(key);
    return maybeDecrypt(value);
  }

  put(key: any, value: any) {
    const encrypted = maybeEncrypt(value);
    return this.db.put(key, encrypted);
  }

  remove(key: any) {
    return this.db.remove(key);
  }

  getRange(options?: any) {
    const range = this.db.getRange(options);
    // Return an iterator that decrypts values on-the-fly
    return {
      [Symbol.iterator]: function* () {
        for (const entry of range) {
          yield {
            ...entry,
            value: maybeDecrypt(entry.value),
          };
        }
      },
      map: function <T>(callback: (entry: any) => T): T[] {
        const results: T[] = [];
        for (const entry of range) {
          results.push(
            callback({
              ...entry,
              value: maybeDecrypt(entry.value),
            })
          );
        }
        return results;
      },
      filter: function (callback: (entry: any) => boolean) {
        const results: any[] = [];
        for (const entry of range) {
          const decryptedEntry = {
            ...entry,
            value: maybeDecrypt(entry.value),
          };
          if (callback(decryptedEntry)) {
            results.push(decryptedEntry);
          }
        }
        return results;
      },
      asArray: this.db.getRange(options).asArray,
    };
  }

  getKeys(options?: any) {
    return this.db.getKeys(options);
  }

  getCount() {
    return this.db.getCount();
  }

  clearAsync() {
    return this.db.clearAsync();
  }

  // Pass through other methods
  doesExist(key: any) {
    return this.db.doesExist(key);
  }
}

declare global {
  var __sbcLmdb: LmdbHandles | undefined;
}

function resolveDbPath() {
  const p = process.env.LMDB_PATH || ".data/lmdb";
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * Wrap database with encryption layer if enabled
 */
function wrapDB(db: ReturnType<ReturnType<typeof open>["openDB"]>) {
  return isEncryptionEnabled() ? new EncryptedDB(db) : db;
}

export function getLmdb(): LmdbHandles {
  // In dev/hot-reload, the global cached handles can outlive code changes.
  // If new DB handles are added over time (e.g. categories), upgrade the
  // cached object in-place instead of crashing on undefined.
  const existing = globalThis.__sbcLmdb as Partial<LmdbHandles> | undefined;
  if (existing?.root) {
    existing.businesses ??= wrapDB(existing.root.openDB({ name: "businesses" })) as any;
    existing.businessSlugs ??= wrapDB(existing.root.openDB({ name: "businessSlugs" })) as any;
    existing.categories ??= wrapDB(existing.root.openDB({ name: "categories" })) as any;
    existing.categorySlugs ??= wrapDB(existing.root.openDB({ name: "categorySlugs" })) as any;
    existing.users ??= wrapDB(existing.root.openDB({ name: "users" })) as any;
    existing.userEmails ??= wrapDB(existing.root.openDB({ name: "userEmails" })) as any;
    existing.userPhones ??= wrapDB(existing.root.openDB({ name: "userPhones" })) as any;
    existing.userCategoryFollows ??= wrapDB(existing.root.openDB({ name: "userCategoryFollows" })) as any;
    existing.userBusinessLikes ??= wrapDB(existing.root.openDB({ name: "userBusinessLikes" })) as any;
    existing.userBusinessSaves ??= wrapDB(existing.root.openDB({ name: "userBusinessSaves" })) as any;
    existing.businessLikeCounts ??= wrapDB(existing.root.openDB({ name: "businessLikeCounts" })) as any;
    existing.businessComments ??= wrapDB(existing.root.openDB({ name: "businessComments" })) as any;
    existing.chatConversations ??= wrapDB(existing.root.openDB({ name: "chatConversations" })) as any;
    existing.chatMessages ??= wrapDB(existing.root.openDB({ name: "chatMessages" })) as any;
    existing.businessRequests ??= wrapDB(existing.root.openDB({ name: "businessRequests" })) as any;

    // Store products
    existing.products ??= wrapDB(existing.root.openDB({ name: "products" })) as any;
    existing.productSlugs ??= wrapDB(existing.root.openDB({ name: "productSlugs" })) as any;

    // Program subscriptions (store purchases)
    existing.programSubscriptions ??= wrapDB(existing.root.openDB({ name: "programSubscriptions" })) as any;

    // Loyalty / CRM
    existing.loyaltySubscriptions ??= wrapDB(existing.root.openDB({ name: "loyaltySubscriptions" })) as any;
    existing.loyaltyProfiles ??= wrapDB(existing.root.openDB({ name: "loyaltyProfiles" })) as any;
    existing.loyaltySettings ??= wrapDB(existing.root.openDB({ name: "loyaltySettings" })) as any;
    existing.loyaltyCustomers ??= wrapDB(existing.root.openDB({ name: "loyaltyCustomers" })) as any;
    existing.loyaltyCards ??= wrapDB(existing.root.openDB({ name: "loyaltyCards" })) as any;
    existing.loyaltyMessages ??= wrapDB(existing.root.openDB({ name: "loyaltyMessages" })) as any;
    existing.loyaltyPushSubscriptions ??= wrapDB(existing.root.openDB({ name: "loyaltyPushSubscriptions" })) as any;
    existing.appleWalletRegistrations ??= wrapDB(existing.root.openDB({ name: "appleWalletRegistrations" })) as any;
    existing.passkeyCredentials ??= wrapDB(existing.root.openDB({ name: "passkeyCredentials" })) as any;
    existing.userPasskeys ??= wrapDB(existing.root.openDB({ name: "userPasskeys" })) as any;
    existing.passkeyChallenges ??= wrapDB(existing.root.openDB({ name: "passkeyChallenges" })) as any;

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

  const businesses = wrapDB(root.openDB({ name: "businesses" }));
  const businessSlugs = wrapDB(root.openDB({ name: "businessSlugs" }));
  const categories = wrapDB(root.openDB({ name: "categories" }));
  const categorySlugs = wrapDB(root.openDB({ name: "categorySlugs" }));
  const users = wrapDB(root.openDB({ name: "users" }));
  const userEmails = wrapDB(root.openDB({ name: "userEmails" }));
  const userPhones = wrapDB(root.openDB({ name: "userPhones" }));
  const userCategoryFollows = wrapDB(root.openDB({ name: "userCategoryFollows" }));
  const userBusinessLikes = wrapDB(root.openDB({ name: "userBusinessLikes" }));
  const userBusinessSaves = wrapDB(root.openDB({ name: "userBusinessSaves" }));
  const businessLikeCounts = wrapDB(root.openDB({ name: "businessLikeCounts" }));
  const businessComments = wrapDB(root.openDB({ name: "businessComments" }));
  const chatConversations = wrapDB(root.openDB({ name: "chatConversations" }));
  const chatMessages = wrapDB(root.openDB({ name: "chatMessages" }));
  const businessRequests = wrapDB(root.openDB({ name: "businessRequests" }));

  const products = wrapDB(root.openDB({ name: "products" }));
  const productSlugs = wrapDB(root.openDB({ name: "productSlugs" }));

  const programSubscriptions = wrapDB(root.openDB({ name: "programSubscriptions" }));

  // Loyalty / CRM
  const loyaltySubscriptions = wrapDB(root.openDB({ name: "loyaltySubscriptions" }));
  const loyaltyProfiles = wrapDB(root.openDB({ name: "loyaltyProfiles" }));
  const loyaltySettings = wrapDB(root.openDB({ name: "loyaltySettings" }));
  const loyaltyCustomers = wrapDB(root.openDB({ name: "loyaltyCustomers" }));
  const loyaltyCards = wrapDB(root.openDB({ name: "loyaltyCards" }));
  const loyaltyMessages = wrapDB(root.openDB({ name: "loyaltyMessages" }));
  const loyaltyPushSubscriptions = wrapDB(root.openDB({ name: "loyaltyPushSubscriptions" }));
  const appleWalletRegistrations = wrapDB(root.openDB({ name: "appleWalletRegistrations" }));
  const passkeyCredentials = wrapDB(root.openDB({ name: "passkeyCredentials" }));
  const userPasskeys = wrapDB(root.openDB({ name: "userPasskeys" }));
  const passkeyChallenges = wrapDB(root.openDB({ name: "passkeyChallenges" }));

  globalThis.__sbcLmdb = {
    root,
    businesses: businesses as any,
    businessSlugs: businessSlugs as any,
    categories: categories as any,
    categorySlugs: categorySlugs as any,
    users: users as any,
    userEmails: userEmails as any,
    userPhones: userPhones as any,
    userCategoryFollows: userCategoryFollows as any,
    userBusinessLikes: userBusinessLikes as any,
    userBusinessSaves: userBusinessSaves as any,
    businessLikeCounts: businessLikeCounts as any,
    businessComments: businessComments as any,
    chatConversations: chatConversations as any,
    chatMessages: chatMessages as any,
    businessRequests: businessRequests as any,
    products: products as any,
    productSlugs: productSlugs as any,
    programSubscriptions: programSubscriptions as any,
    loyaltySubscriptions: loyaltySubscriptions as any,
    loyaltyProfiles: loyaltyProfiles as any,
    loyaltySettings: loyaltySettings as any,
    loyaltyCustomers: loyaltyCustomers as any,
    loyaltyCards: loyaltyCards as any,
    loyaltyMessages: loyaltyMessages as any,
    loyaltyPushSubscriptions: loyaltyPushSubscriptions as any,
    appleWalletRegistrations: appleWalletRegistrations as any,
    passkeyCredentials: passkeyCredentials as any,
    userPasskeys: userPasskeys as any,
    passkeyChallenges: passkeyChallenges as any,
  };

  return globalThis.__sbcLmdb;
}
