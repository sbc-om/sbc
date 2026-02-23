"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";

import { NodeIcon } from "@/lib/ai/agentflow/icons";
import type { WorkflowNode as WorkflowNodeType } from "@/lib/ai/agentflow/types";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";

export function WorkflowNode({ id, data, selected }: NodeProps<WorkflowNodeType>) {
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const isCondition = data.type === "ifCondition";

  return (
    <div
      className={`group min-w-[220px] rounded-xl border bg-(--surface) p-3 shadow-sm transition ${
        selected ? "border-(--accent)" : "border-(--surface-border)"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-none !bg-(--accent)" />

      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-md bg-(--chip-bg) p-1.5">
          <NodeIcon name={data.icon} className="h-4 w-4 text-(--accent)" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold">{data.label}</h4>
          <p className="truncate text-xs text-(--muted-foreground)">{data.description}</p>
        </div>
        <button
          type="button"
          aria-label="Delete node"
          onClick={() => deleteNode(id)}
          className="rounded-md p-1 text-(--muted-foreground) opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "36%" }}
            className="!h-3 !w-3 !border-none !bg-emerald-500"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "68%" }}
            className="!h-3 !w-3 !border-none !bg-red-500"
          />
          <div className="mt-2 flex items-center justify-end gap-3 text-[10px] font-semibold text-(--muted-foreground)">
            <span className="text-emerald-500">TRUE</span>
            <span className="text-red-500">FALSE</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-none !bg-(--accent)" />
      )}
    </div>
  );
}
