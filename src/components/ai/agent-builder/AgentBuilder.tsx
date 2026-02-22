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
}: {
  locale: "ar" | "en";
  businessName: string;
}) {
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const nodes = useWorkflowStore((state) => state.nodes);
  const addNode = useWorkflowStore((state) => state.addNode);

  useEffect(() => {
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
  }, [addNode, businessName, importWorkflow, nodes.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3">
      <Toolbar businessName={businessName} locale={locale} />

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
