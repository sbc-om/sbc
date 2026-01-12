import { importPKCS8, SignJWT } from "jose";

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

export function isGoogleWalletEnabled(): boolean {
  return String(process.env.GOOGLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export function isGoogleWalletConfigured(): boolean {
  if (!isGoogleWalletEnabled()) return false;
  return Boolean(env("GOOGLE_WALLET_ISSUER_ID") && env("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL") && env("GOOGLE_WALLET_PRIVATE_KEY"));
}

function normalizePrivateKey(key: string): string {
  // Common .env pattern: \n escapes.
  if (key.includes("\\n")) return key.replace(/\\n/g, "\n");
  return key;
}

export async function createGoogleWalletSaveJwt(input: { cardId: string }): Promise<string> {
  const issuerId = env("GOOGLE_WALLET_ISSUER_ID");
  const saEmail = env("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  const privateKey = env("GOOGLE_WALLET_PRIVATE_KEY");

  if (!issuerId) throw new Error("MISSING_ENV_GOOGLE_WALLET_ISSUER_ID");
  if (!saEmail) throw new Error("MISSING_ENV_GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) throw new Error("MISSING_ENV_GOOGLE_WALLET_PRIVATE_KEY");

  const card = getLoyaltyCardById(input.cardId);
  if (!card || card.status !== "active") throw new Error("CARD_NOT_FOUND");

  const customer = getLoyaltyCustomerById(card.customerId);
  const profile = getLoyaltyProfileByUserId(card.userId);
  const settings = getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);
  const latestMessage = listLoyaltyMessagesForCustomer({ userId: card.userId, customerId: card.customerId, limit: 1 })[0];

  const businessName = profile?.businessName ?? "SBC";

  // IDs must be issuerId.suffix (no spaces). We keep suffix stable.
  const classId = `${issuerId}.sbc_loyalty`;
  const objectId = `${issuerId}.${card.id}`;

  const loyaltyClass: Record<string, unknown> = {
    id: classId,
    issuerName: businessName,
    programName: businessName,
    programLogo: profile?.logoUrl
      ? { sourceUri: { uri: profile.logoUrl } }
      : undefined,
    // Location-based suggestions (Google Wallet decides when to surface the card).
    locations: profile?.location
      ? [
          {
            latitude: profile.location.lat,
            longitude: profile.location.lng,
          },
        ]
      : undefined,
  };

  const textModulesData: Array<Record<string, unknown>> = [
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

  const loyaltyObject: Record<string, unknown> = {
    id: objectId,
    classId,
    state: "active",
    accountId: customer?.id ?? card.customerId,
    accountName: customer?.fullName ?? "Customer",
    barcode: {
      type: "QR_CODE",
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

  // Clean undefined fields.
  if (!loyaltyClass.programLogo) delete loyaltyClass.programLogo;
  if (!loyaltyClass.locations) delete loyaltyClass.locations;

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(normalizePrivateKey(privateKey), "RS256");

  // Save to Google Wallet expects a JWT with a top-level `typ: "savetowallet"` claim
  // and a `payload` object containing the classes/objects.
  return await new SignJWT({
    typ: "savetowallet",
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
