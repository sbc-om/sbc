import { nanoid } from "nanoid";
import { createHash } from "node:crypto";

import { query, transaction } from "./postgres";
import type {
  LoyaltySubscription,
  LoyaltyProfile,
  LoyaltySettings,
  LoyaltyCustomer,
  LoyaltyCard,
  LoyaltyMessage,
  LoyaltyPushSubscription,
  AppleWalletRegistration,
} from "./types";

// ==================== Subscriptions ====================

type LoyaltySubscriptionRow = {
  user_id: string;
  plan: LoyaltySubscription["plan"];
  status: LoyaltySubscription["status"];
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyProfileRow = {
  user_id: string;
  business_name: string;
  logo_url: string | null;
  join_code: string;
  location: LoyaltyProfile["location"] | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltySettingsRow = {
  user_id: string;
  points_required_per_redemption: number | null;
  points_deduct_per_redemption: number | null;
  points_icon_mode: LoyaltySettings["pointsIconMode"] | null;
  points_icon_url: string | null;
  card_design: LoyaltySettings["cardDesign"] | null;
  wallet_pass_description: string | null;
  wallet_pass_terms: string | null;
  wallet_website_url: string | null;
  wallet_support_email: string | null;
  wallet_support_phone: string | null;
  wallet_address: string | null;
  wallet_barcode_format: LoyaltySettings["walletBarcodeFormat"] | null;
  wallet_barcode_message: string | null;
  wallet_notification_title: string | null;
  wallet_notification_body: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyCustomerRow = {
  id: string;
  user_id: string;
  business_id: string | null;
  full_name: string;
  member_id: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  tags: string[] | null;
  card_id: string | null;
  points: number | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyCardRow = {
  id: string;
  user_id: string;
  customer_id: string;
  business_id: string | null;
  status: LoyaltyCard["status"];
  points: number | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type LoyaltyMessageRow = {
  id: string;
  user_id: string;
  customer_id: string | null;
  title: string;
  body: string;
  created_at: Date | null;
};

type LoyaltyPushSubscriptionRow = {
  id: string;
  user_id: string;
  customer_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  user_agent: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type AppleWalletRegistrationRow = {
  id: string;
  pass_type_identifier: string;
  serial_number: string;
  device_library_identifier: string;
  push_token: string;
  updated_at: Date | null;
};

function rowToSubscription(row: LoyaltySubscriptionRow): LoyaltySubscription {
  return {
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getLoyaltySubscription(userId: string): Promise<LoyaltySubscription | null> {
  const result = await query<LoyaltySubscriptionRow>(`SELECT * FROM loyalty_subscriptions WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? rowToSubscription(result.rows[0]) : null;
}

export async function createLoyaltySubscription(userId: string, plan: string): Promise<LoyaltySubscription> {
  const now = new Date();
  const result = await query<LoyaltySubscriptionRow>(`
    INSERT INTO loyalty_subscriptions (user_id, plan, status, created_at, updated_at)
    VALUES ($1, $2, 'active', $3, $3)
    ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active', updated_at = $3
    RETURNING *
  `, [userId, plan, now]);
  return rowToSubscription(result.rows[0]);
}

// ==================== Profiles ====================

function rowToProfile(row: LoyaltyProfileRow): LoyaltyProfile {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    logoUrl: row.logo_url ?? undefined,
    joinCode: row.join_code,
    location: row.location ?? undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getLoyaltyProfile(userId: string): Promise<LoyaltyProfile | null> {
  const result = await query<LoyaltyProfileRow>(`SELECT * FROM loyalty_profiles WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? rowToProfile(result.rows[0]) : null;
}

export async function getLoyaltyProfileByJoinCode(joinCode: string): Promise<LoyaltyProfile | null> {
  const result = await query<LoyaltyProfileRow>(`SELECT * FROM loyalty_profiles WHERE join_code = $1`, [joinCode]);
  return result.rows.length > 0 ? rowToProfile(result.rows[0]) : null;
}

export async function createOrUpdateLoyaltyProfile(input: {
  userId: string;
  businessName: string;
  logoUrl?: string;
  joinCode: string;
  location?: LoyaltyProfile["location"];
}): Promise<LoyaltyProfile> {
  const now = new Date();
  const result = await query<LoyaltyProfileRow>(`
    INSERT INTO loyalty_profiles (user_id, business_name, logo_url, join_code, location, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = $2,
      logo_url = $3,
      join_code = $4,
      location = $5,
      updated_at = $6
    RETURNING *
  `, [input.userId, input.businessName, input.logoUrl, input.joinCode, input.location ? JSON.stringify(input.location) : null, now]);
  return rowToProfile(result.rows[0]);
}

// ==================== Settings ====================

function rowToSettings(row: LoyaltySettingsRow): LoyaltySettings {
  return {
    userId: row.user_id,
    pointsRequiredPerRedemption: row.points_required_per_redemption ?? 10,
    pointsDeductPerRedemption: row.points_deduct_per_redemption ?? 10,
    pointsIconMode: row.points_icon_mode ?? "logo",
    pointsIconUrl: row.points_icon_url ?? undefined,
    cardDesign: row.card_design ?? undefined,
    walletPassDescription: row.wallet_pass_description ?? undefined,
    walletPassTerms: row.wallet_pass_terms ?? undefined,
    walletWebsiteUrl: row.wallet_website_url ?? undefined,
    walletSupportEmail: row.wallet_support_email ?? undefined,
    walletSupportPhone: row.wallet_support_phone ?? undefined,
    walletAddress: row.wallet_address ?? undefined,
    walletBarcodeFormat: row.wallet_barcode_format ?? "qr",
    walletBarcodeMessage: row.wallet_barcode_message ?? undefined,
    walletNotificationTitle: row.wallet_notification_title ?? undefined,
    walletNotificationBody: row.wallet_notification_body ?? undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

/** Default loyalty settings for a user who hasn't configured any */
export function defaultLoyaltySettings(userId: string): LoyaltySettings {
  const now = new Date().toISOString();
  return {
    userId,
    pointsRequiredPerRedemption: 10,
    pointsDeductPerRedemption: 10,
    pointsIconMode: "logo",
    walletBarcodeFormat: "qr",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getLoyaltySettings(userId: string): Promise<LoyaltySettings | null> {
  const result = await query<LoyaltySettingsRow>(`SELECT * FROM loyalty_settings WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? rowToSettings(result.rows[0]) : null;
}

export async function createOrUpdateLoyaltySettings(
  userId: string,
  settings: Partial<Omit<LoyaltySettings, "userId" | "createdAt" | "updatedAt">>
): Promise<LoyaltySettings> {
  const now = new Date();
  const result = await query<LoyaltySettingsRow>(`
    INSERT INTO loyalty_settings (
      user_id, points_required_per_redemption, points_deduct_per_redemption,
      points_icon_mode, points_icon_url, card_design, wallet_pass_description,
      wallet_pass_terms, wallet_website_url, wallet_support_email, wallet_support_phone,
      wallet_address, wallet_barcode_format, wallet_barcode_message,
      wallet_notification_title, wallet_notification_body, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
    ON CONFLICT (user_id) DO UPDATE SET
      points_required_per_redemption = COALESCE($2, loyalty_settings.points_required_per_redemption),
      points_deduct_per_redemption = COALESCE($3, loyalty_settings.points_deduct_per_redemption),
      points_icon_mode = COALESCE($4, loyalty_settings.points_icon_mode),
      points_icon_url = $5,
      card_design = COALESCE($6, loyalty_settings.card_design),
      wallet_pass_description = $7,
      wallet_pass_terms = $8,
      wallet_website_url = $9,
      wallet_support_email = $10,
      wallet_support_phone = $11,
      wallet_address = $12,
      wallet_barcode_format = COALESCE($13, loyalty_settings.wallet_barcode_format),
      wallet_barcode_message = $14,
      wallet_notification_title = $15,
      wallet_notification_body = $16,
      updated_at = $17
    RETURNING *
  `, [
    userId,
    settings.pointsRequiredPerRedemption,
    settings.pointsDeductPerRedemption,
    settings.pointsIconMode,
    settings.pointsIconUrl,
    settings.cardDesign ? JSON.stringify(settings.cardDesign) : null,
    settings.walletPassDescription,
    settings.walletPassTerms,
    settings.walletWebsiteUrl,
    settings.walletSupportEmail,
    settings.walletSupportPhone,
    settings.walletAddress,
    settings.walletBarcodeFormat,
    settings.walletBarcodeMessage,
    settings.walletNotificationTitle,
    settings.walletNotificationBody,
    now
  ]);
  return rowToSettings(result.rows[0]);
}

// ==================== Customers ====================

function rowToCustomer(row: LoyaltyCustomerRow): LoyaltyCustomer {
  return {
    id: row.id,
    userId: row.user_id,
    businessId: row.business_id ?? undefined,
    fullName: row.full_name,
    memberId: row.member_id,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags || [],
    cardId: row.card_id ?? undefined,
    points: row.points ?? 0,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createLoyaltyCustomer(input: {
  userId: string;
  fullName: string;
  memberId: string;
  phone?: string;
  email?: string;
}): Promise<LoyaltyCustomer> {
  return transaction(async (client) => {
    const customerId = nanoid();
    const cardId = nanoid();
    const now = new Date();

    // Create customer
    await client.query(`
      INSERT INTO loyalty_customers (id, user_id, full_name, member_id, phone, email, card_id, points, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $8)
    `, [customerId, input.userId, input.fullName, input.memberId, input.phone, input.email, cardId, now]);

    // Create card
    await client.query(`
      INSERT INTO loyalty_cards (id, user_id, customer_id, status, points, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', 0, $4, $4)
    `, [cardId, input.userId, customerId, now]);

    const result = await client.query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE id = $1`, [customerId]);
    return rowToCustomer(result.rows[0]);
  });
}

export async function getLoyaltyCustomerById(id: string): Promise<LoyaltyCustomer | null> {
  const result = await query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToCustomer(result.rows[0]) : null;
}

export async function getLoyaltyCustomerByMemberId(userId: string, memberId: string): Promise<LoyaltyCustomer | null> {
  const result = await query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE user_id = $1 AND member_id = $2`, [userId, memberId]);
  return result.rows.length > 0 ? rowToCustomer(result.rows[0]) : null;
}

export async function listLoyaltyCustomers(userId: string): Promise<LoyaltyCustomer[]> {
  const result = await query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return result.rows.map(rowToCustomer);
}

export async function updateLoyaltyCustomer(
  id: string,
  update: Partial<Pick<LoyaltyCustomer, "fullName" | "phone" | "email" | "notes" | "tags">>
): Promise<LoyaltyCustomer> {
  const result = await query<LoyaltyCustomerRow>(`
    UPDATE loyalty_customers SET
      full_name = COALESCE($1, full_name),
      phone = $2,
      email = $3,
      notes = $4,
      tags = COALESCE($5, tags),
      updated_at = $6
    WHERE id = $7
    RETURNING *
  `, [update.fullName, update.phone, update.email, update.notes, update.tags, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToCustomer(result.rows[0]);
}

export async function adjustCustomerPoints(id: string, delta: number): Promise<LoyaltyCustomer> {
  return transaction(async (client) => {
    const customerRes = await client.query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE id = $1 FOR UPDATE`, [id]);
    if (customerRes.rows.length === 0) throw new Error("NOT_FOUND");
    const customer = rowToCustomer(customerRes.rows[0]);

    const newPoints = Math.max(0, customer.points + delta);
    const now = new Date();

    await client.query(`UPDATE loyalty_customers SET points = $1, updated_at = $2 WHERE id = $3`, [newPoints, now, id]);
    await client.query(`UPDATE loyalty_cards SET points = $1, updated_at = $2 WHERE id = $3`, [newPoints, now, customer.cardId]);

    const result = await client.query<LoyaltyCustomerRow>(`SELECT * FROM loyalty_customers WHERE id = $1`, [id]);
    return rowToCustomer(result.rows[0]);
  });
}

export async function deleteLoyaltyCustomer(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM loyalty_customers WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ==================== Cards ====================

function rowToCard(row: LoyaltyCardRow): LoyaltyCard {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id,
    businessId: row.business_id ?? undefined,
    status: row.status,
    points: row.points ?? 0,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getLoyaltyCardById(id: string): Promise<LoyaltyCard | null> {
  const result = await query<LoyaltyCardRow>(`SELECT * FROM loyalty_cards WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToCard(result.rows[0]) : null;
}

export async function getLoyaltyCardByCustomerId(customerId: string): Promise<LoyaltyCard | null> {
  const result = await query<LoyaltyCardRow>(`SELECT * FROM loyalty_cards WHERE customer_id = $1`, [customerId]);
  return result.rows.length > 0 ? rowToCard(result.rows[0]) : null;
}

// ==================== Messages ====================

function rowToMessage(row: LoyaltyMessageRow): LoyaltyMessage {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id ?? undefined,
    title: row.title,
    body: row.body,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createLoyaltyMessage(input: {
  userId: string;
  customerId?: string;
  title: string;
  body: string;
}): Promise<LoyaltyMessage> {
  const id = nanoid();
  const now = new Date();

  const result = await query<LoyaltyMessageRow>(`
    INSERT INTO loyalty_messages (id, user_id, customer_id, title, body, created_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [id, input.userId, input.customerId, input.title, input.body, now]);

  return rowToMessage(result.rows[0]);
}

export async function listLoyaltyMessages(userId: string): Promise<LoyaltyMessage[]> {
  const result = await query<LoyaltyMessageRow>(`SELECT * FROM loyalty_messages WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return result.rows.map(rowToMessage);
}

export async function listLoyaltyMessagesForCustomer(input: {
  userId: string;
  customerId: string;
  limit?: number;
}): Promise<LoyaltyMessage[]> {
  const limit = input.limit ?? 100;
  const result = await query<LoyaltyMessageRow>(`
    SELECT * FROM loyalty_messages 
    WHERE user_id = $1 AND (customer_id = $2 OR customer_id IS NULL)
    ORDER BY created_at DESC
    LIMIT $3
  `, [input.userId, input.customerId, limit]);
  return result.rows.map(rowToMessage);
}

// ==================== Push Subscriptions ====================

function rowToPushSub(row: LoyaltyPushSubscriptionRow): LoyaltyPushSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id,
    endpoint: row.endpoint,
    keys: row.keys,
    userAgent: row.user_agent ?? undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function hashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 16);
}

export async function upsertLoyaltyPushSubscription(input: {
  userId: string;
  customerId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<LoyaltyPushSubscription> {
  const id = `${input.customerId}:${hashEndpoint(input.endpoint)}`;
  const now = new Date();

  const result = await query<LoyaltyPushSubscriptionRow>(`
    INSERT INTO loyalty_push_subscriptions (id, user_id, customer_id, endpoint, keys, user_agent, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    ON CONFLICT (id) DO UPDATE SET
      endpoint = $4,
      keys = $5,
      user_agent = $6,
      updated_at = $7
    RETURNING *
  `, [id, input.userId, input.customerId, input.endpoint, input.keys, input.userAgent, now]);

  return rowToPushSub(result.rows[0]);
}

export async function listLoyaltyPushSubscriptionsByCustomer(customerId: string): Promise<LoyaltyPushSubscription[]> {
  const result = await query<LoyaltyPushSubscriptionRow>(`SELECT * FROM loyalty_push_subscriptions WHERE customer_id = $1`, [customerId]);
  return result.rows.map(rowToPushSub);
}

export async function listLoyaltyPushSubscriptionsByBusiness(userId: string): Promise<LoyaltyPushSubscription[]> {
  const result = await query<LoyaltyPushSubscriptionRow>(`SELECT * FROM loyalty_push_subscriptions WHERE user_id = $1`, [userId]);
  return result.rows.map(rowToPushSub);
}

export async function removeLoyaltyPushSubscription(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM loyalty_push_subscriptions WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ==================== Apple Wallet Registrations ====================

function rowToAppleWalletReg(row: AppleWalletRegistrationRow): AppleWalletRegistration {
  return {
    id: row.id,
    passTypeIdentifier: row.pass_type_identifier,
    serialNumber: row.serial_number,
    deviceLibraryIdentifier: row.device_library_identifier,
    pushToken: row.push_token,
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function upsertAppleWalletRegistration(input: {
  passTypeIdentifier: string;
  serialNumber: string;
  deviceLibraryIdentifier: string;
  pushToken: string;
}): Promise<AppleWalletRegistration> {
  const id = `${input.passTypeIdentifier}:${input.serialNumber}:${input.deviceLibraryIdentifier}`;
  const now = new Date();

  const result = await query<AppleWalletRegistrationRow>(`
    INSERT INTO apple_wallet_registrations (id, pass_type_identifier, serial_number, device_library_identifier, push_token, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET push_token = $5, updated_at = $6
    RETURNING *
  `, [id, input.passTypeIdentifier, input.serialNumber, input.deviceLibraryIdentifier, input.pushToken, now]);

  return rowToAppleWalletReg(result.rows[0]);
}

export async function removeAppleWalletRegistration(
  passTypeIdentifier: string,
  serialNumber: string,
  deviceLibraryIdentifier: string
): Promise<boolean> {
  const id = `${passTypeIdentifier}:${serialNumber}:${deviceLibraryIdentifier}`;
  const result = await query(`DELETE FROM apple_wallet_registrations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listAppleWalletRegistrationsForDevice(
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string
): Promise<AppleWalletRegistration[]> {
  const result = await query<AppleWalletRegistrationRow>(`
    SELECT * FROM apple_wallet_registrations
    WHERE device_library_identifier = $1 AND pass_type_identifier = $2
  `, [deviceLibraryIdentifier, passTypeIdentifier]);
  return result.rows.map(rowToAppleWalletReg);
}

export async function listAppleWalletRegistrationsForPass(
  passTypeIdentifier: string,
  serialNumber: string
): Promise<AppleWalletRegistration[]> {
  const result = await query<AppleWalletRegistrationRow>(`
    SELECT * FROM apple_wallet_registrations
    WHERE pass_type_identifier = $1 AND serial_number = $2
  `, [passTypeIdentifier, serialNumber]);
  return result.rows.map(rowToAppleWalletReg);
}

/**
 * Get push tokens for Apple Wallet push notifications for a given pass serial number
 */
export async function listAppleWalletPushTokensForSerial(
  passTypeIdentifier: string,
  serialNumber: string
): Promise<string[]> {
  const regs = await listAppleWalletRegistrationsForPass(passTypeIdentifier, serialNumber);
  return regs.map((r) => r.pushToken);
}

// ==================== Alias Functions for API Compatibility ====================

/** Alias for getLoyaltyProfile */
export const getLoyaltyProfileByUserId = getLoyaltyProfile;

/** Alias for getLoyaltySettings */
export const getLoyaltySettingsByUserId = getLoyaltySettings;

/** Alias for createOrUpdateLoyaltySettings */
export const upsertLoyaltySettings = createOrUpdateLoyaltySettings;

/** Alias for createOrUpdateLoyaltyProfile */
export const upsertLoyaltyProfile = createOrUpdateLoyaltyProfile;

/** Alias for listLoyaltyCustomers */
export const listLoyaltyCustomersByUser = listLoyaltyCustomers;

/** Alias for adjustCustomerPoints */
export const adjustLoyaltyCustomerPoints = adjustCustomerPoints;

/** Redeem customer points (deduct) */
export async function redeemLoyaltyCustomerPoints(
  customerId: string,
  pointsToDeduct: number
): Promise<LoyaltyCustomer> {
  return adjustCustomerPoints(customerId, -Math.abs(pointsToDeduct));
}

/** List all loyalty profiles (for admin) */
export async function listLoyaltyProfiles(): Promise<LoyaltyProfile[]> {
  const result = await query(`SELECT * FROM loyalty_profiles ORDER BY created_at DESC`);
  return result.rows.map(rowToProfile);
}
