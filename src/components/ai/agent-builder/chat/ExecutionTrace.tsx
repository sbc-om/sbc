"use client";

import type { ExecutionStep } from "@/lib/ai/agentflow/types";

export function ExecutionTrace({ steps }: { steps: ExecutionStep[] }) {
  if (steps.length === 0) {
    return <p className="text-xs text-(--muted-foreground)">No execution trace yet.</p>;
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={`${step.nodeId}-${step.durationMs}`} className="rounded-lg border border-(--surface-border) bg-(--surface) p-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold">{step.label}</span>
            <span className="text-(--muted-foreground)">{step.durationMs}ms</span>
          </div>
          <p className="mt-1 text-xs text-(--muted-foreground)">{step.output}</p>
        </div>
      ))}
    </div>
  );
}
