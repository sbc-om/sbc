"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PWASplashScreenProps = {
  locale: string;
};

const APP_NAME = {
  en: "Smart Business Center",
  ar: "مركز الأعمال الذكي",
};

export function PWASplashScreen({ locale }: PWASplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [readyToHide, setReadyToHide] = useState(false);

  const appName = useMemo(() => (locale === "ar" ? APP_NAME.ar : APP_NAME.en), [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isStandalone) return;

    const alreadyShown = sessionStorage.getItem("sbc-pwa-splash-shown") === "1";
    if (alreadyShown) return;

    setVisible(true);

    const revealTimer = window.setTimeout(() => {
      setReadyToHide(true);
    }, 1700);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("sbc-pwa-splash-shown", "1");
    }, 2200);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`sbc-pwa-splash ${readyToHide ? "sbc-pwa-splash--hide" : ""}`} aria-hidden>
      <div className="sbc-pwa-splash__glow sbc-pwa-splash__glow--a" />
      <div className="sbc-pwa-splash__glow sbc-pwa-splash__glow--b" />
      <div className="sbc-pwa-splash__grain" />

      <div className="sbc-pwa-splash__center">
        <div className="sbc-pwa-splash__icon-wrap">
          <span className="sbc-pwa-splash__ring sbc-pwa-splash__ring--outer" />
          <span className="sbc-pwa-splash__ring sbc-pwa-splash__ring--inner" />
          <Image
            src="/android-chrome-192x192.png"
            alt="SBC"
            width={96}
            height={96}
            priority
            className="sbc-pwa-splash__icon"
          />
        </div>
        <p className="sbc-pwa-splash__name">{appName}</p>
      </div>
    </div>
  );
}
