"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { TopCryptoPair } from "@/lib/crypto/binance";
import { CoinLogo } from "@/components/crypto/CoinLogo";

type LiveTicker = {
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
};

function getPriceDigits(value: number): number {
  if (value >= 1000) return 2;
  if (value >= 1) return 4;
  if (value >= 0.01) return 6;
  return 8;
}

export function CryptoListClient({
  locale,
  initialPairs,
}: {
  locale: Locale;
  initialPairs: TopCryptoPair[];
}) {
  const [liveMap, setLiveMap] = useState<Record<string, LiveTicker>>(() => {
    const base: Record<string, LiveTicker> = {};
    for (const pair of initialPairs) {
      base[pair.symbol] = {
        lastPrice: pair.lastPrice,
        priceChangePercent: pair.priceChangePercent,
        quoteVolume: pair.quoteVolume,
        highPrice: pair.highPrice,
        lowPrice: pair.lowPrice,
      };
    }
    return base;
  });

  const streams = useMemo(
    () => initialPairs.map((pair) => `${pair.symbol.toLowerCase()}@ticker`).join("/"),
    [initialPairs],
  );

  useEffect(() => {
    if (!streams) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    const connect = () => {
      socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

      socket.onmessage = (event) => {
        const parsed = JSON.parse(event.data) as {
          data?: {
            s?: string;
            c?: string;
            P?: string;
            q?: string;
            h?: string;
            l?: string;
          };
        };
        const ticker = parsed.data;
        const symbol = ticker?.s;
        if (!symbol) return;

        setLiveMap((prev) => {
          const current = prev[symbol];
          if (!current) return prev;

          return {
            ...prev,
            [symbol]: {
              lastPrice: Number(ticker.c ?? current.lastPrice),
              priceChangePercent: Number(ticker.P ?? current.priceChangePercent),
              quoteVolume: Number(ticker.q ?? current.quoteVolume),
              highPrice: Number(ticker.h ?? current.highPrice),
              lowPrice: Number(ticker.l ?? current.lowPrice),
            },
          };
        });
      };

      socket.onclose = () => {
        if (unmounted) return;
        reconnectTimer = setTimeout(connect, 1500);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [streams]);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }),
    [],
  );

  const usdtFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  return (
    <div className="sbc-card divide-y divide-(--surface-border) overflow-hidden rounded-2xl">
      {initialPairs.map((pair) => {
        const live = liveMap[pair.symbol];
        const change = live?.priceChangePercent ?? pair.priceChangePercent;
        const lastPrice = live?.lastPrice ?? pair.lastPrice;
        const quoteVolume = live?.quoteVolume ?? pair.quoteVolume;
        const highPrice = live?.highPrice ?? pair.highPrice;
        const lowPrice = live?.lowPrice ?? pair.lowPrice;
        const positive = change >= 0;

        return (
          <Link
            key={pair.symbol}
            href={`/${locale}/crypto/${pair.symbol}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-(--chip-bg)/60"
          >
            <CoinLogo asset={pair.baseAsset} size={36} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold tracking-tight">{pair.baseAsset}</h2>
                  <p className="truncate text-xs text-(--muted-foreground)">{pair.symbol}</p>
                </div>

                <div className="text-end">
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: getPriceDigits(lastPrice),
                    }).format(lastPrice)}
                    <span className="ms-1 text-xs font-medium text-(--muted-foreground)">USDT</span>
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      positive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                        : "bg-red-500/15 text-red-600 dark:text-red-300"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {numberFormatter.format(change)}%
                  </span>
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                <span>{locale === "ar" ? "24س أعلى" : "24h High"}: {usdtFormatter.format(highPrice)}</span>
                <span>{locale === "ar" ? "24س أقل" : "24h Low"}: {usdtFormatter.format(lowPrice)}</span>
                <span>{locale === "ar" ? "حجم USDT" : "USDT Vol"}: {numberFormatter.format(quoteVolume)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
