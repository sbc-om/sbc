"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type QrScannerProps = {
  onScan: (data: string) => void;
  onClose: () => void;
  locale: string;
};

export function QrScanner({ onScan, onClose, locale }: QrScannerProps) {
  const ar = locale === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Keep onScan in a ref so the effect doesn't re-run when the parent
  // passes a new function reference.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Stable close handler
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let mounted = true;
    let scanner: InstanceType<typeof import("qr-scanner").default> | null = null;

    async function init() {
      try {
        const { default: QrScannerLib } = await import("qr-scanner");

        if (!videoRef.current || !mounted) return;

        // Let the library fully manage the camera & video stream.
        // Do NOT call getUserMedia manually — that conflicts with the
        // library's internal stream management and breaks scanning.
        scanner = new QrScannerLib(
          videoRef.current,
          (result) => {
            if (mounted && result.data) {
              onScanRef.current(result.data);
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
            maxScansPerSecond: 5,
          },
        );

        await scanner.start();

        if (mounted) {
          setScanning(true);
        }
      } catch (err) {
        if (mounted) {
          console.error("QR Scanner error:", err);
          setError(
            ar
              ? "خطأ في الوصول إلى الكاميرا. تأكد من السماح بالوصول."
              : "Camera access error. Please allow camera permissions.",
          );
        }
      }
    }

    void init();

    return () => {
      mounted = false;
      if (scanner) {
        scanner.stop();
        scanner.destroy();
        scanner = null;
      }
    };
  }, [ar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-(--surface-border) bg-(--surface) p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {ar ? "مسح رمز QR" : "Scan QR Code"}
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {ar ? "إغلاق" : "Close"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                scanning ? "opacity-100" : "opacity-0"
              )}
              playsInline
              muted
            />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
                {ar ? "جارٍ التحميل..." : "Loading camera..."}
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-sm text-(--muted-foreground)">
          {ar
            ? "وجّه الكاميرا نحو رمز QR الخاص بالعميل"
            : "Point the camera at the customer's QR code"}
        </p>
      </div>
    </div>
  );
}
