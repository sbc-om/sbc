"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { CryptoSymbolDetails } from "@/lib/crypto/binance";
import { CoinLogo } from "@/components/crypto/CoinLogo";

type LiveState = {
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  bidPrice: number;
  askPrice: number;
  openPrice: number;
};

function getPriceDigits(value: number): number {
  if (value >= 1000) return 2;
  if (value >= 1) return 4;
  if (value >= 0.01) return 6;
  return 8;
}

export function CryptoSymbolLivePanel({
  locale,
  initial,
}: {
  locale: Locale;
  initial: CryptoSymbolDetails;
}) {
  const [live, setLive] = useState<LiveState>({
    lastPrice: initial.lastPrice,
    priceChange: initial.priceChange,
    priceChangePercent: initial.priceChangePercent,
    weightedAvgPrice: initial.weightedAvgPrice,
    highPrice: initial.highPrice,
    lowPrice: initial.lowPrice,
    volume: initial.volume,
    quoteVolume: initial.quoteVolume,
    bidPrice: initial.bidPrice,
    askPrice: initial.askPrice,
    openPrice: initial.openPrice,
  });

  useEffect(() => {
    const symbol = initial.symbol.toLowerCase();
    const socket = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${symbol}@ticker/${symbol}@bookTicker`,
    );

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as {
        data?: {
          e?: string;
          c?: string;
          p?: string;
          P?: string;
          w?: string;
          h?: string;
          l?: string;
          v?: string;
          q?: string;
          o?: string;
          b?: string;
          a?: string;
        };
      };
      const message = parsed.data;
      if (!message?.e) return;

      setLive((prev) => {
        if (message.e === "24hrTicker") {
          return {
            ...prev,
            lastPrice: Number(message.c ?? prev.lastPrice),
            priceChange: Number(message.p ?? prev.priceChange),
            priceChangePercent: Number(message.P ?? prev.priceChangePercent),
            weightedAvgPrice: Number(message.w ?? prev.weightedAvgPrice),
            highPrice: Number(message.h ?? prev.highPrice),
            lowPrice: Number(message.l ?? prev.lowPrice),
            volume: Number(message.v ?? prev.volume),
            quoteVolume: Number(message.q ?? prev.quoteVolume),
            openPrice: Number(message.o ?? prev.openPrice),
          };
        }

        if (message.e === "bookTicker") {
          return {
            ...prev,
            bidPrice: Number(message.b ?? prev.bidPrice),
            askPrice: Number(message.a ?? prev.askPrice),
          };
        }

        return prev;
      });
    };

    return () => {
      socket.close();
    };
  }, [initial.symbol]);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }),
    [],
  );

  const lastPriceDigits = getPriceDigits(live.lastPrice);
  const positive = live.priceChangePercent >= 0;
  const spread = live.askPrice - live.bidPrice;

  return (
    <section className="sbc-card rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CoinLogo asset={initial.baseAsset} size={40} />
          <h2 className="text-2xl font-semibold tracking-tight">
            {initial.baseAsset}/{initial.quoteAsset}
          </h2>
          <p className="text-xs text-(--muted-foreground)">{initial.symbol}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            positive
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
              : "bg-red-500/15 text-red-600 dark:text-red-300"
          }`}
        >
          {positive ? "+" : ""}
          {numberFormatter.format(live.priceChangePercent)}%
        </span>
      </div>

      <div className="mt-4 text-3xl font-bold">
        {new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: lastPriceDigits,
        }).format(live.lastPrice)}
        <span className="ms-2 text-sm font-medium text-(--muted-foreground)">{initial.quoteAsset}</span>
      </div>

      <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Metric label={locale === "ar" ? "تغير السعر" : "Price Change"} value={numberFormatter.format(live.priceChange)} />
        <Metric label={locale === "ar" ? "متوسط مرجح" : "Weighted Avg"} value={numberFormatter.format(live.weightedAvgPrice)} />
        <Metric label={locale === "ar" ? "سعر الافتتاح" : "Open Price"} value={numberFormatter.format(live.openPrice)} />
        <Metric label={locale === "ar" ? "أفضل طلب شراء" : "Best Bid"} value={numberFormatter.format(live.bidPrice)} />
        <Metric label={locale === "ar" ? "أفضل طلب بيع" : "Best Ask"} value={numberFormatter.format(live.askPrice)} />
        <Metric label={locale === "ar" ? "السبريد" : "Spread"} value={numberFormatter.format(spread)} />
        <Metric label={locale === "ar" ? "24س أعلى" : "24h High"} value={numberFormatter.format(live.highPrice)} />
        <Metric label={locale === "ar" ? "24س أقل" : "24h Low"} value={numberFormatter.format(live.lowPrice)} />
        <Metric label={locale === "ar" ? "حجم" : "Volume"} value={numberFormatter.format(live.volume)} />
        <Metric label={locale === "ar" ? "حجم تداول USDT" : "Quote Volume"} value={numberFormatter.format(live.quoteVolume)} />
        <Metric label={locale === "ar" ? "أعلى 7 أيام" : "7D High"} value={numberFormatter.format(initial.weeklyHigh)} />
        <Metric label={locale === "ar" ? "أقل 7 أيام" : "7D Low"} value={numberFormatter.format(initial.weeklyLow)} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2">
      <p className="text-xs text-(--muted-foreground)">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
