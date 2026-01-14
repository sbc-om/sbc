import { importPKCS8, SignJWT } from "jose";
import type { LoyaltyClass, LoyaltyObject } from "google-wallet/lib/esm/loyalty";
import { StateEnum, BarcodeTypeEnum, ReviewStatusEnum } from "google-wallet/lib/esm/loyalty";

import {
  defaultLoyaltySettings,
  getLoyaltyCardById,
  getLoyaltyCustomerById,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyMessagesForCustomer,
} from "@/lib/db/loyalty";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

type GoogleWalletCredentials = {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
};

export function isGoogleWalletEnabled(): boolean {
  return String(process.env.GOOGLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

function isPkcs8PemPrivateKey(privateKey: string): boolean {
  const k = privateKey.trim();
  return k.includes("-----BEGIN PRIVATE KEY-----") && k.includes("-----END PRIVATE KEY-----");
}

function parseServiceAccountJson(raw: string): { client_email?: string; private_key?: string } {
  try {
    const parsed = JSON.parse(raw) as { client_email?: unknown; private_key?: unknown };
    return {
      client_email: typeof parsed.client_email === "string" ? parsed.client_email : undefined,
      private_key: typeof parsed.private_key === "string" ? parsed.private_key : undefined,
    };
  } catch {
    return {};
  }
}

function getGoogleWalletCredentialsFromEnv(): GoogleWalletCredentials {
  const issuerId = env("GOOGLE_WALLET_ISSUER_ID");

  const rawJson = env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
  const json = rawJson ? parseServiceAccountJson(rawJson) : {};

  const serviceAccountEmail = env("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL") ?? json.client_email;
  const privateKey = env("GOOGLE_WALLET_PRIVATE_KEY") ?? json.private_key;

  if (!issuerId) throw new Error("MISSING_ENV_GOOGLE_WALLET_ISSUER_ID");
  if (!serviceAccountEmail) throw new Error("MISSING_ENV_GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) throw new Error("MISSING_ENV_GOOGLE_WALLET_PRIVATE_KEY");

  const normalized = normalizePrivateKey(privateKey);
  if (!isPkcs8PemPrivateKey(normalized)) {
    throw new Error("INVALID_ENV_GOOGLE_WALLET_PRIVATE_KEY_FORMAT");
  }

  return {
    issuerId,
    serviceAccountEmail,
    privateKey: normalized,
  };
}

async function getGoogleWalletCredentials(): Promise<GoogleWalletCredentials> {
  // 1) Full JSON via env var
  const rawJson = env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
  if (rawJson) {
    const creds = parseServiceAccountJson(rawJson);
    if (creds.client_email && creds.private_key) {
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ??= creds.client_email;
      process.env.GOOGLE_WALLET_PRIVATE_KEY ??= creds.private_key;
    }
    return getGoogleWalletCredentialsFromEnv();
  }

  // 2) JSON file path (preferred, matches Google codelab)
  const jsonPath =
    env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_PATH") || env("GOOGLE_APPLICATION_CREDENTIALS");
  if (jsonPath) {
    const { readFile } = await import("node:fs/promises");
    const fileRaw = await readFile(jsonPath, "utf8");
    const creds = parseServiceAccountJson(fileRaw);
    if (creds.client_email && creds.private_key) {
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ??= creds.client_email;
      process.env.GOOGLE_WALLET_PRIVATE_KEY ??= creds.private_key;
    }
    return getGoogleWalletCredentialsFromEnv();
  }

  // 3) Fallback: individual env vars
  return getGoogleWalletCredentialsFromEnv();
}

export function isGoogleWalletConfigured(): boolean {
  if (!isGoogleWalletEnabled()) return false;

  // Keep this synchronous (used in route guards). We do a best-effort check
  // and leave strict validation to createGoogleWalletSaveJwt().
  const issuerId = env("GOOGLE_WALLET_ISSUER_ID");
  if (!issuerId) return false;

  const hasInlineJson = Boolean(env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON"));
  const hasJsonPath = Boolean(env("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_PATH") || env("GOOGLE_APPLICATION_CREDENTIALS"));
  const hasParts = Boolean(env("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL") && env("GOOGLE_WALLET_PRIVATE_KEY"));
  return hasInlineJson || hasJsonPath || hasParts;
}

function normalizePrivateKey(key: string): string {
  // Common .env pattern: \n escapes.
  if (key.includes("\\n")) return key.replace(/\\n/g, "\n");
  return key;
}

function sanitizeWalletIdSuffix(input: string): string {
  // Wallet object/class IDs are strict; keep it simple and stable.
  // Allow: letters, digits, dot, underscore, dash.
  const cleaned = input.replace(/[^A-Za-z0-9._-]/g, "_");
  // Avoid empty / too long IDs.
  const trimmed = cleaned.slice(0, 64);
  return trimmed || "id";
}

export async function createGoogleWalletSaveJwt(input: { cardId: string; origins?: string[] }): Promise<string> {
  const { issuerId, serviceAccountEmail: saEmail, privateKey } = await getGoogleWalletCredentials();

  const card = getLoyaltyCardById(input.cardId);
  if (!card || card.status !== "active") throw new Error("CARD_NOT_FOUND");

  const customer = getLoyaltyCustomerById(card.customerId);
  const profile = getLoyaltyProfileByUserId(card.userId);
  const settings = getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);
  const latestMessage = listLoyaltyMessagesForCustomer({ userId: card.userId, customerId: card.customerId, limit: 1 })[0];

  const businessName = profile?.businessName ?? "SBC";

  // IDs must be issuerId.suffix (no spaces). We keep suffix stable.
  const classId = `${issuerId}.sbc_loyalty`;
  const objectId = `${issuerId}.${sanitizeWalletIdSuffix(card.id)}`;

  const textModulesData = [
    {
      id: "points",
      header: "Points",
      body: String(card.points),
    },
  ];

  if (latestMessage) {
    textModulesData.push({
      id: "latest_message",
      header: latestMessage.title,
      body: latestMessage.body,
    });
  }

  const loyaltyClass: LoyaltyClass = {
    id: classId,
    issuerName: businessName,
    programName: businessName,
    reviewStatus: ReviewStatusEnum.UNDER_REVIEW,
    programLogo: profile?.logoUrl
      ? { sourceUri: { uri: profile.logoUrl } }
      : { sourceUri: { uri: "https://via.placeholder.com/100" } }, // Placeholder if no logo
    // Location-based suggestions (Google Wallet decides when to surface the card).
    ...(profile?.location && {
      locations: [
        {
          latitude: profile.location.lat,
          longitude: profile.location.lng,
        },
      ],
    }),
  };

  const loyaltyObject: LoyaltyObject = {
    id: objectId,
    classId,
    state: StateEnum.ACTIVE,
    accountId: customer?.id ?? card.customerId,
    accountName: customer?.fullName ?? "Customer",
    barcode: {
      type: BarcodeTypeEnum.QR_CODE,
      value: card.id,
      alternateText: card.id,
    },
    loyaltyPoints: {
      label: "Points",
      balance: { int: card.points },
    },
    textModulesData,
    // A hint for redemption rules (optional).
    infoModuleData: {
      labelValueRows: [
        {
          columns: [
            { label: "Redeem min", value: String(settings.pointsRequiredPerRedemption) },
            { label: "Deduct", value: String(settings.pointsDeductPerRedemption) },
          ],
        },
      ],
    },
  };

  const now = Math.floor(Date.now() / 1000);
  let key: Awaited<ReturnType<typeof importPKCS8>>;
  try {
    key = await importPKCS8(privateKey, "RS256");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`INVALID_ENV_GOOGLE_WALLET_PRIVATE_KEY_FORMAT: ${msg}`);
  }

  // Save to Google Wallet expects a JWT with a top-level `typ: "savetowallet"` claim
  // and a `payload` object containing the classes/objects.
  return await new SignJWT({
    typ: "savetowallet",
    origins: input.origins ?? [],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(saEmail)
    .setAudience("google")
    .setIssuedAt(now)
    // Keep short-lived.
    .setExpirationTime(now + 10 * 60)
    .sign(key);
}

export function getGoogleWalletSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
