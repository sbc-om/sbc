import Image from "next/image";

type PWASplashScreenProps = {
  locale: string;
};

const APP_NAME = {
  en: "Smart Business Center",
  ar: "مركز الأعمال الذكي",
};

export function PWASplashScreen({ locale }: PWASplashScreenProps) {
  const appName = locale === "ar" ? APP_NAME.ar : APP_NAME.en;

  return (
    <div className="sbc-pwa-splash" aria-hidden>
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
