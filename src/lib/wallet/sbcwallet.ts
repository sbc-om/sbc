/**
 * SBC Wallet Integration
 * Provides Apple Wallet and Google Wallet functionality for loyalty cards.
 */

import fs from "node:fs";
import path from "node:path";

import { PKPass } from "passkit-generator";
import {
  GoogleWalletAdapter,
  getProfile,
  type ChildPassData,
  type ParentPassData,
} from "sbcwallet";

import {
  defaultLoyaltySettings,
  getLoyaltyCardById,
  getLoyaltyCustomerById,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyMessagesForCustomer,
} from "@/lib/db/loyalty";
import { getBusinessById } from "@/lib/db/businesses";
import { getBusinessCardById } from "@/lib/db/businessCards";
import type { LoyaltySettings } from "@/lib/db/types";

// ============================================================================
// Helper Functions
// ============================================================================

function hexToRgbCss(hex: string): string | null {
  const v = hex.trim();
  const m = /^#([0-9A-Fa-f]{6})$/.exec(v);
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function resolveBarcodeMessage(template: string | undefined, vars: Record<string, string>): string {
  const raw = String(template ?? "").trim();
  if (!raw) return vars.memberId || vars.customerId || vars.cardId;
  return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => vars[k] ?? "").trim() || raw;
}

function normalizeHexColor(input?: string): string | undefined {
  if (!input) return undefined;
  const v = input.trim();
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(v);
  if (!m) return undefined;
  return `#${m[1].toUpperCase()}`;
}

