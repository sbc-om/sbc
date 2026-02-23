"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { Sidebar } from "./sidebar/Sidebar";
import { ConfigPanel } from "./panels/ConfigPanel";
import { Toolbar } from "./toolbar/Toolbar";
import { ChatBox } from "./chat/ChatBox";
import { ChatTrigger } from "./chat/ChatTrigger";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";

const Canvas = dynamic(() => import("./Canvas").then((module) => module.Canvas), {
  ssr: false,
});

export function AgentBuilder({
  locale,
  businessName,
  agentId,
  initialWorkflow,
  initialName,
  planKey,
  maxNodes,
}: {
  locale: "ar" | "en";
  businessName: string;
  agentId?: string;
  initialWorkflow?: Record<string, unknown>;
  initialName?: string;
  planKey?: string;
  maxNodes?: number;
}) {
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const nodes = useWorkflowStore((state) => state.nodes);
  const addNode = useWorkflowStore((state) => state.addNode);

  useEffect(() => {
    // If we have an initial workflow from DB, load it
    if (initialWorkflow && Object.keys(initialWorkflow).length > 0) {
      importWorkflow(JSON.stringify(initialWorkflow));
      if (initialName) setWorkflowName(initialName);
      return;
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(`agentflow:${businessName}`);
    if (saved) {
      importWorkflow(saved);
      return;
    }

    if (nodes.length === 0) {
      addNode("chatTrigger", { x: 80, y: 160 });
      addNode("aiAgent", { x: 380, y: 160 });
      addNode("sendMessage", { x: 680, y: 160 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3">
      <Toolbar
        businessName={businessName}
        locale={locale}
        agentId={agentId}
        planKey={planKey}
        maxNodes={maxNodes}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[320px_1fr_320px]">
        <div className="hidden min-h-0 lg:block">
          <Sidebar />
        </div>
        <div className="min-h-0">
          <Canvas />
        </div>
        <div className="hidden min-h-0 lg:block">
          <ConfigPanel />
        </div>
      </div>

      <ChatBox locale={locale} />
      <ChatTrigger label={locale === "ar" ? "اختبار الوكيل" : "Test Agent"} />
    </div>
  );
}
