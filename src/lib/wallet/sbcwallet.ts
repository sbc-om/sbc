/**
 * SBC Wallet Integration
 * Provides Apple Wallet and Google Wallet functionality for loyalty cards.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  GoogleWalletAdapter,
  getProfile,
  type ChildPassData,
  type ParentPassData,
  type PassData,
  type ProfileConfig,
} from "sbcwallet";
import forge from "node-forge";
import { PKPass } from "passkit-generator";

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

function getAppleWalletAuthSecret(): string | undefined {
  return env("APPLE_WALLET_AUTH_SECRET") || env("AUTH_JWT_SECRET");
}

export function buildAppleWalletAuthToken(input: { serialNumber: string; passTypeIdentifier?: string }): string | undefined {
  const secret = getAppleWalletAuthSecret();
  if (!secret) return undefined;
  const payload = `${input.passTypeIdentifier ?? ""}:${input.serialNumber}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAppleWalletAuthToken(input: {
  authorization: string | null;
  serialNumber: string;
  passTypeIdentifier?: string;
}): boolean {
  const token = buildAppleWalletAuthToken({
    serialNumber: input.serialNumber,
    passTypeIdentifier: input.passTypeIdentifier,
  });
  if (!token || !input.authorization) return false;
  const prefix = "ApplePass ";
  if (!input.authorization.startsWith(prefix)) return false;
  const supplied = input.authorization.slice(prefix.length).trim();
  return supplied === token;
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
// Adapter Getters
// ============================================================================

type AppleAdapterConfig = {
  teamId: string;
  passTypeId: string;
  certPath: string;
  keyPath?: string;
  wwdrPath: string;
  certPassword: string;
};

function isPkcs12Path(p: string): boolean {
  return /\.(p12|pfx)$/i.test(p);
}

function loadAppleCertificates(config: AppleAdapterConfig): {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
} {
  if (!fileExists(config.wwdrPath)) throw new Error("APPLE_WWDR_PATH_NOT_FOUND");
  if (!fileExists(config.certPath)) throw new Error("APPLE_CERT_PATH_NOT_FOUND");

  const wwdr = fs.readFileSync(resolveFromCwd(config.wwdrPath));
  const certPath = resolveFromCwd(config.certPath);
  const keyPath = config.keyPath ? resolveFromCwd(config.keyPath) : undefined;

  if (isPkcs12Path(certPath)) {
    const passphrase = config.certPassword || "";
    const p12Buffer = fs.readFileSync(certPath);
    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]
      ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag];
    if (!keyBags || !keyBags.length) throw new Error("APPLE_CERT_KEY_NOT_FOUND_IN_P12");

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    if (!certBags || !certBags.length) throw new Error("APPLE_CERT_NOT_FOUND_IN_P12");

    const privateKey = keyBags[0].key;
    if (!privateKey) throw new Error("APPLE_CERT_KEY_IS_UNDEFINED");
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    
    const cert = certBags[0].cert;
    if (!cert) throw new Error("APPLE_CERT_IS_UNDEFINED");
    const certPem = forge.pki.certificateToPem(cert);

    return {
      wwdr,
      signerCert: Buffer.from(certPem),
      signerKey: Buffer.from(privateKeyPem),
    };
  }

  const signerCert = fs.readFileSync(certPath);
  const signerKey = keyPath ? fs.readFileSync(keyPath) : signerCert;

  return {
    wwdr,
    signerCert,
    signerKey,
    signerKeyPassphrase: config.certPassword || undefined,
  };
}

function mergeAppleTemplates(base: Record<string, unknown>, profile: Record<string, unknown>): Record<string, unknown> {
  const baseGeneric = typeof base.generic === "object" && base.generic ? base.generic as Record<string, unknown> : {};
  const profileGeneric = typeof profile.generic === "object" && profile.generic ? profile.generic as Record<string, unknown> : {};

  return {
    ...base,
    ...profile,
    generic: {
      ...baseGeneric,
      ...profileGeneric,
      primaryFields: (profileGeneric.primaryFields ?? baseGeneric.primaryFields) as unknown,
      secondaryFields: (profileGeneric.secondaryFields ?? baseGeneric.secondaryFields) as unknown,
      auxiliaryFields: (profileGeneric.auxiliaryFields ?? baseGeneric.auxiliaryFields) as unknown,
      backFields: (profileGeneric.backFields ?? baseGeneric.backFields) as unknown,
      headerFields: (profileGeneric.headerFields ?? baseGeneric.headerFields) as unknown,
    },
  };
}

function getFieldValue(key: string, passData: PassData): string {
  const keys = key.split(".");
  let value: unknown = passData as unknown;
  for (const k of keys) {
    if (value && typeof value === "object" && k in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return "";
    }
  }

  if (key === "scheduleId" || key === "orderId" || key === "batchId" || key === "visitId") {
    return passData.id;
  }
  if (key === "windowFrom" && passData.type === "parent" && passData.window) {
    return new Date(passData.window.from).toLocaleString();
  }
  if (key === "windowTo" && passData.type === "parent" && passData.window) {
    return new Date(passData.window.to).toLocaleString();
  }

  return value !== undefined && value !== null ? String(value) : "";
}

function populateAppleTemplate(template: Record<string, unknown>, passData: PassData): Record<string, unknown> {
  const populated = { ...template } as Record<string, unknown>;
  const generic = (populated.generic && typeof populated.generic === "object")
    ? populated.generic as Record<string, unknown>
    : undefined;

  if (generic) {
    const fieldGroups = ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"] as const;
    for (const group of fieldGroups) {
      const fields = generic[group];
      if (Array.isArray(fields)) {
        generic[group] = fields.map((field) => {
          if (!field || typeof field !== "object") return field;
          const key = String((field as Record<string, unknown>).key ?? "");
          if (!key) return field;
          const value = getFieldValue(key, passData);
          return { ...field, value: value || (field as Record<string, unknown>).value };
        });
      }
    }
  }

  if (Array.isArray(populated.barcodes) && populated.barcodes.length > 0) {
    const barcodeValue = passData.type === "child" ? (passData.memberId || passData.id) : passData.id;
    const first = populated.barcodes[0];
    if (first && typeof first === "object") {
      populated.barcodes[0] = { ...first, message: barcodeValue };
    }
  }

  return populated;
}

class FixedAppleWalletAdapter {
  private config: AppleAdapterConfig;

  constructor(config: AppleAdapterConfig) {
    this.config = config;
  }

  async generatePkpass(passData: PassData, profile: ProfileConfig, passType: "parent" | "child"): Promise<Buffer> {
    const profileTemplate = (profile?.defaultTemplates?.apple?.[passType] ?? {}) as Record<string, unknown>;
    const baseTemplate: Record<string, unknown> = {
      formatVersion: 1,
      organizationName: "sbcwallet",
      description: "sbcwallet Pass",
      generic: {
        primaryFields: [],
        secondaryFields: [],
        auxiliaryFields: [],
        backFields: [],
        headerFields: [],
      },
    };

    const template = mergeAppleTemplates(baseTemplate, profileTemplate);
    const populatedTemplate = populateAppleTemplate(template, passData);

    const appleWallet = passData?.metadata?.appleWallet || {};

    const passJson: Record<string, unknown> = {
      ...populatedTemplate,
      serialNumber: passData.id,
      description: appleWallet.description || populatedTemplate.description || "sbcwallet Pass",
      organizationName: appleWallet.organizationName || populatedTemplate.organizationName || "sbcwallet",
      passTypeIdentifier: this.config.passTypeId,
      teamIdentifier: this.config.teamId,
    };

    if (appleWallet.backgroundColor || populatedTemplate.backgroundColor) {
      passJson.backgroundColor = appleWallet.backgroundColor || populatedTemplate.backgroundColor;
    }
    if (appleWallet.foregroundColor || populatedTemplate.foregroundColor) {
      passJson.foregroundColor = appleWallet.foregroundColor || populatedTemplate.foregroundColor;
    }
    if (appleWallet.labelColor || populatedTemplate.labelColor) {
      passJson.labelColor = appleWallet.labelColor || populatedTemplate.labelColor;
    }
    if (appleWallet.logoText || populatedTemplate.logoText) {
      passJson.logoText = appleWallet.logoText || populatedTemplate.logoText;
    }

    if (Array.isArray(populatedTemplate.barcodes) && populatedTemplate.barcodes.length > 0) {
      passJson.barcodes = populatedTemplate.barcodes;
    }

    if (appleWallet.passOverrides && typeof appleWallet.passOverrides === "object") {
      Object.assign(passJson, appleWallet.passOverrides);
    }

    const assets: Record<string, Buffer> = {
      "pass.json": Buffer.from(JSON.stringify(passJson)),
    };

    const iconPath = resolveFromCwd("public/icon-192.png");
    if (fileExists(iconPath)) {
      assets["icon.png"] = fs.readFileSync(iconPath);
    }

    const icon2xPath = resolveFromCwd("public/icon-512.png");
    if (fileExists(icon2xPath)) {
      assets["icon@2x.png"] = fs.readFileSync(icon2xPath);
    }

    const certificates = loadAppleCertificates(this.config);
    const pass = new PKPass(assets, certificates);

    return await pass.getAsBuffer();
  }
}

function getAppleAdapter(): FixedAppleWalletAdapter {
  const teamId = env("APPLE_TEAM_ID") || "";
  const passTypeId = env("APPLE_PASS_TYPE_ID") || "";
  const certPath = env("APPLE_CERT_PATH") || "";
  const keyPath = env("APPLE_KEY_PATH") || "";
  const wwdrPath = env("APPLE_WWDR_PATH") || "";
  const certPassword = env("APPLE_CERT_PASSWORD") || "";

  return new FixedAppleWalletAdapter({
    teamId,
    passTypeId,
    certPath: certPath ? resolveFromCwd(certPath) : certPath,
    keyPath: keyPath ? resolveFromCwd(keyPath) : undefined,
    wwdrPath: wwdrPath ? resolveFromCwd(wwdrPath) : wwdrPath,
    certPassword,
  });
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

  const messages = await listLoyaltyMessagesForCustomer({
    userId: card.userId,
    customerId: card.customerId,
    limit: 1,
  });
  const latestMessage = messages[0];

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
  const appleBarcodes = [{
    format: appleBarcodeFormat,
    message: barcodeMessage,
    messageEncoding: "iso-8859-1",
    altText: memberId,
  }];

  const passTypeIdentifier = env("APPLE_PASS_TYPE_ID");
  const authToken = input.webServiceUrl && passTypeIdentifier
    ? buildAppleWalletAuthToken({ serialNumber: card.id, passTypeIdentifier })
    : undefined;

  const passData = buildLoyaltyChildPassData({
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
    appleWallet: {
      description: settings.walletPassDescription || `${businessName} Loyalty Card`,
      organizationName: businessName,
      logoText: design?.showBusinessName === false ? "" : businessName,
      backgroundColor: appleBackground || undefined,
      foregroundColor: appleForeground || undefined,
      labelColor: appleLabel || undefined,
      passOverrides: {
        barcodes: appleBarcodes,
        locations: profile?.location
          ? [{ latitude: profile.location.lat, longitude: profile.location.lng }]
          : undefined,
        relevantText: settings.walletPassDescription || undefined,
        webServiceURL: authToken ? input.webServiceUrl : undefined,
        authenticationToken: authToken || undefined,
        userInfo: {
          programId,
          businessUserId: card.userId,
          cardId: card.id,
          customerId: customer.id,
        },
      },
    },
  });

  const profileConfig = getProfile("loyalty");

  const adapter = getAppleAdapter();
  return await adapter.generatePkpass(passData, profileConfig, "child");
}

export async function getSbcwalletApplePkpassForBusinessCard(input: {
  cardId: string;
  publicCardUrl?: string;
  origin?: string;
  webServiceUrl?: string;
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
  const appleBarcodes = [{
    format: appleBarcodeFormat,
    message: data.barcodeMessage,
    messageEncoding: "iso-8859-1",
    altText: data.memberId,
  }];

  const passTypeIdentifier = env("APPLE_PASS_TYPE_ID");
  const authToken = input.webServiceUrl && passTypeIdentifier
    ? buildAppleWalletAuthToken({ serialNumber: data.card.id, passTypeIdentifier })
    : undefined;

  const passData = buildLoyaltyChildPassData({
    cardId: data.card.id,
    programId: data.programId,
    customerId: data.card.id,
    customerName: data.card.fullName,
    memberId: data.memberId,
    points: 0,
    updatedAt: new Date(String(data.card.updatedAt || new Date().toISOString())),
    publicCardUrl: input.publicCardUrl,
    settings: data.settings,
    appleWallet: {
      description: data.settings.walletPassDescription || `${data.businessName} Business Card`,
      organizationName: data.businessName,
      logoText: design?.showBusinessName === false ? "" : data.businessName,
      backgroundColor: appleBackground || undefined,
      foregroundColor: appleForeground || undefined,
      labelColor: appleLabel || undefined,
      passOverrides: {
        barcodes: appleBarcodes,
        webServiceURL: authToken ? input.webServiceUrl : undefined,
        authenticationToken: authToken || undefined,
      },
    },
  });

  const profileConfig = getProfile("loyalty");
  const adapter = getAppleAdapter();
  return await adapter.generatePkpass(passData, profileConfig, "child");
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