function sanitizeUrl(input?: string, allowedProtocols: string[] = ["http:", "https:"], allowLocalhost = true): string | undefined {
  if (!input) return undefined;
  try {
    const u = new URL(input);
    if (!allowedProtocols.includes(u.protocol)) return undefined;
    if (!allowLocalhost && (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname.startsWith("192.168."))) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

function resolvePublicUrl(rawUrl?: string, origin?: string): string | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (origin && trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return undefined;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function resolveFromCwd(p: string): string {
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

function fileExists(p?: string): boolean {
  if (!p) return false;
  try {
    return fs.existsSync(resolveFromCwd(p));
  } catch {
    return false;
  }
}

function hexToRgb(hex: string): string {
  const h = hex.replace(/^#/, "");
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function prepareLoyaltyCardData(input: {
  cardId: string;
  origin?: string;
}) {
  const card = await getLoyaltyCardById(input.cardId);
  if (!card || card.status !== "active") throw new Error("CARD_NOT_FOUND");

  const customer = await getLoyaltyCustomerById(card.customerId);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

  const profile = await getLoyaltyProfileByUserId(card.userId);
  const settings = await getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);

  const messages = await listLoyaltyMessagesForCustomer({
    userId: card.userId,
    customerId: card.customerId,
    limit: 1,
  });
  const latestMessage = messages[0];

  const businessName = profile?.businessName ?? "SBC";
  const programId = `loyalty-${card.userId}`;
  const design = settings.cardDesign;
  const memberId = customer.memberId;
  
  const barcodeMessage = resolveBarcodeMessage(settings.walletBarcodeMessage, {
    memberId,
    customerId: customer.id,
    cardId: card.id,
    phone: customer.phone ? String(customer.phone) : "",
  });
  
  const googleBarcodeType = settings.walletBarcodeFormat === "code128" ? "CODE_128" : "QR_CODE";

  const links: Array<{ id?: string; label?: string; url?: string; description?: string }> = [];
  const websiteUrl = sanitizeUrl(settings.walletWebsiteUrl);
  if (websiteUrl) links.push({ id: "website", label: "Website", url: websiteUrl });
  const supportEmail = settings.walletSupportEmail?.trim();
  if (supportEmail) links.push({ id: "email", label: "Support", url: `mailto:${supportEmail}` });
  const supportPhone = settings.walletSupportPhone?.trim();
  if (supportPhone) links.push({ id: "phone", label: "Call", url: `tel:${supportPhone}` });

  const publicLogoOverride = env("GOOGLE_WALLET_PUBLIC_LOGO_URL");
  const logoUrl = sanitizeUrl(publicLogoOverride, ["https:", "http:"], false) 
    || sanitizeUrl(resolvePublicUrl(profile?.logoUrl ?? undefined, input.origin), ["https:", "http:"], false);

  return {
    card,
    customer,
    profile,
    settings,
    latestMessage,
    businessName,
    programId,
    design,
    memberId,
    barcodeMessage,
    googleBarcodeType,
    links,
    logoUrl,
  };
}

async function prepareBusinessCardData(input: {
  cardId: string;
  origin?: string;
  publicCardUrl?: string;
}) {
  const card = await getBusinessCardById(input.cardId);
  if (!card || !card.isPublic) throw new Error("CARD_NOT_FOUND");

  const business = await getBusinessById(card.businessId);
  if (!business) throw new Error("BUSINESS_NOT_FOUND");

  const settings = await getLoyaltySettingsByUserId(card.ownerId) ?? defaultLoyaltySettings(card.ownerId);
  const businessName = business.name?.en || business.name?.ar || "SBC";
  const programId = `bizcard-${card.businessId}`;
  const design = settings.cardDesign;
  const memberId = card.id;

  const barcodeMessage = resolveBarcodeMessage(settings.walletBarcodeMessage, {
    memberId,
    cardId: card.id,
    phone: card.phone ? String(card.phone) : "",
  });

  const googleBarcodeType = settings.walletBarcodeFormat === "code128" ? "CODE_128" : "QR_CODE";

  const links: Array<{ id?: string; label?: string; url?: string; description?: string }> = [];
  const websiteUrl = sanitizeUrl(card.website || business.website || settings.walletWebsiteUrl);
  if (websiteUrl) links.push({ id: "website", label: "Website", url: websiteUrl });
  const supportEmail = (card.email || business.email || settings.walletSupportEmail)?.trim();
  if (supportEmail) links.push({ id: "email", label: "Email", url: `mailto:${supportEmail}` });
  const supportPhone = (card.phone || business.phone || settings.walletSupportPhone)?.trim();
  if (supportPhone) links.push({ id: "phone", label: "Call", url: `tel:${supportPhone}` });

  const publicLogoOverride = env("GOOGLE_WALLET_PUBLIC_LOGO_URL");
  const logoUrl = sanitizeUrl(publicLogoOverride, ["https:", "http:"], false)
    || sanitizeUrl(resolvePublicUrl(business.media?.logo ?? undefined, input.origin), ["https:", "http:"], false);

  const publicCardUrl = resolvePublicUrl(input.publicCardUrl, input.origin) || input.publicCardUrl;
  const effectiveBarcodeMessage = publicCardUrl || barcodeMessage;

  return {
    card,
    business,
    settings,
    businessName,
    programId,
    design,
    memberId,
    barcodeMessage: effectiveBarcodeMessage,
    googleBarcodeType,
    links,
    logoUrl,
  };
}

// ============================================================================
// Metadata Builders
// ============================================================================

function buildAppleWalletMetadata(settings?: LoyaltySettings | null, businessName?: string) {
  if (!settings?.cardDesign) return {};

  const design = settings.cardDesign;
  const name = businessName ?? "";
  return {
    organizationName: name,
    logoText: design.showBusinessName ? name : "",
    backgroundColor: hexToRgb(design.backgroundColor),
    foregroundColor: hexToRgb(design.textColor),
    labelColor: hexToRgb(design.secondaryColor),
    passOverrides: {
      description: settings.walletPassDescription || `${name} Loyalty Card`,
    },
  };
}

function buildGoogleWalletMetadata(settings?: LoyaltySettings | null, businessName?: string, logoUrl?: string) {
  if (!settings?.cardDesign) return {};

  const design = settings.cardDesign;
  const name = businessName ?? "";
  const backgroundColor = normalizeHexColor(design.backgroundColor);
  const safeLogoUrl = sanitizeUrl(logoUrl);
  
  if (process.env.NODE_ENV === "development") {
    console.log("[GoogleWallet] Building metadata - logoUrl input:", logoUrl, "- sanitized:", safeLogoUrl);
  }
  
  return {
    issuerName: name,
    programName: name,
    backgroundColor,
    logoUrl: safeLogoUrl,
    classOverrides: {
      hexBackgroundColor: backgroundColor,
      reviewStatus: "UNDER_REVIEW",
    },
  };
}

// ============================================================================
// Configuration Checks
// ============================================================================

export function isSbcwalletAppleConfigured(): boolean {
  const teamId = env("APPLE_TEAM_ID");
  const passTypeId = env("APPLE_PASS_TYPE_ID");
  const certPath = env("APPLE_CERT_PATH");
  const wwdrPath = env("APPLE_WWDR_PATH");

  if (!teamId || !passTypeId || !certPath || !wwdrPath) return false;
  if (!fileExists(certPath) || !fileExists(wwdrPath)) return false;

  return true;
}

export function isSbcwalletGoogleConfigured(): boolean {
  const issuerId = env("GOOGLE_ISSUER_ID");
  const saPath = env("GOOGLE_SA_JSON");

  if (!issuerId || !saPath) return false;
  if (!fileExists(saPath)) return false;

  return true;
}

// ============================================================================
// Apple Wallet Authentication
// ============================================================================

/**
 * Generate a deterministic auth token for a pass.
 * This token is included in the pass and sent back by Apple in update requests.
 * NOTE: This returns the raw token WITHOUT the "ApplePass " prefix.
 * Apple Wallet sends "Authorization: ApplePass <token>" header, so we store just <token>.
 * Apple requires authenticationToken to be at least 16 characters.
 */
export function generateAppleWalletAuthToken(input: {
  serialNumber: string;
  passTypeIdentifier: string;
}): string {
  // Use a simple but deterministic token based on serial + passType
  // In production, you might want to use a more secure approach
  const secret = env("APPLE_AUTH_TOKEN_SECRET") || env("JWT_SECRET") || "sbc-wallet-secret";
  const data = `${input.passTypeIdentifier}:${input.serialNumber}:${secret}`;
  // Simple hash - for production consider using crypto.createHmac
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Generate a second hash for extra length
  let hash2 = 0;
  const data2 = `${secret}:${input.serialNumber}:${input.passTypeIdentifier}`;
  for (let i = 0; i < data2.length; i++) {
    const char = data2.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  // Return raw token (min 16 chars required by Apple)
  // Format: hash1_hash2_serialPrefix = ensures at least 16 characters
  return `${Math.abs(hash).toString(36)}${Math.abs(hash2).toString(36)}${input.serialNumber.slice(0, 8)}`;
}

/**
 * Verify the authentication token from Apple Wallet update requests.
 * Apple sends "Authorization: ApplePass <token>" header.
 */
export function verifyAppleWalletAuthToken(input: {
  authorization: string | null;
  serialNumber: string;
  passTypeIdentifier: string;
}): boolean {
  if (!input.authorization) return false;
  
  // Apple sends "ApplePass <token>" - extract just the token part
  const token = input.authorization.startsWith("ApplePass ")
    ? input.authorization.slice("ApplePass ".length)
    : input.authorization;
  
  const expectedToken = generateAppleWalletAuthToken({
    serialNumber: input.serialNumber,
    passTypeIdentifier: input.passTypeIdentifier,
  });
  
  return token === expectedToken;
}

// ============================================================================
// Adapter Getters
// ============================================================================

export function getAppleConfig() {
  const teamId = env("APPLE_TEAM_ID") || "";
  const passTypeId = env("APPLE_PASS_TYPE_ID") || "";
  const certPath = env("APPLE_CERT_PATH") || "";
  const wwdrPath = env("APPLE_WWDR_PATH") || "";
  const certPassword = env("APPLE_CERT_PASSWORD") || "";

  // Derive PEM paths from the p12 path
  const basePath = certPath.replace(/\.p12$/, "");
  const certPemPath = `${basePath}_cert.pem`;
  const keyPemPath = `${basePath}_key.pem`;

  return {
    teamId,
    passTypeId,
    certPath: certPath ? resolveFromCwd(certPath) : certPath,
    certPemPath: certPemPath ? resolveFromCwd(certPemPath) : certPemPath,
    keyPemPath: keyPemPath ? resolveFromCwd(keyPemPath) : keyPemPath,
    wwdrPath: wwdrPath ? resolveFromCwd(wwdrPath) : wwdrPath,
    certPassword,
  };
}

async function generateApplePkpass(options: {
  serialNumber: string;
  description: string;
  organizationName: string;
  logoText?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  labelColor?: string;
  barcodes?: Array<{
    format: string;
    message: string;
    messageEncoding: string;
    altText?: string;
  }>;
  locations?: Array<{ latitude: number; longitude: number }>;
  webServiceURL?: string;
  authenticationToken?: string;
  userInfo?: Record<string, unknown>;
  generic?: {
    primaryFields?: Array<{ key: string; label: string; value: string }>;
    secondaryFields?: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields?: Array<{ key: string; label: string; value: string }>;
    backFields?: Array<{ key: string; label: string; value: string }>;
    headerFields?: Array<{ key: string; label: string; value: string }>;
  };
}): Promise<Buffer> {
  const config = getAppleConfig();

  // Read certificates as PEM files
  const wwdr = fs.readFileSync(config.wwdrPath);
  const signerCert = fs.readFileSync(config.certPemPath);
  const signerKey = fs.readFileSync(config.keyPemPath);

  // Read icon files (required by Apple)
  const iconPath = path.join(process.cwd(), "public", "images", "icon.png");
  const icon2xPath = path.join(process.cwd(), "public", "images", "icon@2x.png");
  
  // Build buffers object for icons
  const buffers: Record<string, Buffer> = {};
  if (fs.existsSync(iconPath)) {
    buffers["icon.png"] = fs.readFileSync(iconPath);
  }
  if (fs.existsSync(icon2xPath)) {
    buffers["icon@2x.png"] = fs.readFileSync(icon2xPath);
  }

  // Create the pass with icon buffers
  const pass = new PKPass(
    buffers,
    {
      wwdr,
      signerCert,
      signerKey,
    },
    {
      serialNumber: options.serialNumber,
      passTypeIdentifier: config.passTypeId,
      teamIdentifier: config.teamId,
      organizationName: options.organizationName,
      description: options.description,
      ...(options.backgroundColor && { backgroundColor: options.backgroundColor }),
      ...(options.foregroundColor && { foregroundColor: options.foregroundColor }),
      ...(options.labelColor && { labelColor: options.labelColor }),
      ...(options.logoText && { logoText: options.logoText }),
      ...(options.webServiceURL && options.authenticationToken && {
        webServiceURL: options.webServiceURL,
        authenticationToken: options.authenticationToken,
      }),
      ...(options.userInfo && { userInfo: options.userInfo }),
    }
  );

  // Set the pass type to generic (loyalty cards use generic type)
  pass.type = "generic";

  // Set barcodes
  if (options.barcodes && options.barcodes.length > 0) {
    pass.setBarcodes(
      ...options.barcodes.map(b => ({
        format: b.format as "PKBarcodeFormatQR" | "PKBarcodeFormatPDF417" | "PKBarcodeFormatAztec" | "PKBarcodeFormatCode128",
        message: b.message,
        messageEncoding: b.messageEncoding,
        altText: b.altText,
      }))
    );
  }

  // Set locations
  if (options.locations && options.locations.length > 0) {
    pass.setLocations(...options.locations);
  }

  // Set generic fields
  if (options.generic) {
    if (options.generic.primaryFields) {
      pass.primaryFields.push(...options.generic.primaryFields);
    }
    if (options.generic.secondaryFields) {
      pass.secondaryFields.push(...options.generic.secondaryFields);
    }
    if (options.generic.auxiliaryFields) {
      pass.auxiliaryFields.push(...options.generic.auxiliaryFields);
    }
    if (options.generic.backFields) {
      pass.backFields.push(...options.generic.backFields);
    }
    if (options.generic.headerFields) {
      pass.headerFields.push(...options.generic.headerFields);
    }
  }

  // Generate the pass buffer
  return pass.getAsBuffer();
}

function getGoogleAdapter(): GoogleWalletAdapter {
  const issuerId = env("GOOGLE_ISSUER_ID") || "";
  const serviceAccountPath = env("GOOGLE_SA_JSON") || "";

  return new GoogleWalletAdapter({
    issuerId,
    serviceAccountPath: serviceAccountPath ? resolveFromCwd(serviceAccountPath) : serviceAccountPath,
  });
}

// ============================================================================
// Pass Data Builders
// ============================================================================

function buildLoyaltyParentPassData(input: {
  programId: string;
  programName: string;
  updatedAt: Date;
  homepageUrl?: string;
  logoUrl?: string;
  location?: { lat: number; lng: number };
  settings?: LoyaltySettings | null;
}): ParentPassData {
  const nowIso = new Date().toISOString();
  const googleMetadata = buildGoogleWalletMetadata(input.settings, input.programName, input.logoUrl);
  const appleMetadata = buildAppleWalletMetadata(input.settings, input.programName);

  return {
    id: input.programId,
    type: "parent",
    profile: "loyalty",
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: input.updatedAt.toISOString(),
    programName: input.programName,
    metadata: {
      appleWallet: appleMetadata,
      googleWallet: {
        ...googleMetadata,
        homepageUrl: input.homepageUrl,
        locations: input.location
          ? [{ latitude: input.location.lat, longitude: input.location.lng }]
          : undefined,
      },
    },
  };
}

function buildLoyaltyChildPassData(input: {
  cardId: string;
  programId: string;
  customerId?: string;
  customerName?: string;
  memberId: string;
  points: number;
  updatedAt: Date;
  publicCardUrl?: string;
  latestMessage?: { title: string; body: string };
  location?: { lat: number; lng: number };
  settings?: LoyaltySettings | null;
  appleWallet?: {
    description?: string;
    organizationName?: string;
    logoText?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
    passOverrides?: Record<string, unknown>;
  };
  googleWallet?: {
    issuerName?: string;
    programName?: string;
    logoUrl?: string;
    backgroundColor?: string;
    links?: Array<{ id?: string; label?: string; url?: string; description?: string }>;
    messages?: Array<{ id?: string; header: string; body: string; messageType?: string }>;
    objectOverrides?: Record<string, unknown>;
  };
}): ChildPassData {
  const nowIso = new Date().toISOString();

  const googleWalletMessages = input.latestMessage
    ? [{
        id: "latest_message",
        header: input.latestMessage.title,
        body: input.latestMessage.body,
      }]
    : undefined;

  const googleWalletLinks: Array<{ id?: string; label?: string; url?: string; description?: string }> = (
    [
      ...(sanitizeUrl(input.publicCardUrl) ? [{ id: "card", label: "Card", url: sanitizeUrl(input.publicCardUrl) }] : []),
      ...(input.googleWallet?.links ?? []),
    ]
  ).filter((l) => Boolean(l && l.url));

  const showName = input.settings?.cardDesign?.showCustomerName ?? true;
  const displayName = showName ? input.customerName : undefined;

  return {
    id: input.cardId,
    type: "child",
    profile: "loyalty",
    status: "ACTIVE",
    createdAt: nowIso,
    updatedAt: input.updatedAt.toISOString(),
    parentId: input.programId,
    customerId: input.customerId,
    customerName: displayName,
    memberId: input.memberId,
    points: input.points,
    metadata: {
      appleWallet: input.appleWallet,
      googleWallet: {
        locations: input.location
          ? [{ latitude: input.location.lat, longitude: input.location.lng }]
          : undefined,
        issuerName: input.googleWallet?.issuerName,
        programName: input.googleWallet?.programName,
        logoUrl: input.googleWallet?.logoUrl,
        backgroundColor: input.googleWallet?.backgroundColor,
        links: googleWalletLinks.length ? googleWalletLinks : undefined,
        messages: [...(googleWalletMessages ?? []), ...(input.googleWallet?.messages ?? [])].length
          ? [...(googleWalletMessages ?? []), ...(input.googleWallet?.messages ?? [])]
          : undefined,
        objectOverrides: input.googleWallet?.objectOverrides,
      },
    },
  };
}

// ============================================================================
// Public API Functions
// ============================================================================

export async function getSbcwalletApplePkpassForLoyaltyCard(input: {
  cardId: string;
  publicCardUrl?: string;
  webServiceUrl?: string;
}): Promise<Buffer> {
  const card = await getLoyaltyCardById(input.cardId);
  if (!card || card.status !== "active") throw new Error("CARD_NOT_FOUND");

  const customer = await getLoyaltyCustomerById(card.customerId);
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

  const profile = await getLoyaltyProfileByUserId(card.userId);
  const settings = await getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);

  const programId = `loyalty-${card.userId}`;
  const businessName = profile?.businessName ?? "SBC";
  const design = settings.cardDesign;

  const appleBackground = design?.backgroundColor ? hexToRgbCss(design.backgroundColor) : null;
  const appleForeground = design?.textColor ? hexToRgbCss(design.textColor) : null;
  const appleLabel = design?.secondaryColor ? hexToRgbCss(design.secondaryColor) : null;

  const memberId = customer.memberId;
  const barcodeMessage = resolveBarcodeMessage(settings.walletBarcodeMessage, {
    memberId,
    customerId: customer.id,
    cardId: card.id,
    phone: customer.phone ? String(customer.phone) : "",
  });

  const appleBarcodeFormat = settings.walletBarcodeFormat === "code128" ? "PKBarcodeFormatCode128" : "PKBarcodeFormatQR";

  // Generate auth token for Apple Wallet web service updates
  const passTypeId = env("APPLE_PASS_TYPE_ID") || "";
  const authToken = generateAppleWalletAuthToken({
    serialNumber: card.id,
    passTypeIdentifier: passTypeId,
  });

  return await generateApplePkpass({
    serialNumber: card.id,
    description: settings.walletPassDescription || `${businessName} Loyalty Card`,
    organizationName: businessName,
    logoText: design?.showBusinessName === false ? "" : businessName,
    backgroundColor: appleBackground || undefined,
    foregroundColor: appleForeground || undefined,
    labelColor: appleLabel || undefined,
    webServiceURL: input.webServiceUrl,
    authenticationToken: input.webServiceUrl ? authToken : undefined,
    barcodes: [{
      format: appleBarcodeFormat,
      message: barcodeMessage,
      messageEncoding: "iso-8859-1",
      altText: memberId,
    }],
    locations: profile?.location
      ? [{ latitude: profile.location.lat, longitude: profile.location.lng }]
      : undefined,
    userInfo: {
      programId,
      businessUserId: card.userId,
      cardId: card.id,
      customerId: customer.id,
    },
    generic: {
      primaryFields: [
        { key: "customerName", label: "Customer", value: customer.fullName || "" },
      ],
      secondaryFields: [
        { key: "points", label: "Points", value: String(card.points) },
        { key: "status", label: "Status", value: "ACTIVE" },
      ],
      backFields: [
        { key: "memberId", label: "Member ID", value: memberId },
        { key: "parentId", label: "Program ID", value: programId },
      ],
    },
  });
}

export async function getSbcwalletApplePkpassForBusinessCard(input: {
  cardId: string;
  publicCardUrl?: string;
  origin?: string;
}): Promise<Buffer> {
  const data = await prepareBusinessCardData({
    cardId: input.cardId,
    origin: input.origin,
    publicCardUrl: input.publicCardUrl,
  });

  const design = data.design;
  const appleBackground = design?.backgroundColor ? hexToRgbCss(design.backgroundColor) : null;
  const appleForeground = design?.textColor ? hexToRgbCss(design.textColor) : null;
  const appleLabel = design?.secondaryColor ? hexToRgbCss(design.secondaryColor) : null;

  const appleBarcodeFormat = data.settings.walletBarcodeFormat === "code128" ? "PKBarcodeFormatCode128" : "PKBarcodeFormatQR";

  return await generateApplePkpass({
    serialNumber: data.card.id,
    description: data.settings.walletPassDescription || `${data.businessName} Business Card`,
    organizationName: data.businessName,
    logoText: design?.showBusinessName === false ? "" : data.businessName,
    backgroundColor: appleBackground || undefined,
    foregroundColor: appleForeground || undefined,
    labelColor: appleLabel || undefined,
    barcodes: [{
      format: appleBarcodeFormat,
      message: data.barcodeMessage,
      messageEncoding: "iso-8859-1",
      altText: data.memberId,
    }],
    generic: {
      primaryFields: [
        { key: "customerName", label: "Name", value: data.card.fullName || "" },
      ],
      secondaryFields: [
        { key: "business", label: "Business", value: data.businessName },
      ],
      backFields: [
        { key: "cardId", label: "Card ID", value: data.card.id },
      ],
    },
  });
}

export async function getSbcwalletGoogleSaveUrlForLoyaltyCard(input: {
  cardId: string;
  origin?: string;
  publicCardUrl?: string;
}): Promise<{ saveUrl: string }> {
  const {
    card,
    customer,
    profile,
    settings,
    latestMessage,
    businessName,
    programId,
    design,
    memberId,
    barcodeMessage,
    googleBarcodeType,
    links,
    logoUrl,
  } = await prepareLoyaltyCardData({ cardId: input.cardId, origin: input.origin });

  const profileConfig = getProfile("loyalty");
  const adapter = getGoogleAdapter();

  const parentPassData = buildLoyaltyParentPassData({
    programId,
    programName: businessName,
    updatedAt: new Date(String(profile?.updatedAt || new Date().toISOString())),
    homepageUrl: sanitizeUrl(settings.walletWebsiteUrl) || sanitizeUrl(input.origin),
    logoUrl,
    location: profile?.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined,
    settings,
  });

  await adapter.generatePassObject(parentPassData, profileConfig, "parent");

  const childPassData = buildLoyaltyChildPassData({
    cardId: card.id,
    programId,
    customerId: customer.id,
    customerName: customer.fullName,
    memberId,
    points: card.points,
    updatedAt: new Date(String(card.updatedAt || new Date().toISOString())),
    publicCardUrl: input.publicCardUrl,
    latestMessage: latestMessage ? { title: latestMessage.title, body: latestMessage.body } : undefined,
    location: profile?.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined,
    settings,
    googleWallet: {
      issuerName: businessName,
      programName: businessName,
      logoUrl,
      backgroundColor: normalizeHexColor(design?.backgroundColor),
      links,
      objectOverrides: {
        barcode: {
          type: googleBarcodeType,
          value: barcodeMessage,
        },
      },
    },
  });

  const { saveUrl } = await adapter.generatePassObject(childPassData, profileConfig, "child");
  return { saveUrl };
}

export async function getSbcwalletGoogleSaveUrlForBusinessCard(input: {
  cardId: string;
  origin?: string;
  publicCardUrl?: string;
}): Promise<{ saveUrl: string }> {
  const data = await prepareBusinessCardData({
    cardId: input.cardId,
    origin: input.origin,
    publicCardUrl: input.publicCardUrl,
  });

  const profileConfig = getProfile("loyalty");
  const adapter = getGoogleAdapter();

  const parentPassData = buildLoyaltyParentPassData({
    programId: data.programId,
    programName: data.businessName,
    updatedAt: new Date(String(data.card.updatedAt || new Date().toISOString())),
    homepageUrl: sanitizeUrl(data.business.website) || sanitizeUrl(input.origin),
    logoUrl: data.logoUrl,
    settings: data.settings,
  });

  await adapter.generatePassObject(parentPassData, profileConfig, "parent");

  const childPassData = buildLoyaltyChildPassData({
    cardId: data.card.id,
    programId: data.programId,
    customerId: data.card.id,
    customerName: data.card.fullName,
    memberId: data.memberId,
    points: 0,
    updatedAt: new Date(String(data.card.updatedAt || new Date().toISOString())),
    publicCardUrl: input.publicCardUrl,
    settings: data.settings,
    googleWallet: {
      issuerName: data.businessName,
      programName: data.businessName,
      logoUrl: data.logoUrl,
      backgroundColor: normalizeHexColor(data.design?.backgroundColor),
      links: data.links,
      objectOverrides: {
        barcode: {
          type: data.googleBarcodeType,
          value: data.barcodeMessage,
        },
      },
    },
  });

  const { saveUrl } = await adapter.generatePassObject(childPassData, profileConfig, "child");
  return { saveUrl };
}

/**
 * Update loyalty points on an existing Google Wallet pass.
 * Also ensures the parent class exists before updating the child object.
 */
export async function updateGoogleWalletLoyaltyPoints(input: {
  cardId: string;
  points: number;
}): Promise<void> {
  const {
    card,
    customer,
    profile,
    settings,
    latestMessage,
    businessName,
    programId,
    design,
    memberId,
    barcodeMessage,
    googleBarcodeType,
    links,
    logoUrl,
  } = await prepareLoyaltyCardData({ cardId: input.cardId });

  const profileConfig = getProfile("loyalty");
  const adapter = getGoogleAdapter();

  // Always ensure the parent class exists before creating/updating the child object
  const parentPassData = buildLoyaltyParentPassData({
    programId,
    programName: businessName,
    updatedAt: new Date(String(profile?.updatedAt || new Date().toISOString())),
    homepageUrl: sanitizeUrl(settings.walletWebsiteUrl),
    logoUrl,
    location: profile?.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined,
    settings,
  });

  // Create/update the parent class first
  await adapter.generatePassObject(parentPassData, profileConfig, "parent");

  const childPassData = buildLoyaltyChildPassData({
    cardId: card.id,
    programId,
    customerId: customer.id,
    customerName: customer.fullName,
    memberId,
    points: input.points,
    updatedAt: new Date(),
    latestMessage: latestMessage ? { title: latestMessage.title, body: latestMessage.body } : undefined,
    location: profile?.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined,
    settings,
    googleWallet: {
      issuerName: businessName,
      programName: businessName,
      logoUrl,
      backgroundColor: normalizeHexColor(design?.backgroundColor),
      links,
      objectOverrides: {
        barcode: {
          type: googleBarcodeType,
          value: barcodeMessage,
        },
      },
    },
  });

  await adapter.generatePassObject(childPassData, profileConfig, "child");
}
