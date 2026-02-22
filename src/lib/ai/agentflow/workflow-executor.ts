import type { ExecutionResult, WorkflowEdge, WorkflowNode } from "./types";

function evaluateCondition(input: string, operator: string, value: string): boolean {
  const text = input ?? "";
  const rule = value ?? "";

  switch (operator) {
    case "equals":
      return text === rule;
    case "not_equals":
      return text !== rule;
    case "contains":
      return text.toLowerCase().includes(rule.toLowerCase());
    case "starts_with":
      return text.toLowerCase().startsWith(rule.toLowerCase());
    case "ends_with":
      return text.toLowerCase().endsWith(rule.toLowerCase());
    case "is_empty":
      return text.trim().length === 0;
    default:
      return false;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  input: string,
): Promise<ExecutionResult> {
  const incomingCount = new Map<string, number>();
  for (const node of nodes) incomingCount.set(node.id, 0);
  for (const edge of edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  const starters = nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);
  const queue = [...starters.map((node) => node.id)];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const steps: ExecutionResult["steps"] = [];
  const visited = new Set<string>();
  let finalOutput = "";

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    const node = nodeById.get(currentId);
    if (!node) continue;

    visited.add(currentId);
    const startedAt = Date.now();
    await delay(120);

    let output = `${node.data.label} executed`;
    const status: "success" | "skipped" | "error" = "success";
    let allowedHandle: string | null = null;

    if (node.data.type === "ifCondition") {
      const field = String(node.data.config.field ?? "message");
      const operator = String(node.data.config.operator ?? "contains");
      const value = String(node.data.config.value ?? "");
      const leftSide = field === "message" ? input : "";
      const passed = evaluateCondition(leftSide, operator, value);
      allowedHandle = passed ? "true" : "false";
      output = `Condition ${passed ? "passed" : "failed"} (${operator})`;
    }

    if (node.data.type === "sendMessage") {
      output = String(node.data.config.message ?? "Message sent");
      finalOutput = output;
    }

    const durationMs = Date.now() - startedAt;
    steps.push({
      nodeId: node.id,
      label: node.data.label,
      status,
      durationMs,
      output,
    });

    const outgoing = edges.filter((edge) => edge.source === node.id);
    for (const edge of outgoing) {
      if (allowedHandle && edge.sourceHandle && edge.sourceHandle !== allowedHandle) {
        continue;
      }
      queue.push(edge.target);
    }
  }

  if (!finalOutput) {
    finalOutput = "Workflow completed.";
  }

  return { steps, finalOutput };
}
