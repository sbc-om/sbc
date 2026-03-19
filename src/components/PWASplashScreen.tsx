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
          <svg
            className="sbc-pwa-splash__icon"
            width="96"
            height="96"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="SBC"
            role="img"
          >
            <mask id="sbcMask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
              <path d="M333.495 0H178.505C127.104 0 101.406 0 73.7408 8.74662C43.5328 19.7419 19.7419 43.5328 8.74668 73.7408C0 101.406 0 127.108 0 178.505V333.495C0 384.896 0 410.59 8.74668 438.259C19.7419 468.467 43.5328 492.258 73.7408 503.249C101.406 512 127.104 512 178.505 512H333.495C384.896 512 410.59 512 438.259 503.249C468.467 492.258 492.258 468.467 503.253 438.259C512 410.59 512 384.896 512 333.495V178.505C512 127.108 512 101.406 503.253 73.7408C492.258 43.5328 468.467 19.7419 438.259 8.74662C410.59 0 384.896 0 333.495 0Z" fill="#C4C4C4" />
            </mask>
            <g mask="url(#sbcMask)">
              <rect width="512" height="512" fill="url(#sbcPaint)" />
              <path d="M522.909 382.785C519.132 395.278 515.297 409.422 510.332 421.327L385.097 351.873C380.434 358.152 375.341 364.083 369.858 369.62C340.629 399.141 300.218 417.412 255.599 417.412C210.979 417.412 170.59 399.141 141.34 369.62C112.09 340.077 94 299.283 94 254.216C94 209.128 112.09 168.335 141.34 138.792C170.59 109.271 210.979 91 255.599 91C300.218 91 340.629 109.271 369.858 138.792C399.107 168.335 417.197 209.128 417.197 254.216C417.197 277.087 412.535 298.892 404.116 318.645L522.909 382.785ZM342.939 165.98C320.596 143.414 289.706 129.46 255.599 129.46C221.491 129.46 190.601 143.414 168.259 165.98C145.917 188.568 132.079 219.746 132.079 254.216C132.079 288.665 145.917 319.843 168.259 342.431C190.601 364.997 221.491 378.951 255.599 378.951C289.706 378.951 320.596 364.997 342.939 342.431C365.302 319.843 379.118 288.665 379.118 254.216C379.118 219.746 365.302 188.568 342.939 165.98Z" fill="white" />
            </g>
            <defs>
              <linearGradient id="sbcPaint" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="1" stopColor="#0877FB" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="sbc-pwa-splash__name">{appName}</p>
      </div>
    </div>
  );
}
