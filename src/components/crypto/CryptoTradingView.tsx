"use client";

import { useEffect, useMemo, useState } from "react";

type TradingViewTheme = "light" | "dark";

function readThemeFromDocument(): TradingViewTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function CryptoTradingView({ symbol }: { symbol: string }) {
  const [theme, setTheme] = useState<TradingViewTheme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(readThemeFromDocument());

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const src = useMemo(() => {
    const toolbarBg = theme === "dark" ? "131722" : "f1f3f6";
    return `https://s.tradingview.com/widgetembed/?symbol=BINANCE:${encodeURIComponent(symbol)}&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=${toolbarBg}&studies=%5B%5D&theme=${theme}&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&allow_symbol_change=0`;
  }, [symbol, theme]);

  return (
    <section className="sbc-card overflow-hidden rounded-2xl p-0 !border-0">
      <div className="h-[560px] w-full overflow-hidden">
        <iframe
          title={`TradingView ${symbol}`}
          src={src}
          className="-m-px block h-[calc(100%+2px)] w-[calc(100%+2px)] border-0"
          scrolling="no"
        />
      </div>
    </section>
  );
}
