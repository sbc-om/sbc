import type { Edge, Node, XYPosition } from "@xyflow/react";

import type { NodeIconName } from "./icons";

export type NodeCategory =
  | "triggers"
  | "ai"
  | "flow"
  | "data"
  | "tools"
  | "actions"
  | "communication"
  | "integration"
  | "utility";

export type ConfigFieldType = "text" | "number" | "select" | "textarea" | "toggle";

export type ConfigField = {
  key: string;
  label: string;
  type: ConfigFieldType;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string | number | boolean;
};

export type NodeDefinition = {
  type: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: NodeIconName;
  configFields: ConfigField[];
};

export type WorkflowNodeData = {
  type: string;
  label: string;
  description: string;
  icon: NodeIconName;
  config: Record<string, string | number | boolean>;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdge = Edge;

export type AddNodePayload = {
  type: string;
  position: XYPosition;
};

export type ExecutionStep = {
  nodeId: string;
  label: string;
  status: "success" | "skipped" | "error";
  durationMs: number;
  output: string;
};

export type ExecutionResult = {
  steps: ExecutionStep[];
  finalOutput: string;
};
