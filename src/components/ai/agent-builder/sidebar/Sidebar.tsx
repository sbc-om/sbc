"use client";

import { useMemo, useState } from "react";

import { nodeDefinitions } from "@/lib/ai/agentflow/node-definitions";
import { getNodeIcon } from "@/lib/ai/agentflow/icons";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";
import { Input } from "@/components/ui/Input";

const categoryLabel = {
  triggers: "Triggers",
  ai: "AI / LangChain",
  flow: "Flow Control",
  data: "Data Transformation",
  tools: "Developer Tools",
  actions: "Actions / Output",
  communication: "Communication",
  integration: "Integrations",
  utility: "Utility",
} as const;

export function Sidebar() {
  const [query, setQuery] = useState("");
  const addNode = useWorkflowStore((state) => state.addNode);

  const grouped = useMemo(() => {
    const byCategory = {
      triggers: [] as typeof nodeDefinitions,
      ai: [] as typeof nodeDefinitions,
      flow: [] as typeof nodeDefinitions,
      data: [] as typeof nodeDefinitions,
      tools: [] as typeof nodeDefinitions,
      actions: [] as typeof nodeDefinitions,
      communication: [] as typeof nodeDefinitions,
      integration: [] as typeof nodeDefinitions,
      utility: [] as typeof nodeDefinitions,
    };

    const q = query.trim().toLowerCase();
    for (const node of nodeDefinitions) {
      if (q && !(`${node.label} ${node.description}`.toLowerCase().includes(q))) continue;
      byCategory[node.category].push(node);
    }
    return byCategory;
  }, [query]);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface) p-3 lg:w-80">
      <h3 className="text-sm font-semibold">Node Palette</h3>
      <p className="mt-1 text-xs text-(--muted-foreground)">Drag to canvas or click to add.</p>

      <div className="mt-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search nodes..."
          className="h-10 text-sm"
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pe-1">
        {(Object.keys(categoryLabel) as Array<keyof typeof categoryLabel>).map((category) => {
          const list = grouped[category];
          if (list.length === 0) return null;

          return (
            <section key={category}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                {categoryLabel[category]}
              </h4>
              <div className="space-y-2">
                {list.map((node) => {
                  const Icon = getNodeIcon(node.icon);
                  return (
                    <button
                      key={node.type}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("application/agentflow", node.type);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => addNode(node.type, { x: 300, y: 180 })}
                      className="flex w-full items-start gap-2 rounded-xl border border-(--surface-border) bg-transparent px-2.5 py-2 text-start transition hover:bg-(--chip-bg)"
                    >
                      <span className="mt-0.5 rounded-md bg-(--chip-bg) p-1.5">
                        <Icon className="h-4 w-4 text-(--accent)" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{node.label}</span>
                        <span className="block truncate text-xs text-(--muted-foreground)">{node.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
