"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineX,
} from "react-icons/hi";
import {
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineReceiptPercent,
  HiOutlineCheckBadge,
  HiOutlineXCircle,
} from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";
import type { Agent, AgentCommission, AgentClientWithUser } from "@/lib/db/agents";

type Props = {
  locale: Locale;
  agent: Agent;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
  };
  clients: AgentClientWithUser[];
  commissions: AgentCommission[];
  stats: {
    totalClients: number;
    totalEarned: number;
    pendingAmount: number;
    totalTransactions: number;
  };
};

export default function AgentDetailView({
  locale,
  agent,
  user,
  clients,
  commissions,
  stats,
}: Props) {
  const router = useRouter();
  const ar = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [editing, setEditing] = useState(false);
  const [commissionRate, setCommissionRate] = useState(String(agent.commissionRate));
  const [notes, setNotes] = useState(agent.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = {
    back: ar ? "الوكلاء" : "Agents",
    agentInfo: ar ? "معلومات الوكيل" : "Agent Information",
    commission: ar ? "نسبة العمولة" : "Commission Rate",
    notesLabel: ar ? "ملاحظات" : "Notes",
    edit: ar ? "تعديل" : "Edit",
    save: ar ? "حفظ" : "Save",
    cancel: ar ? "إلغاء" : "Cancel",
    activate: ar ? "تفعيل" : "Activate",
    deactivate: ar ? "إيقاف" : "Deactivate",
    active: ar ? "نشط" : "Active",
    inactive: ar ? "غير نشط" : "Inactive",
    clients: ar ? "العملاء" : "Clients",
    recentCommissions: ar ? "العمولات الأخيرة" : "Recent Commissions",
    totalEarned: ar ? "إجمالي الأرباح" : "Total Earned",
    pending: ar ? "قيد الانتظار" : "Pending",
    transactions: ar ? "عمليات" : "Transactions",
    noClients: ar ? "لا يوجد عملاء بعد" : "No clients yet",
    noCommissions: ar ? "لا يوجد عمولات بعد" : "No commissions yet",
    amount: ar ? "المبلغ" : "Amount",
    commissionCol: ar ? "العمولة" : "Commission",
    status: ar ? "الحالة" : "Status",
    date: ar ? "التاريخ" : "Date",
    paid: ar ? "مدفوع" : "Paid",
    pendingStatus: ar ? "معلق" : "Pending",
    markPaid: ar ? "تحويل" : "Pay",
    saving_: ar ? "جاري..." : "Saving...",
  };

  async function handleSave() {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError(ar ? "النسبة يجب أن تكون بين 0 و 100" : "Commission must be between 0 and 100");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          commissionRate: rate,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update");
      }
      setEditing(false);
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    setSaving(true);
    setError("");
    try {
      const action = agent.isActive ? "deactivate" : "activate";
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(commissionId: string) {
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "mark-paid", commissionId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/${locale}/admin/agents`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground) transition-colors"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            {t.back}
          </Link>
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200/60 dark:ring-white/[0.08]"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-lg font-bold text-gray-500 ring-2 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {user.fullName}
              </h1>
              <p className="text-sm text-(--muted-foreground)">
                {user.phone || user.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
              agent.isActive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {agent.isActive ? (
              <HiOutlineCheckBadge className="h-3.5 w-3.5" />
            ) : (
              <HiOutlineXCircle className="h-3.5 w-3.5" />
            )}
            {agent.isActive ? t.active : t.inactive}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t.commission, value: `${agent.commissionRate}%`, icon: <HiOutlineReceiptPercent className="h-5 w-5" />, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" },
          { label: t.clients, value: stats.totalClients, icon: <HiOutlineUserGroup className="h-5 w-5" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
          { label: t.totalEarned, value: `${stats.totalEarned.toFixed(3)} OMR`, icon: <HiOutlineBanknotes className="h-5 w-5" />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
          { label: t.pending, value: `${stats.pendingAmount.toFixed(3)} OMR`, icon: <HiOutlineClock className="h-5 w-5" />, color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
        ].map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-(--muted-foreground)">{card.label}</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Settings Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.04]">
          <h2 className="text-sm font-semibold">{t.agentInfo}</h2>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
            >
              <HiOutlinePencil className="h-3 w-3" />
              {t.edit}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setCommissionRate(String(agent.commissionRate));
                  setNotes(agent.notes || "");
                  setError("");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
              >
                <HiOutlineX className="h-3 w-3" />
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={saving || isPending}
                onClick={handleSave}
                className="inline-flex items-center gap-1 rounded-lg bg-(--foreground) px-3 py-1.5 text-xs font-semibold text-(--background) transition-all hover:opacity-90 disabled:opacity-50"
              >
                <HiOutlineSave className="h-3 w-3" />
                {saving || isPending ? t.saving_ : t.save}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--muted-foreground)">
                {t.commission} (%)
              </label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm tabular-nums transition-colors focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
                />
              ) : (
                <p className="text-sm font-semibold">{agent.commissionRate}%</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--muted-foreground)">
                {t.notesLabel}
              </label>
              {editing ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
                />
              ) : (
                <p className="text-sm text-(--muted-foreground)">{agent.notes || "—"}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={saving || isPending}
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 ${
              agent.isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
            }`}
          >
            {agent.isActive ? (
              <>
                <HiOutlineXCircle className="h-3.5 w-3.5" />
                {t.deactivate}
              </>
            ) : (
              <>
                <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                {t.activate}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clients */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.04]">
          <h2 className="text-sm font-semibold">
            {t.clients} ({clients.length})
          </h2>
        </div>
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <HiOutlineUserGroup className="h-8 w-8 text-(--muted-foreground)/30" />
            <p className="mt-2 text-xs text-(--muted-foreground)">{t.noClients}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
            {clients.map((c) => (
              <div key={c.clientUserId} className="flex items-center gap-3 px-5 py-3.5">
                {c.clientAvatar ? (
                  <Image
                    src={c.clientAvatar}
                    alt={c.clientName}
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                    {c.clientName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{c.clientName}</p>
                  <p className="truncate text-xs text-(--muted-foreground)">
                    {c.clientPhone || c.clientEmail}
                  </p>
                </div>
                <span className="text-xs text-(--muted-foreground) tabular-nums">
                  {new Date(c.createdAt).toLocaleDateString(ar ? "ar" : "en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commissions */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.04]">
          <h2 className="text-sm font-semibold">
            {t.recentCommissions} ({commissions.length})
          </h2>
        </div>
        {commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <HiOutlineBanknotes className="h-8 w-8 text-(--muted-foreground)/30" />
            <p className="mt-2 text-xs text-(--muted-foreground)">{t.noCommissions}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.04]">
                  <th className="px-5 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {t.date}
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {t.amount}
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {t.commissionCol}
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {t.status}
                  </th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
                {commissions.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-xs tabular-nums text-(--muted-foreground)">
                      {new Date(c.createdAt).toLocaleDateString(ar ? "ar" : "en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold tabular-nums">
                      {c.amount.toFixed(3)} OMR
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[12px] font-bold tabular-nums text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                        {c.commissionAmount.toFixed(3)} OMR
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <HiOutlineCheckBadge className="h-3 w-3" />
                          {t.paid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                          {t.pendingStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-end">
                      {c.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(c.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        >
                          {t.markPaid}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
