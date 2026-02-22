import type { Edge, Node, XYPosition } from "@xyflow/react";

export type NodeCategory = "triggers" | "ai" | "tools" | "flow" | "actions" | "data";

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
  icon: "MessageCircle" | "Webhook" | "Clock3" | "Bot" | "Brain" | "MemoryStick" | "Globe" | "Code2" | "GitBranch" | "Split" | "Combine" | "Send" | "Mail" | "Database" | "Braces";
  configFields: ConfigField[];
};

export type WorkflowNodeData = {
  type: string;
  label: string;
  description: string;
  icon: NodeDefinition["icon"];
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
