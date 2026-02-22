import {
  Bot,
  Braces,
  Brain,
  Clock3,
  Code2,
  Combine,
  Database,
  GitBranch,
  Globe,
  Mail,
  MemoryStick,
  MessageCircle,
  Send,
  Split,
  Webhook,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { createElement } from "react";

import type { NodeDefinition } from "./types";

const map = {
  MessageCircle,
  Webhook,
  Clock3,
  Bot,
  Brain,
  MemoryStick,
  Globe,
  Code2,
  GitBranch,
  Split,
  Combine,
  Send,
  Mail,
  Database,
  Braces,
} as const;

export function getNodeIcon(name: NodeDefinition["icon"]) {
  return map[name];
}

export function NodeIcon({
  name,
  ...props
}: { name: NodeDefinition["icon"] } & LucideProps) {
  const Icon = map[name];
  return createElement(Icon, props);
}
