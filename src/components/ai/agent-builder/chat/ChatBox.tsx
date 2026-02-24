"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { executeWorkflow } from "@/lib/ai/agentflow/workflow-executor";
import { useAgentChatStore } from "@/store/agentflow/chat-store";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";
import { ExecutionTrace } from "./ExecutionTrace";

export function ChatBox({ locale }: { locale: "ar" | "en" }) {
  const [input, setInput] = useState("");
  const isOpen = useAgentChatStore((state) => state.isOpen);
  const isRunning = useAgentChatStore((state) => state.isRunning);
  const messages = useAgentChatStore((state) => state.messages);
  const steps = useAgentChatStore((state) => state.steps);
  const setOpen = useAgentChatStore((state) => state.setOpen);
  const setRunning = useAgentChatStore((state) => state.setRunning);
  const addUserMessage = useAgentChatStore((state) => state.addUserMessage);
  const addAgentMessage = useAgentChatStore((state) => state.addAgentMessage);
  const setSteps = useAgentChatStore((state) => state.setSteps);

  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  if (!isOpen) return null;

  const run = async () => {
    const text = input.trim();
    if (!text || isRunning) return;

    addUserMessage(text);
    setInput("");
    setRunning(true);

    const result = await executeWorkflow(nodes, edges, text);
    setSteps(result.steps);
    addAgentMessage(result.finalOutput);
    setRunning(false);
  };

  return (
    <div className="fixed end-5 z-40 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-(--surface-border) bg-(--background) p-3 shadow-[var(--shadow)] bottom-[calc(var(--mobile-nav-height,72px)+env(safe-area-inset-bottom)+12px)] lg:bottom-5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{locale === "ar" ? "اختبار الوكيل" : "Test Agent"}</h4>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-(--chip-bg)">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid max-h-44 gap-2 overflow-y-auto rounded-lg border border-(--surface-border) bg-(--surface) p-2">
        {messages.length === 0 ? (
          <p className="text-xs text-(--muted-foreground)">
            {locale === "ar" ? "أرسل رسالة لتجربة سير العمل." : "Send a message to test your workflow."}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs ${
                message.role === "user"
                  ? "ms-auto bg-(--accent) text-(--accent-foreground)"
                  : "me-auto bg-(--chip-bg) text-foreground"
              }`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>

      <div className="mt-2">
        <ExecutionTrace steps={steps} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void run();
            }
          }}
          className="h-10"
          placeholder={locale === "ar" ? "اكتب رسالة..." : "Write message..."}
        />
        <Button onClick={() => void run()} disabled={isRunning} size="sm">
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
