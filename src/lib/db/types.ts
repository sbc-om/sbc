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
  image?: string;
  /** Category icon id (used as default visual when no image is provided). */
  iconId?: string;
  /** Optional hierarchy (for sub-categories). */
  parentId?: string;
  createdAt: string;
  updatedAt: string;
};
export type Business = {
  id: string;
  slug: string;
  /** Optional public username used for /@handle URLs. */
  username?: string;
  /** Optional owner user id (set by admin by linking a user email). */
  ownerId?: string;
  name: LocalizedString;
  description?: LocalizedString;
  /** Approved for listing in public directories. */
  isApproved?: boolean;
  /** Verified businesses get a blue check. */
  isVerified?: boolean;
  /** Special/VIP flag shown across the app. */
  isSpecial?: boolean;
  /** Show in homepage top-12 section. */
  homepageFeatured?: boolean;
  /** Show in homepage top-3 section. */
  homepageTop?: boolean;
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
  /** Custom domain for the business page (e.g., mybusiness.com) */
  customDomain?: string;
  /** Geographic location */
  latitude?: number;
  longitude?: number;
  media?: {
    cover?: string;
    logo?: string;
    banner?: string;
    gallery?: string[];
    videos?: string[];
  };
  /** Which avatar to display in listings/profile: category icon (default) or uploaded logo. */
  avatarMode?: "icon" | "logo";
  /** Whether to show AI-powered similar business recommendations on this business page. Defaults to true. */
  showSimilarBusinesses?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessCard = {
  id: string;
  businessId: string;
  ownerId: string;
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatarUrl?: string;
  bio?: string;
  isPublic: boolean;
  /** Approved by admin for public display. */
  isApproved?: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  phone: string;
  /** Unique public username/slug for the user profile. */
  username?: string;
  fullName: string;
  passwordHash: string;
  role: Role;
  /** Whether the account is active (admin-controlled). */
  isActive?: boolean;
  /** Verified/special account (blue check). */
  isVerified?: boolean;
  /** Whether the phone number has been verified via WhatsApp OTP. */
  isPhoneVerified?: boolean;
  /** Whether the user account is archived (soft delete). */
  isArchived?: boolean;
  /** When the account was archived. */
  archivedAt?: string;
  createdAt: string;
  /** Approval status for new accounts or contact updates. */
  approvalStatus?: "pending" | "approved";
  /** Why approval is needed (new account or contact update). */
  approvalReason?: "new" | "contact_update";
  /** When approval was requested. */
  approvalRequestedAt?: string;
  /** When approval was granted. */
  approvedAt?: string;
  /** Pending contact updates awaiting approval. */
  pendingEmail?: string;
  pendingPhone?: string;
  /** Optional, user-editable profile display name. */
  displayName?: string;
  /** Optional, user-editable short bio. */
  bio?: string;
  /** Optional avatar media URL (served via /media/...). */
  avatarUrl?: string;
  /** Optional updated timestamp (profile edits, avatar changes, etc). */
  updatedAt?: string;
};

export type PasskeyCredential = {
  /** Base64url-encoded credential id. */
  id: string;
  userId: string;
  /** Base64url-encoded public key. */
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
  deviceType?: "singleDevice" | "multiDevice";
  backedUp?: boolean;
  label?: string;
  createdAt: string;
  lastUsedAt?: string;
};

export type BusinessCommentStatus = "pending" | "approved" | "rejected";

export type BusinessComment = {
  id: string;
  businessId: string;
  userId: string;
  text: string;
  status: BusinessCommentStatus;
  moderatedByUserId?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: Locale;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
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
  /** Optional: business location for map display / wallet location notifications. */
  location?: {
    /** Latitude in WGS84 */
    lat: number;
    /** Longitude in WGS84 */
    lng: number;
    /** Notification radius around the business in meters. */
    radiusMeters: number;
    /** Optional human-friendly label (address/place name). */
    label?: string;
  };
  createdAt: string;
  updatedAt: string;
};

/**
 * Per-business loyalty settings.
 * These control how points are redeemed and how points are rendered on the customer card.
 */
export type LoyaltySettings = {
  /** Business owner (our user id). */
  userId: string;
  /** Minimum points required to allow a redemption. */
  pointsRequiredPerRedemption: number;
  /** Points deducted each time a redemption happens. */
  pointsDeductPerRedemption: number;
  /** Which icon source to use when rendering points as icons. */
  pointsIconMode: "logo" | "custom";
  /** Custom icon URL (usually a /media/... url). Only used when pointsIconMode === "custom". */
  pointsIconUrl?: string;
  /** Card design customization for wallet passes */
  cardDesign?: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    backgroundStyle: "solid" | "gradient" | "pattern";
    logoPosition: "top" | "center" | "corner";
    showBusinessName: boolean;
    showCustomerName: boolean;
    cornerRadius: number;
  };

  /** Optional pass details shown in wallet UIs (e.g., iOS back fields / Android text modules). */
  walletPassDescription?: string;
  walletPassTerms?: string;
  walletWebsiteUrl?: string;
  walletSupportEmail?: string;
  walletSupportPhone?: string;
  walletAddress?: string;

  /** Barcode configuration used on the pass (preview + pass generation). */
  walletBarcodeFormat?: "qr" | "code128";
  walletBarcodeMessage?: string;

  /** Default notification template used for sample previews / messaging. */
  walletNotificationTitle?: string;
  walletNotificationBody?: string;
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
  /** Stable member ID shown in wallet passes (QR/barcode value). */
  memberId: string;
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

/**
 * A broadcast message from the business to customers.
 * - If customerId is missing, message is for all customers of that business.
 * - If customerId is set, message is targeted.
 */
export type LoyaltyMessage = {
  id: string;
  /** Business owner (our user id). */
  userId: string;
  /** Optional targeted customer (loyalty customer id). */
  customerId?: string;
  title: string;
  body: string;
  createdAt: string;
};

/**
 * A stored Web Push subscription for a loyalty customer.
 * Used for sending push notifications to customers who opted in (PWA/browser push).
 */
export type LoyaltyPushSubscription = {
  /** Unique id (derived from customerId + endpoint hash). */
  id: string;
  /** Business owner (our user id). */
  userId: string;
  /** Loyalty customer id (within this business). */
  customerId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  /** Optional user-agent snapshot for debugging. */
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * A stored Web Push subscription for a platform user.
 * Used for sending push notifications to users who opted in.
 */
export type UserPushSubscription = {
  /** Unique id (derived from userId + endpoint hash). */
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  /** Optional user-agent snapshot for debugging. */
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Apple Wallet device registration (PassKit web service).
 * This is required to deliver pass updates and Wallet-style alerts via APNs.
 */
export type AppleWalletRegistration = {
  /** Compound id: `${passTypeIdentifier}:${serialNumber}:${deviceLibraryIdentifier}` */
  id: string;
  passTypeIdentifier: string;
  /** Pass serial number (we use loyalty card id). */
  serialNumber: string;
  deviceLibraryIdentifier: string;
  /** APNs push token provided by Wallet on install. */
  pushToken: string;
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

// ==================== Loyalty Card Templates ====================

/**
 * A saved card design template that business owners create.
 * This is the "master design" that customers' issued cards inherit from.
 */
export type LoyaltyCardTemplate = {
  id: string;
  /** Business owner user id. */
  userId: string;
  /** Template name for identification (e.g., "Gold Member", "VIP Card"). */
  name: string;
  /** Whether this is the default/active template for new cards. */
  isDefault: boolean;
  /** Card design settings */
  design: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    backgroundStyle: "solid" | "gradient" | "pattern";
    logoPosition: "top" | "center" | "corner";
    showBusinessName: boolean;
    showCustomerName: boolean;
    cornerRadius: number;
  };
  /** Pass content configuration */
  passContent: {
    programName: string;
    pointsLabel: string;
    /** Header field (top) */
    headerLabel?: string;
    headerValue?: string;
    /** Secondary field */
    secondaryLabel?: string;
    secondaryValue?: string;
    /** Auxiliary fields (below points) */
    auxFields?: Array<{ label: string; value: string }>;
    /** Back of card fields (detail section) */
    backFields?: Array<{ label: string; value: string }>;
  };
  /** Barcode configuration */
  barcode: {
    format: "qr" | "code128" | "pdf417" | "aztec";
    /** Message template - supports {{memberId}}, {{customerId}}, {{cardId}}, {{phone}} */
    messageTemplate?: string;
    /** Alt text template (shown below barcode) */
    altTextTemplate?: string;
  };
  /** Image URLs */
  images: {
    logoUrl?: string;
    iconUrl?: string;
    stripUrl?: string;
    thumbnailUrl?: string;
  };
  /** Contact and support info */
  support: {
    websiteUrl?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  /** Terms and description */
  terms?: string;
  description?: string;
  /** Notification defaults */
  notificationTitle?: string;
  notificationBody?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * An issued customer card linked to a template.
 * This represents the actual card that a customer has in their wallet.
 */
export type LoyaltyIssuedCard = {
  id: string;
  /** Business owner user id. */
  userId: string;
  /** Reference to the template used for this card. */
  templateId: string;
  /** Reference to the loyalty customer. */
  customerId: string;
  /** Current points balance. */
  points: number;
  /** Card status. */
  status: "active" | "suspended" | "revoked";
  /** Unique member ID for this card (used in barcodes). */
  memberId: string;
  /** Override values for this specific card (optional). */
  overrides?: {
    secondaryLabel?: string;
    secondaryValue?: string;
    auxFields?: Array<{ label: string; value: string }>;
  };
  /** Google Wallet save URL (cached). */
  googleSaveUrl?: string;
  /** Apple Wallet registration status. */
  appleRegistered?: boolean;
  /** Last points update timestamp. */
  lastPointsUpdate?: string;
  createdAt: string;
  updatedAt: string;
};
