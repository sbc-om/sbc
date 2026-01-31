"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/Button";

interface AppleWalletButtonProps {
  cardId: string;
  label: string;
  locale?: string;
}

export function AppleWalletButton({ cardId, label, locale = "en" }: AppleWalletButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const ar = locale === "ar";

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsDownloading(true);

    try {
      const url = `/api/business-cards/wallet/apple/${encodeURIComponent(cardId)}`;
      
      // Fetch the pkpass file
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Failed to download pass:", error);
        throw new Error(error.error || "Failed to download pass");
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `business-card-${cardId}.pkpass`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
    } catch (error) {
      console.error("Error downloading pass:", error);
      const message = ar 
        ? "فشل تحميل البطاقة. يرجى المحاولة مرة أخرى."
        : "Failed to download pass. Please try again.";
      alert(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <a
      href={`/api/business-cards/wallet/apple/${encodeURIComponent(cardId)}`}
      onClick={handleClick}
      className={buttonVariants({ variant: "primary", size: "sm" })}
      aria-label={label}
    >
      {isDownloading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {ar ? "جاري التحميل..." : "Downloading..."}
        </>
      ) : (
        <>
          <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          {label}
        </>
      )}
    </a>
  );
}
