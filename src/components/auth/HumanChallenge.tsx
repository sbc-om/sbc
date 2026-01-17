"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { HumanChallenge } from "@/lib/auth/humanChallenge";

type HumanChallengeProps = {
  locale: string;
  challenge: HumanChallenge;
};

export function HumanChallenge({ locale, challenge }: HumanChallengeProps) {
  const isAr = locale === "ar";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedMap = useMemo(
    () => new Map(selectedIds.map((id, index) => [id, index + 1])),
    [selectedIds],
  );

  const handleSelect = (id: string) => {
    if (selectedMap.has(id)) return;
    if (selectedIds.length >= challenge.requiredCount) return;
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleReset = () => setSelectedIds([]);

  return (
    <div className="grid gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 shadow-(--shadow)">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {isAr ? "تحقق سريع أنك إنسان" : "Quick human check"}
          </p>
          <p className="mt-1 text-sm text-(--muted-foreground)">{challenge.prompt}</p>
        </div>
        <span className="rounded-full bg-(--chip-bg) px-2.5 py-1 text-xs text-(--muted-foreground)">
          {selectedIds.length}/{challenge.requiredCount}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {challenge.options.map((option) => {
          const selectedIndex = selectedMap.get(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-3 text-sm font-medium transition",
                "hover:brightness-[1.02] active:brightness-[0.98]",
                selectedIndex ? "border-accent" : "",
              )}
              aria-pressed={Boolean(selectedIndex)}
            >
              <span className="text-xl" aria-hidden>
                {option.emoji}
              </span>
              <span>{option.label}</span>
              {selectedIndex ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-(--accent-foreground)">
                  {selectedIndex}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-(--muted-foreground)">
          {isAr ? "يمكنك إعادة الضبط في أي وقت." : "You can reset anytime."}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          {isAr ? "إعادة الضبط" : "Reset"}
        </Button>
      </div>

      <input type="hidden" name="humanToken" value={challenge.token} />
      <input type="hidden" name="humanAnswer" value={selectedIds.join(",")} />
    </div>
  );
}