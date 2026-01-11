export type Locale = "en" | "ar";

export type Role = "admin" | "user";

export type LocalizedString = {
  en: string;
  ar: string;
};

export type Category = {
  id: string;
  slug: string;
  name: LocalizedString;
  createdAt: string;
  updatedAt: string;
};
export type Business = {
  id: string;
  slug: string;
  /** Optional owner user id (set by admin by linking a user email). */
  ownerId?: string;
  name: LocalizedString;
  description?: LocalizedString;
  /** Legacy free-text category (kept for backward-compat + search). Prefer categoryId. */
  category?: string;
  /** Reference to a managed Category (admin-defined, bilingual). */
  categoryId?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  tags?: string[];
  media?: {
    cover?: string;
    logo?: string;
    banner?: string;
    gallery?: string[];
    videos?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  /** Optional, user-editable profile display name. */
  displayName?: string;
  /** Optional, user-editable short bio. */
  bio?: string;
  /** Optional avatar media URL (served via /media/...). */
  avatarUrl?: string;
  /** Optional updated timestamp (profile edits, avatar changes, etc). */
  updatedAt?: string;
};

export type LoyaltyPlan = "starter" | "pro";

export type LoyaltySubscription = {
  /** Subscription is keyed by the owner userId. */
  userId: string;
  plan: LoyaltyPlan;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

/**
 * Loyalty profile is what gets encoded into a QR/join link.
 * One profile per business owner (user) for now.
 */
export type LoyaltyProfile = {
  userId: string;
  businessName: string;
  /** Optional logo URL (usually a /media/... url). */
  logoUrl?: string;
  /** Public join code (unique) used in /loyalty/join/[code]. */
  joinCode: string;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyCustomer = {
  id: string;
  /** Business owner (our user id). */
  userId: string;
  /** Optional: future-proof for multi-business owners. */
  businessId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  /** The issued loyalty card id for this customer. */
  cardId: string;
  /** Simple points system (phase 1). */
  points: number;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyCard = {
  id: string;
  userId: string;
  customerId: string;
  /** Optional: future-proof for multi-business owners. */
  businessId?: string;
  status: "active" | "revoked";
  points: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgramId = "directory" | "loyalty" | "marketing";

export type ProgramSubscription = {
  /** The owner user id. */
  userId: string;
  program: ProgramId;
  /** Selected package/plan id within the program (e.g. "yearly", "6mo", "home-top"). */
  plan: string;
  status: "active" | "inactive";
  /** Start time for the current active period (resets when expired and re-purchased). */
  startedAt: string;
  /** Expiry time for the current active period. */
  expiresAt: string;
  /** Updated whenever the user purchases again (also extends expiresAt). */
  updatedAt: string;
};
