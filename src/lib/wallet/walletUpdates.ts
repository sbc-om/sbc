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
