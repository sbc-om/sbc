"use client";

import { Download, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWorkflowStore } from "@/store/agentflow/workflow-store";

export function Toolbar({
  businessName,
  locale,
}: {
  businessName: string;
  locale: "ar" | "en";
}) {
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const exportWorkflow = useWorkflowStore((state) => state.exportWorkflow);
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);

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
    const payload = exportWorkflow();
    localStorage.setItem(`agentflow:${businessName}`, payload);
    alert(locale === "ar" ? "تم حفظ الوكيل محلياً" : "Agent saved locally");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-3">
      <div className="min-w-[220px] flex-1">
        <p className="text-xs text-(--muted-foreground)">{businessName}</p>
        <Input
          value={workflowName}
          onChange={(event) => setWorkflowName(event.target.value)}
          className="mt-1 h-10"
          placeholder={locale === "ar" ? "اسم الوكيل" : "Agent name"}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4" />
          {locale === "ar" ? "استيراد" : "Import"}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
          {locale === "ar" ? "تصدير" : "Export"}
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </div>
    </div>
  );
}
