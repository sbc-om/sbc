import Image from "next/image";

import { cn } from "@/lib/cn";

export function LoyaltyPointsIcons({
  points,
  iconUrl,
  size = 22,
  maxIcons = 60,
  className,
}: {
  points: number;
  iconUrl?: string | null;
  size?: number;
  maxIcons?: number;
  className?: string;
}) {
  const safePoints = Number.isFinite(points) ? Math.max(0, Math.trunc(points)) : 0;
  const shown = Math.min(safePoints, maxIcons);
  const overflow = Math.max(0, safePoints - shown);

  if (safePoints === 0) {
    return (
      <div className={cn("text-sm text-(--muted-foreground)", className)}>
        —
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-full border border-(--surface-border) bg-(--surface) shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          style={{ width: size, height: size }}
        >
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt="Point"
              fill
              sizes={`${size}px`}
              className="object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.28), rgba(14,165,233,0.24))",
              }}
            />
          )}

          {/* subtle shine */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)",
            }}
          />
        </div>
      ))}

      {overflow > 0 ? (
        <div
          className="flex items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-[11px] font-semibold text-(--muted-foreground) shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          style={{ width: size, height: size }}
          title={`+${overflow}`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
