/**
 * Wallet Updates Module
 * Provides wallet card update functionality for Apple Wallet and Google Wallet.
 * Updates loyalty points across both platforms when changes occur.
 */

import { notifyAppleWalletPassUpdated, isAppleApnsConfigured } from "./appleApns";
import { isSbcwalletGoogleConfigured, updateGoogleWalletLoyaltyPoints } from "./sbcwallet";

export interface WalletUpdateResult {
  success: boolean;
  apple?: {
    configured: boolean;
    attempted: number;
    succeeded: number;
    failed: number;
  };
  google?: {
    configured: boolean;
    updated: boolean;
    error?: string;
  };
  errors: string[];
}

/**
 * Update loyalty card in both Apple Wallet and Google Wallet.
 * @param input - Card ID, current points, and optional delta
 * @returns Result of wallet update operations
 */
export async function updateWalletCardPoints(input: {
  cardId: string;
  points: number;
  delta?: number;
}): Promise<WalletUpdateResult> {
  const result: WalletUpdateResult = {
    success: false,
    errors: [],
  };

  let anySuccess = false;

  // Update Apple Wallet via APNs
  try {
    const appleConfigured = isAppleApnsConfigured();
    
    if (appleConfigured) {
      const apnsResult = await notifyAppleWalletPassUpdated({ cardId: input.cardId });
      
      result.apple = {
        configured: true,
        attempted: apnsResult.attempted,
        succeeded: apnsResult.ok,
        failed: apnsResult.failed,
      };

      if (apnsResult.ok > 0) {
        anySuccess = true;
      }

      if (apnsResult.failed > 0) {
        result.errors.push(`Apple Wallet: ${apnsResult.failed} notification(s) failed`);
      }
    } else {
      result.apple = {
        configured: false,
        attempted: 0,
        succeeded: 0,
        failed: 0,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "APPLE_UPDATE_FAILED";
    result.errors.push(`Apple Wallet error: ${message}`);
    result.apple = {
      configured: isAppleApnsConfigured(),
      attempted: 0,
      succeeded: 0,
      failed: 1,
    };
  }

  // Update Google Wallet via API
  try {
    const googleConfigured = isSbcwalletGoogleConfigured();
    
    if (googleConfigured) {
      await updateGoogleWalletLoyaltyPoints({
        cardId: input.cardId,
        points: input.points,
      });

      result.google = {
        configured: true,
        updated: true,
      };

      anySuccess = true;
    } else {
      result.google = {
        configured: false,
        updated: false,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "GOOGLE_UPDATE_FAILED";
    result.errors.push(`Google Wallet error: ${message}`);
    result.google = {
      configured: isSbcwalletGoogleConfigured(),
      updated: false,
      error: message,
    };
  }

  result.success = anySuccess;
  return result;
}

/**
 * Trigger wallet update without waiting for results (fire-and-forget).
 * @param input - Card ID, points, and optional delta
 */
export function triggerWalletUpdate(input: {
  cardId: string;
  points: number;
  delta?: number;
}): void {
  updateWalletCardPoints(input).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[WalletUpdate] Failed:", error);
    }
  });
}

/**
 * Check if any wallet provider is configured.
 * @returns true if Apple or Google Wallet is configured
 */
export function isAnyWalletConfigured(): boolean {
  return isAppleApnsConfigured() || isSbcwalletGoogleConfigured();
}

/**
 * Get wallet configuration status for all providers.
 * @returns Configuration status for each wallet provider
 */
export function getWalletStatus(): {
  apple: { configured: boolean };
  google: { configured: boolean };
  anyConfigured: boolean;
} {
  const apple = isAppleApnsConfigured();
  const google = isSbcwalletGoogleConfigured();

  return {
    apple: { configured: apple },
    google: { configured: google },
    anyConfigured: apple || google,
  };
}

// ============================================================================
// Template-based Wallet Generation
// ============================================================================

import { GoogleWalletAdapter, getProfile } from "sbcwallet";
import type { LoyaltyCardTemplate, LoyaltyProfile } from "@/lib/db/types";

function hexToRgb(hex: string): string {
  const h = hex.replace(/^#/, "");
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function normalizeHexColor(input?: string): string | undefined {
  if (!input) return undefined;
  const v = input.trim();
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(v);
  if (!m) return undefined;
  return `#${m[1].toUpperCase()}`;
}

function resolveBarcodeMessage(template: string | undefined, vars: Record<string, string>): string {
  const raw = String(template ?? "").trim();
  if (!raw) return vars.memberId || vars.customerId || vars.cardId;
  return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => vars[k] ?? "").trim() || raw;
}

function getGoogleAdapter(): GoogleWalletAdapter {
  const issuerId = process.env.GOOGLE_ISSUER_ID || "";
  const serviceAccountPath = process.env.GOOGLE_SA_JSON || "";
  const resolvedPath = serviceAccountPath.startsWith("/") 
    ? serviceAccountPath 
    : require("path").resolve(process.cwd(), serviceAccountPath);

  return new GoogleWalletAdapter({
    issuerId,
    serviceAccountPath: resolvedPath,
  });
}

/**
 * Generate Google Wallet save URL for an issued card with template.
 */
export async function generateGoogleWalletSaveUrl(input: {
  cardId: string;
  memberId: string;
  customerName: string;
  points: number;
  template: LoyaltyCardTemplate;
  profile?: LoyaltyProfile | null;
  origin?: string;
}): Promise<string> {
  const { cardId, memberId, customerName, points, template, profile, origin } = input;

  const businessName = profile?.businessName ?? template.passContent.programName;
  const programId = `loyalty-${template.userId}`;
  
  const barcodeMessage = resolveBarcodeMessage(template.barcode.messageTemplate, {
    memberId,
    customerId: cardId,
    cardId,
    phone: "",
  });

  const googleBarcodeType = template.barcode.format === "code128" ? "CODE_128" 
    : template.barcode.format === "pdf417" ? "PDF_417"
    : template.barcode.format === "aztec" ? "AZTEC"
    : "QR_CODE";

  // Build links array
  const links: Array<{ id?: string; label?: string; url?: string }> = [];
  if (template.support?.websiteUrl) {
    links.push({ id: "website", label: "Website", url: template.support.websiteUrl });
  }
  if (template.support?.email) {
    links.push({ id: "email", label: "Support", url: `mailto:${template.support.email}` });
  }
  if (template.support?.phone) {
    links.push({ id: "phone", label: "Call", url: `tel:${template.support.phone}` });
  }

  // Resolve logo URL
  const logoUrl = template.images?.logoUrl || profile?.logoUrl;

  const profileConfig = getProfile("loyalty");
  const adapter = getGoogleAdapter();

  // Build parent pass data (loyalty class)
  const parentPassData = {
    id: programId,
    type: "parent" as const,
    profile: "loyalty" as const,
    status: "ACTIVE" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    programName: businessName,
    metadata: {
      googleWallet: {
        issuerName: businessName,
        programName: businessName,
        logoUrl: logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${origin}${logoUrl}`) : undefined,
        backgroundColor: normalizeHexColor(template.design.backgroundColor),
        homepageUrl: template.support?.websiteUrl || origin,
        locations: profile?.location 
          ? [{ latitude: profile.location.lat, longitude: profile.location.lng }] 
          : undefined,
        classOverrides: {
          hexBackgroundColor: normalizeHexColor(template.design.backgroundColor),
          reviewStatus: "UNDER_REVIEW",
        },
      },
    },
  };

  await adapter.generatePassObject(parentPassData, profileConfig, "parent");

  // Build child pass data (loyalty object)
  const childPassData = {
    id: cardId,
    type: "child" as const,
    profile: "loyalty" as const,
    status: "ACTIVE" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: programId,
    customerId: cardId,
    customerName: template.design.showCustomerName ? customerName : undefined,
    memberId,
    points,
    metadata: {
      googleWallet: {
        issuerName: businessName,
        programName: businessName,
        logoUrl: logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${origin}${logoUrl}`) : undefined,
        backgroundColor: normalizeHexColor(template.design.backgroundColor),
        links: links.length > 0 ? links : undefined,
        objectOverrides: {
          barcode: {
            type: googleBarcodeType,
            value: barcodeMessage,
          },
        },
      },
    },
  };

  const { saveUrl } = await adapter.generatePassObject(childPassData, profileConfig, "child");
  return saveUrl;
}

/**
 * Generate Apple Wallet pass buffer for an issued card with template.
 * Uses sbcwallet's getPkpassBuffer for proper pass generation.
 * 
 * Flow: createBusiness -> createLoyaltyProgram -> createCustomerAccount -> issueLoyaltyCard -> getPkpassBuffer
 */
export async function generateApplePassFromTemplate(input: {
  cardId: string;
  memberId: string;
  customerName: string;
  phone?: string;
  points: number;
  template: LoyaltyCardTemplate;
  profile?: LoyaltyProfile | null;
  origin?: string;
  webServiceUrl?: string;
}): Promise<Buffer> {
  const { cardId, memberId, customerName, phone, points, template, profile, origin, webServiceUrl } = input;
  
  // Use sbcwallet's proper pass generation
  const { getPkpassBuffer, createBusiness, createCustomerAccount, createLoyaltyProgram, issueLoyaltyCard } = await import("sbcwallet");
  const crypto = await import("crypto");
  
  const businessName = profile?.businessName ?? template.passContent.programName ?? "Loyalty Program";
  
  // Use unique IDs per generation to avoid conflicts in sbcwallet's in-memory stores
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const businessId = `biz-${uniqueId}`;
  
  // Resolve barcode message
  const barcodeMessage = resolveBarcodeMessage(template.barcode.messageTemplate, {
    memberId,
    customerId: cardId,
    cardId,
    phone: phone ?? "",
  });
  
  // Map barcode format for Apple
  const appleBarcodeFormat = template.barcode.format === "code128" 
    ? "PKBarcodeFormatCode128"
    : template.barcode.format === "pdf417"
    ? "PKBarcodeFormatPDF417"
    : template.barcode.format === "aztec"
    ? "PKBarcodeFormatAztec"
    : "PKBarcodeFormatQR";

  // Generate auth token for webServiceURL
  let authToken: string | undefined;
  if (webServiceUrl) {
    authToken = crypto.randomBytes(32).toString("hex");
  }

  // Resolve logo URL - ensure it's a full URL
  let logoUrl = template.images?.logoUrl || profile?.logoUrl || "https://www.spirithubcafe.com/logo.png";
  if (logoUrl && !logoUrl.startsWith("http") && origin) {
    logoUrl = `${origin}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
  }

  // Build Apple Wallet metadata following sbcwallet's expected format
  const appleWalletMeta: Record<string, unknown> = {
    passStyle: "storeCard", // CRITICAL: Must be storeCard for loyalty cards
    backgroundColor: template.design.backgroundColor || "#1E40AF",
    foregroundColor: template.design.textColor || "#FFFFFF",
    labelColor: template.design.secondaryColor || "#93C5FD",
    logoText: template.design.showBusinessName === false ? "" : businessName,
    description: template.description || `${businessName} Loyalty Card`,
    organizationName: businessName,
    logoUrl: logoUrl,
    
    // Barcodes (both modern and legacy formats)
    barcodes: [{
      format: appleBarcodeFormat,
      message: barcodeMessage,
      messageEncoding: "iso-8859-1",
      altText: template.barcode.altTextTemplate 
        ? resolveBarcodeMessage(template.barcode.altTextTemplate, { memberId, customerId: cardId, cardId, phone: phone ?? "" })
        : memberId,
    }],
  };
  
  // Build passOverrides
  const passOverrides: Record<string, unknown> = {};
  
  // Add webServiceURL if provided (for real-time updates)
  if (webServiceUrl && authToken) {
    passOverrides.webServiceURL = webServiceUrl;
    passOverrides.authenticationToken = authToken;
  }

  // Add locations if available
  if (profile?.location) {
    passOverrides.locations = [{ latitude: profile.location.lat, longitude: profile.location.lng }];
  }
  
  if (Object.keys(passOverrides).length > 0) {
    appleWalletMeta.passOverrides = passOverrides;
  }

  // Add header fields if provided
  if (template.passContent.headerLabel || template.passContent.headerValue) {
    appleWalletMeta.headerFields = [{
      key: "header1",
      label: template.passContent.headerLabel || "",
      value: template.passContent.headerValue || "",
    }];
  }

  // Add secondary fields
  appleWalletMeta.secondaryFields = [
    { key: "status", label: template.passContent.secondaryLabel || "Status", value: template.passContent.secondaryValue || "Active" },
  ];

  // Add auxiliary fields from template
  if (template.passContent.auxFields && template.passContent.auxFields.length > 0) {
    appleWalletMeta.auxiliaryFields = template.passContent.auxFields.map((field, i) => ({
      key: `aux${i + 1}`,
      label: field.label,
      value: field.value,
    }));
  }

  // Build back fields
  const backFields: Array<{ key: string; label: string; value: string }> = [
    { key: "memberId", label: "Member ID", value: memberId },
    { key: "programId", label: "Program", value: businessName },
  ];

  // Add template back fields
  if (template.passContent.backFields && template.passContent.backFields.length > 0) {
    template.passContent.backFields.forEach((field, i) => {
      backFields.push({
        key: `back${i + 1}`,
        label: field.label,
        value: field.value,
      });
    });
  }

  // Add terms
  if (template.terms) {
    backFields.push({
      key: "terms",
      label: "Terms & Conditions",
      value: template.terms,
    });
  }

  // Add support info
  if (template.support?.email) {
    backFields.push({ key: "supportEmail", label: "Support Email", value: template.support.email });
  }
  if (template.support?.phone) {
    backFields.push({ key: "supportPhone", label: "Support Phone", value: template.support.phone });
  }
  if (template.support?.websiteUrl) {
    backFields.push({ key: "website", label: "Website", value: template.support.websiteUrl });
  }

  appleWalletMeta.backFields = backFields;

  // Step 1: Create a business
  const business = createBusiness({
    id: businessId,
    name: businessName,
    programName: template.passContent.programName || businessName,
    pointsLabel: template.passContent.pointsLabel || "Points",
  });

  // Step 2: Create loyalty program (this sets business.loyaltyProgramId)
  await createLoyaltyProgram({
    businessId: business.id,
    programName: template.passContent.programName || businessName,
    metadata: {
      appleWallet: appleWalletMeta,
    },
  });

  // Step 3: Create customer under this business
  const customer = createCustomerAccount({
    businessId: business.id,
    fullName: customerName,
    memberId: memberId,
  });

  // Step 4: Issue the card
  const card = await issueLoyaltyCard({
    businessId: business.id,
    customerId: customer.id,
    initialPoints: points,
  });

  // Step 5: Generate the pkpass buffer using sbcwallet
  const pkpassBuffer = await getPkpassBuffer("child", card);
  
  return pkpassBuffer;
}
