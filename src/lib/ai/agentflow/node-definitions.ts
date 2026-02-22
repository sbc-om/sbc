import type { NodeDefinition } from "./types";

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: "chatTrigger",
    label: "Chat Trigger",
    description: "Starts workflow from user chat",
    category: "triggers",
    icon: "MessageCircle",
    configFields: [],
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "Starts workflow from HTTP webhook",
    category: "triggers",
    icon: "Webhook",
    configFields: [
      { key: "path", label: "Webhook Path", type: "text", defaultValue: "/agent/webhook" },
    ],
  },
  {
    type: "schedule",
    label: "Schedule",
    description: "Runs workflow based on interval",
    category: "triggers",
    icon: "Clock3",
    configFields: [
      {
        key: "cron",
        label: "Cron",
        type: "text",
        defaultValue: "*/30 * * * *",
      },
    ],
  },
  {
    type: "aiAgent",
    label: "AI Agent",
    description: "Prompt + role instruction",
    category: "ai",
    icon: "Bot",
    configFields: [
      { key: "role", label: "Role", type: "text", defaultValue: "Business assistant" },
      { key: "prompt", label: "System Prompt", type: "textarea", defaultValue: "Answer clearly and briefly." },
    ],
  },
  {
    type: "model",
    label: "Model",
    description: "Select AI model",
    category: "ai",
    icon: "Brain",
    configFields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        options: [
          { label: "OpenAI", value: "openai" },
          { label: "Anthropic", value: "anthropic" },
          { label: "Local", value: "local" },
        ],
        defaultValue: "openai",
      },
      { key: "model", label: "Model Name", type: "text", defaultValue: "gpt-4.1-mini" },
    ],
  },
  {
    type: "memory",
    label: "Window Memory",
    description: "Conversation memory window",
    category: "ai",
    icon: "MemoryStick",
    configFields: [
      { key: "window", label: "Window Size", type: "number", defaultValue: 8 },
    ],
  },
  {
    type: "httpRequest",
    label: "HTTP Request",
    description: "Call external API",
    category: "tools",
    icon: "Globe",
    configFields: [
      { key: "url", label: "URL", type: "text", defaultValue: "https://api.example.com" },
      {
        key: "method",
        label: "Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
        ],
        defaultValue: "GET",
      },
    ],
  },
  {
    type: "codeExecutor",
    label: "Code Executor",
    description: "Run script expression",
    category: "tools",
    icon: "Code2",
    configFields: [
      { key: "code", label: "Code", type: "textarea", defaultValue: "return input;" },
    ],
  },
  {
    type: "ifCondition",
    label: "If Condition",
    description: "Branch by rule",
    category: "flow",
    icon: "GitBranch",
    configFields: [
      { key: "field", label: "Field", type: "text", defaultValue: "message" },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "equals", value: "equals" },
          { label: "not equals", value: "not_equals" },
          { label: "contains", value: "contains" },
          { label: "starts with", value: "starts_with" },
          { label: "ends with", value: "ends_with" },
          { label: "is empty", value: "is_empty" },
        ],
        defaultValue: "contains",
      },
      { key: "value", label: "Value", type: "text", defaultValue: "help" },
    ],
  },
  {
    type: "switch",
    label: "Switch",
    description: "Split execution into named branches",
    category: "flow",
    icon: "Split",
    configFields: [
      { key: "key", label: "Switch Key", type: "text", defaultValue: "intent" },
    ],
  },
  {
    type: "merge",
    label: "Merge",
    description: "Merge multiple branches",
    category: "flow",
    icon: "Combine",
    configFields: [],
  },
  {
    type: "sendMessage",
    label: "Send Message",
    description: "Return message to user",
    category: "actions",
    icon: "Send",
    configFields: [
      { key: "message", label: "Message", type: "textarea", defaultValue: "Thanks for contacting us." },
    ],
  },
  {
    type: "sendEmail",
    label: "Send Email",
    description: "Send follow-up email",
    category: "actions",
    icon: "Mail",
    configFields: [
      { key: "to", label: "To", type: "text", defaultValue: "client@example.com" },
      { key: "subject", label: "Subject", type: "text", defaultValue: "Update" },
    ],
  },
  {
    type: "setVariable",
    label: "Set Variable",
    description: "Store value in context",
    category: "data",
    icon: "Database",
    configFields: [
      { key: "name", label: "Variable Name", type: "text", defaultValue: "customerName" },
      { key: "value", label: "Value", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "jsonParse",
    label: "JSON Parse",
    description: "Parse JSON payload",
    category: "data",
    icon: "Braces",
    configFields: [
      { key: "path", label: "JSON Path", type: "text", defaultValue: "$.data" },
    ],
  },
];

export function getNodeDefinition(type: string) {
  return nodeDefinitions.find((node) => node.type === type) ?? null;
}
