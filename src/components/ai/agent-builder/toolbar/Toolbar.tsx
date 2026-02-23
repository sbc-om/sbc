"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Cloud, CloudOff, Download, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";

export function Toolbar({
  businessName,
  locale,
  agentId,
  planKey,
  maxNodes,
}: {
  businessName: string;
  locale: "ar" | "en";
  agentId?: string;
  planKey?: string;
  maxNodes?: number;
}) {
  const router = useRouter();
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const exportWorkflow = useWorkflowStore((state) => state.exportWorkflow);
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const nodes = useWorkflowStore((state) => state.nodes);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleExport = async () => {
    const json = exportWorkflow();
    await navigator.clipboard.writeText(json);
    alert(locale === "ar" ? "تم نسخ الـ JSON" : "Workflow JSON copied");
  };

  const handleImport = () => {
    const raw = window.prompt(locale === "ar" ? "ألصق JSON هنا" : "Paste workflow JSON");
    if (!raw) return;
    const result = importWorkflow(raw);
    if (!result.ok) {
      alert(result.error || "Import failed");
    }
  };

  const handleSave = async () => {
    if (maxNodes && nodes.length > maxNodes) {
      alert(
        locale === "ar"
          ? `طرحك الحالي يسمح بحد أقصى ${maxNodes} عقدة. قم بالترقية للمزيد.`
          : `Your current plan allows up to ${maxNodes} nodes. Upgrade for more.`,
      );
      return;
    }

    setSaving(true);
    try {
      const workflowJson = exportWorkflow();
      const workflow = JSON.parse(workflowJson);

      if (agentId) {
        // Update existing agent in DB
        const res = await fetch(`/api/agent-builder/${agentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: workflowName, workflow }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Save failed");
      } else {
        // Fallback: save to localStorage (for when no agent ID)
        localStorage.setItem(`agentflow:${businessName}`, workflowJson);
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error("Save error:", err);
      alert(locale === "ar" ? "فشل الحفظ" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const ar = locale === "ar";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/ai`)}
          title={ar ? "العودة" : "Back"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-[200px] flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-(--muted-foreground)">{businessName}</p>
            {planKey && (
              <span className="sbc-chip rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {planKey}
              </span>
            )}
          </div>
          <Input
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
            className="mt-1 h-10"
            placeholder={ar ? "اسم الوكيل" : "Agent name"}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {lastSaved && (
          <span className="flex items-center gap-1 text-xs text-(--muted-foreground)">
            <Cloud className="h-3 w-3 text-emerald-500" />
            {ar ? "تم الحفظ" : "Saved"}
          </span>
        )}
        {maxNodes && nodes.length > 0 && (
          <span className={`text-xs ${nodes.length > maxNodes ? "text-red-500 font-semibold" : "text-(--muted-foreground)"}`}>
            {nodes.length}/{maxNodes} {ar ? "عقدة" : "nodes"}
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">{ar ? "استيراد" : "Import"}</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{ar ? "تصدير" : "Export"}</span>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <CloudOff className="h-4 w-4 animate-pulse" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
        </Button>
      </div>
    </div>
  );
}
