"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type QrScannerProps = {
  onScan: (data: string) => void;
  onClose: () => void;
  locale: string;
};

type QrScanResult = { data: string };

type QrScannerInstance = {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
};

type QrScannerConstructor = new (
  video: HTMLVideoElement,
  onDecode: (result: QrScanResult) => void,
  options: {
    returnDetailedScanResult: true;
    highlightScanRegion: boolean;
    highlightCodeOutline: boolean;
  }
) => QrScannerInstance;

export function QrScanner({ onScan, onClose, locale }: QrScannerProps) {
  const ar = locale === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<QrScannerInstance | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    async function startScanner() {
      try {
        // Dynamically import the QR scanner library
        const { default: QrScanner } = await import("qr-scanner");
        const QrScannerClass = QrScanner as unknown as QrScannerConstructor;

        if (!videoRef.current || !mounted) return;

        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Initialize QR scanner
        const scanner = new QrScannerClass(
          videoRef.current,
          (result) => {
            if (mounted) {
              onScan(result.data);
              cleanup();
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current = scanner;
        await scanner.start();
        if (mounted) setScanning(true);
      } catch (err) {
        if (mounted) {
          console.error("QR Scanner error:", err);
          setError(
            ar
              ? "خطأ في الوصول إلى الكاميرا. تأكد من السماح بالوصول."
              : "Camera access error. Please allow camera permissions."
          );
        }
      }
    }

    function cleanup() {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    void startScanner();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [ar, onScan]);

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
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              className={cn(
                "h-full w-full object-cover",
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
