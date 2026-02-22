"use client";

import { getNodeDefinition } from "@/lib/ai/agentflow/node-definitions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";

export function ConfigPanel() {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const node = useWorkflowStore((state) => state.nodes.find((item) => item.id === selectedNodeId) ?? null);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);

  if (!node) {
    return (
      <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
        <h3 className="text-sm font-semibold">Node Configuration</h3>
        <p className="mt-2 text-xs text-(--muted-foreground)">Select a node on canvas to edit settings.</p>
      </aside>
    );
  }

  const definition = getNodeDefinition(node.data.type);
  if (!definition) return null;

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
      <h3 className="text-sm font-semibold">{node.data.label}</h3>
      <p className="mt-1 text-xs text-(--muted-foreground)">{node.data.description}</p>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pe-1">
        {definition.configFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-(--surface-border) p-3 text-xs text-(--muted-foreground)">
            This node has no configurable fields.
          </p>
        ) : null}

        {definition.configFields.map((field) => {
          const value = node.data.config[field.key];

          return (
            <label key={field.key} className="block space-y-1">
              <span className="text-xs font-medium text-(--muted-foreground)">{field.label}</span>

              {field.type === "textarea" ? (
                <Textarea
                  value={String(value ?? "")}
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      [field.key]: event.target.value,
                    })
                  }
                  className="min-h-24"
                />
              ) : null}

              {field.type === "text" ? (
                <Input
                  value={String(value ?? "")}
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      [field.key]: event.target.value,
                    })
                  }
                  className="h-10 text-sm"
                />
              ) : null}

              {field.type === "number" ? (
                <Input
                  type="number"
                  value={String(value ?? 0)}
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      [field.key]: Number(event.target.value),
                    })
                  }
                  className="h-10 text-sm"
                />
              ) : null}

              {field.type === "select" ? (
                <select
                  value={String(value ?? "")}
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      [field.key]: event.target.value,
                    })
                  }
                  className="h-10 w-full rounded-xl border border-(--surface-border) bg-(--background) px-3 text-sm outline-none"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {field.type === "toggle" ? (
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      [field.key]: event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border border-(--surface-border)"
                />
              ) : null}
            </label>
          );
        })}
      </div>
    </aside>
  );
}
