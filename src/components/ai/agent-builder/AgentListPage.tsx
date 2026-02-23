"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineCpuChip,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineBolt,
  HiOutlineClock,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { Button, buttonVariants } from "@/components/ui/Button";
import type { BusinessAiAgent } from "@/lib/db/businessAiAgents";

export function AgentListPage({
  locale,
  agents,
  agentCount,
  maxAgents,
  planKey,
  businessName,
  businessId,
}: {
  locale: string;
  agents: BusinessAiAgent[];
  agentCount: number;
  maxAgents: number;
  planKey: string;
  businessName: string;
  businessId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const ar = locale === "ar";

  const canCreate = agentCount < maxAgents;

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/agent-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ar ? "وكيل جديد" : "New Agent",
          description: "",
          workflow: {},
        }),
      });
      const data = await res.json();
      if (data.ok && data.agent) {
        router.push(`/${locale}/ai?agent=${data.agent.id}`);
      } else {
        alert(data.message || data.error || "Error");
      }
    } catch {
      alert(ar ? "حدث خطأ" : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا الوكيل؟" : "Are you sure you want to delete this agent?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/agent-builder/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert(data.error || "Error");
      }
    } catch {
      alert(ar ? "حدث خطأ" : "An error occurred");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12">
              <HiOutlineCpuChip className="h-7 w-7 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {ar ? "منشئ الوكيل الذكي" : "AI Agent Builder"}
              </h1>
              <p className="text-sm text-(--muted-foreground)">{businessName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="sbc-chip rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
            {planKey}
          </span>
          <span className="text-sm text-(--muted-foreground)">
            {agentCount}/{maxAgents} {ar ? "وكيل" : "agents"}
          </span>
          {canCreate ? (
            <Button size="sm" onClick={handleCreate}>
              <HiOutlinePlus className="h-4 w-4" />
              {ar ? "وكيل جديد" : "New Agent"}
            </Button>
          ) : (
            <Link
              href={`/${locale}/store?q=agent-builder`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "ترقية" : "Upgrade"}
            </Link>
          )}
        </div>
      </div>

      {/* Agent List */}
      {agents.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10">
            <HiOutlineCpuChip className="h-10 w-10 text-violet-500/60" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {ar ? "لا يوجد وكلاء بعد" : "No agents yet"}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-(--muted-foreground)">
              {ar
                ? "أنشئ أول وكيل ذكي لنشاطك التجاري لأتمتة التفاعل مع العملاء."
                : "Create your first AI agent to automate customer interactions for your business."}
            </p>
          </div>
          {canCreate && (
            <Button size="sm" onClick={handleCreate}>
              <HiOutlinePlus className="h-4 w-4" />
              {ar ? "إنشاء أول وكيل" : "Create First Agent"}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="sbc-card sbc-card--interactive group relative flex flex-col overflow-hidden rounded-2xl border border-violet-500/20 p-5"
            >
              {/* Status dot */}
              <div className="absolute end-4 top-4">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    agent.isDeployed
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : agent.isActive
                        ? "bg-amber-400"
                        : "bg-slate-400"
                  }`}
                  title={
                    agent.isDeployed
                      ? ar ? "منشور" : "Deployed"
                      : agent.isActive
                        ? ar ? "مسودة" : "Draft"
                        : ar ? "متوقف" : "Inactive"
                  }
                />
              </div>

              {/* Name & description */}
              <h3 className="truncate pe-8 text-base font-semibold">{agent.name}</h3>
              {agent.description && (
                <p className="mt-1 line-clamp-2 text-sm text-(--muted-foreground)">
                  {agent.description}
                </p>
              )}

              {/* Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-(--muted-foreground)">
                <span className="flex items-center gap-1">
                  <HiOutlineBolt className="h-3.5 w-3.5" />
                  {agent.executionCount} {ar ? "تنفيذ" : "runs"}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock className="h-3.5 w-3.5" />
                  {formatDate(agent.updatedAt)}
                </span>
              </div>

              {/* Plan badge */}
              <div className="mt-3">
                <span className="sbc-chip rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {agent.plan}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-(--surface-border) pt-4">
                <Link
                  href={`/${locale}/ai?agent=${agent.id}`}
                  className={buttonVariants({ variant: "primary", size: "sm" }) + " flex-1 justify-center"}
                >
                  <HiOutlinePencilSquare className="h-4 w-4" />
                  {ar ? "تعديل" : "Edit"}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(agent.id)}
                  disabled={deleting === agent.id}
                  className="text-red-500 hover:text-red-600"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Create new card */}
          {canCreate && (
            <button
              onClick={handleCreate}
              className="sbc-card sbc-card--interactive flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-500/25 p-6 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <HiOutlinePlus className="h-7 w-7 text-violet-500" />
              </div>
              <span className="text-sm font-semibold text-(--muted-foreground)">
                {ar ? "إنشاء وكيل جديد" : "Create New Agent"}
              </span>
            </button>
          )}
        </div>
      )}
    </AppPage>
  );
}
