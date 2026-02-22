"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function buildCoinLogoUrl(asset: string): string {
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${asset.toLowerCase()}.png`;
}

export function CoinLogo({
  asset,
  size = 36,
}: {
  asset: string;
  size?: 36 | 40;
}) {
  const [failed, setFailed] = useState(false);
  const logoUrl = useMemo(() => buildCoinLogoUrl(asset), [asset]);
  const textSize = size === 40 ? "text-xs" : "text-[11px]";

  if (failed) {
    return (
      <div
        aria-label={asset}
        className={`flex shrink-0 items-center justify-center rounded-full border border-(--surface-border) bg-(--accent)/15 font-bold text-(--accent) ${textSize}`}
        style={{ width: size, height: size }}
      >
        {asset.slice(0, 3)}
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={asset}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-(--surface-border) bg-(--surface)"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
