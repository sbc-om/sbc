"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

import { getNodeDefinition } from "@/lib/ai/agentflow/node-definitions";
import type { WorkflowEdge, WorkflowNode } from "@/lib/ai/agentflow/types";

type WorkflowState = {
  workflowName: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  setWorkflowName: (name: string) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: XYPosition) => void;
  deleteNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeConfig: (id: string, patch: Record<string, string | number | boolean>) => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => { ok: boolean; error?: string };
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowName: "New Agent",
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setWorkflowName: (name) => set({ workflowName: name }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge({ ...connection, type: "smoothstep", animated: true }, state.edges),
    })),

  addNode: (type, position) => {
    const definition = getNodeDefinition(type);
    if (!definition) return;

    const config: Record<string, string | number | boolean> = {};
    for (const field of definition.configFields) {
      if (typeof field.defaultValue !== "undefined") {
        config[field.key] = field.defaultValue;
      }
    }

    const node: WorkflowNode = {
      id: uuidv4(),
      type: "workflowNode",
      position,
      data: {
        type: definition.type,
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        config,
      },
    };

    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNodeConfig: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  ...patch,
                },
              },
            }
          : node,
      ),
    })),

  exportWorkflow: () => {
    const state = get();
    return JSON.stringify(
      {
        workflowName: state.workflowName,
        nodes: state.nodes,
        edges: state.edges,
      },
      null,
      2,
    );
  },

  importWorkflow: (json) => {
    try {
      const parsed = JSON.parse(json) as {
        workflowName?: string;
        nodes?: WorkflowNode[];
        edges?: WorkflowEdge[];
      };

      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return { ok: false, error: "Invalid workflow JSON" };
      }

      set({
        workflowName: parsed.workflowName || "Imported Agent",
        nodes: parsed.nodes,
        edges: parsed.edges,
        selectedNodeId: null,
      });

      return { ok: true };
    } catch {
      return { ok: false, error: "Failed to parse JSON" };
    }
  },
}));
