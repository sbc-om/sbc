import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";

import sharp from "sharp";
import { PKPass } from "passkit-generator";

import {
  defaultLoyaltySettings,
  getLoyaltyCardById,
  getLoyaltyCustomerById,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyMessagesForCustomer,
} from "@/lib/db/loyalty";

import {
  getAppleAuthSeed,
  getAppleOrganizationName,
  getApplePassSigningCerts,
  getApplePassTypeIdentifier,
  getAppleTeamIdentifier,
  getAppleWebServiceUrl,
} from "./appleConfig";

type ApplePassField = {
  key: string;
  label: string;
  value: string | number;
};

type ApplePassLocation = {
  latitude: number;
  longitude: number;
  relevantText?: string;
};

type ApplePassBarcode = {
  format: string;
  message: string;
  messageEncoding: string;
  altText?: string;
};

type ApplePassJson = {
  formatVersion: 1;
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  serialNumber: string;
  webServiceURL: string;
  authenticationToken: string;
  foregroundColor: string;
  labelColor: string;
  backgroundColor: string;
  logoText: string;
  storeCard: {
    primaryFields: ApplePassField[];
    secondaryFields: ApplePassField[];
    backFields: ApplePassField[];
  };
  barcodes: ApplePassBarcode[];
  locations?: ApplePassLocation[];
};

function resolvePublicFile(relFromPublic: string): string {
  // Next.js runs with process.cwd() at project root.
  return path.join(process.cwd(), "public", relFromPublic);
}

async function svgToPngBuffer(svgPath: string, size: number): Promise<Buffer> {
  const input = fs.readFileSync(svgPath);
  return await sharp(input).resize(size, size, { fit: "cover" }).png().toBuffer();
}

export function getAppleWalletAuthenticationTokenForSerial(serialNumber: string): string {
  // Deterministic token (no DB write needed). Apple expects a relatively short token.
  // We derive it from a server secret + serial.
  const seed = getAppleAuthSeed();
  return createHash("sha256").update(`${seed}:${serialNumber}`).digest("hex").slice(0, 32);
}

export function getAppleWalletLastUpdatedForSerial(serialNumber: string): Date {
  const card = getLoyaltyCardById(serialNumber);
  if (!card) return new Date(0);

  const customer = getLoyaltyCustomerById(card.customerId);
  const profile = getLoyaltyProfileByUserId(card.userId);
  const settings = getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);
  const latestMessage = listLoyaltyMessagesForCustomer({ userId: card.userId, customerId: card.customerId, limit: 1 })[0];

  const times = [
    card.updatedAt,
    customer?.updatedAt,
    profile?.updatedAt,
    settings.updatedAt,
    latestMessage?.createdAt,
  ]
    .filter(Boolean)
    .map((s) => new Date(String(s)).getTime())
    .filter((t) => Number.isFinite(t));

  return new Date(Math.max(...times, 0));
}

export async function buildAppleLoyaltyPkpassBuffer(input: {
  cardId: string;
  /** Optional absolute URL to the public card page (used in QR/barcode alt text). */
  publicCardUrl?: string;
}): Promise<Buffer> {
  const passTypeIdentifier = getApplePassTypeIdentifier();
  const teamIdentifier = getAppleTeamIdentifier();
  const organizationName = getAppleOrganizationName();
  const webServiceURL = getAppleWebServiceUrl();

  const card = getLoyaltyCardById(input.cardId);
  if (!card || card.status !== "active") throw new Error("CARD_NOT_FOUND");

  const customer = getLoyaltyCustomerById(card.customerId);
  const profile = getLoyaltyProfileByUserId(card.userId);
  // Settings are part of the pass update hash via `getAppleWalletLastUpdatedForSerial`.
  // We don't need them directly while generating the pass.
  if (!getLoyaltySettingsByUserId(card.userId)) {
    defaultLoyaltySettings(card.userId);
  }

  const latestMessage = listLoyaltyMessagesForCustomer({ userId: card.userId, customerId: card.customerId, limit: 1 })[0];

  const lastUpdated = getAppleWalletLastUpdatedForSerial(card.id);

  const businessName = profile?.businessName ?? "SBC";
  const description = `${businessName} Loyalty Card`;
  const authenticationToken = getAppleWalletAuthenticationTokenForSerial(card.id);

  const locations = profile?.location
    ? [
        {
          latitude: profile.location.lat,
          longitude: profile.location.lng,
          // NOTE: PassKit does not support a strict custom radius here.
          // iOS decides when a pass is relevant near a location.
          // We can only provide a helpful text.
          relevantText:
            profile.location.label ||
            `You're near ${businessName}. Open your loyalty card${
              profile.location.radiusMeters ? ` (nearby)` : ""
            }.`,
        },
      ]
    : undefined;

  // Build a minimal Store Card pass.
  const passJson: ApplePassJson = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName,
    description,
    serialNumber: card.id,
    webServiceURL,
    authenticationToken,
    foregroundColor: "rgb(255,255,255)",
    labelColor: "rgb(255,255,255)",
    backgroundColor: "rgb(124,58,237)",
    logoText: businessName,
    storeCard: {
      primaryFields: [
        {
          key: "points",
          label: "POINTS",
          value: card.points,
        },
      ],
      secondaryFields: [
        {
          key: "customer",
          label: "CUSTOMER",
          value: customer?.fullName ?? "Customer",
        },
      ],
      backFields: [
        {
          key: "join",
          label: "Business",
          value: businessName,
        },
        {
          key: "updated",
          label: "Last Updated",
          value: lastUpdated.toISOString(),
        },
      ],
    },
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: input.publicCardUrl ?? card.id,
        messageEncoding: "iso-8859-1",
        altText: card.id,
      },
    ],
  };

  if (latestMessage) {
    passJson.storeCard.backFields.push({
      key: "msg",
      label: "Latest message",
      value: `${latestMessage.title}\n${latestMessage.body}`,
    });
  }

  if (locations) {
    passJson.locations = locations;
  }

  // Minimal required images.
  // Use the app logo (SVG) and convert to PNG buffers.
  const svgLogoPath = resolvePublicFile(path.join("images", "sbc.svg"));

  const icon1x = await svgToPngBuffer(svgLogoPath, 29);
  const icon2x = await svgToPngBuffer(svgLogoPath, 58);
  const logo1x = await svgToPngBuffer(svgLogoPath, 160);
  const logo2x = await svgToPngBuffer(svgLogoPath, 320);

  const { wwdr, signerCert, signerKey, signerKeyPassphrase } = getApplePassSigningCerts();

  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passJson, null, 2)),
      "icon.png": icon1x,
      "icon@2x.png": icon2x,
      "logo.png": logo1x,
      "logo@2x.png": logo2x,
    },
    {
      wwdr,
      signerCert,
      signerKey,
      signerKeyPassphrase,
    }
  );

  return pass.getAsBuffer();
}
