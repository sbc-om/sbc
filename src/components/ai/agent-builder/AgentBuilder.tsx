"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PanelLeft, SlidersHorizontal, X } from "lucide-react";

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
  const [mobilePanel, setMobilePanel] = useState<"nodes" | "config" | null>(null);

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

      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel("nodes")}
          className="inline-flex items-center gap-2 rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm font-medium"
        >
          <PanelLeft className="h-4 w-4" />
          {locale === "ar" ? "العُقد" : "Nodes"}
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel("config")}
          className="inline-flex items-center gap-2 rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {locale === "ar" ? "الإعدادات" : "Settings"}
        </button>
      </div>

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

      {mobilePanel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={locale === "ar" ? "إغلاق" : "Close"}
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobilePanel(null)}
          />

          <div className="absolute inset-x-3 bottom-3 top-16 flex min-h-0 flex-col rounded-2xl border border-(--surface-border) bg-(--background) p-2 shadow-[var(--shadow)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">
                {mobilePanel === "nodes"
                  ? locale === "ar"
                    ? "العُقد"
                    : "Nodes"
                  : locale === "ar"
                    ? "إعدادات العقدة"
                    : "Node Settings"}
              </h3>
              <button
                type="button"
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                onClick={() => setMobilePanel(null)}
                className="rounded-lg p-1.5 hover:bg-(--chip-bg)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {mobilePanel === "nodes" ? <Sidebar /> : <ConfigPanel />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
