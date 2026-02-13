"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlineArrowLeft,
  HiOutlineCheck,
} from "react-icons/hi";
import { HiOutlineUserPlus, HiOutlineReceiptPercent } from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isVerified?: boolean;
};

export default function AddAgentForm({
  locale,
  users,
}: {
  locale: Locale;
  users: UserItem[];
}) {
  const router = useRouter();
  const ar = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState("10");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 20);
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      )
      .slice(0, 20);
  }, [search, users]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  async function handleSubmit() {
    if (!selectedUserId) return;
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError(ar ? "النسبة يجب أن تكون بين 0 و 100" : "Commission must be between 0 and 100");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          commissionRate: rate,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create agent");
      }

      startTransition(() => {
        router.push(`/${locale}/admin/agents`);
        router.refresh();
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  }

  const t = {
    title: ar ? "إضافة وكيل جديد" : "Add New Agent",
    subtitle: ar ? "ابحث عن مستخدم وحوّله إلى وكيل" : "Search for a user and promote them to agent",
    back: ar ? "الوكلاء" : "Agents",
    searchPlaceholder: ar ? "بحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone...",
    selectUser: ar ? "اختر مستخدم" : "Select User",
    noResults: ar ? "لا يوجد نتائج" : "No results found",
    commission: ar ? "نسبة العمولة (%)" : "Commission Rate (%)",
    commissionHint: ar ? "النسبة المئوية التي يحصل عليها الوكيل من كل عملية" : "Percentage the agent earns from each transaction",
    notesLabel: ar ? "ملاحظات" : "Notes",
    notesPlaceholder: ar ? "ملاحظات اختيارية عن الوكيل..." : "Optional notes about this agent...",
    save: ar ? "إضافة كوكيل" : "Add as Agent",
    saving: ar ? "جاري الحفظ..." : "Saving...",
    selectedLabel: ar ? "المستخدم المختار" : "Selected User",
    verified: ar ? "موثق" : "Verified",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/agents`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground) transition-colors"
        >
          <HiOutlineArrowLeft className="h-3.5 w-3.5" />
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
      </div>

      {/* Step 1: Select User */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.04]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <HiOutlineUserPlus className="h-4 w-4 text-(--muted-foreground)" />
            {t.selectUser}
          </div>
        </div>

        {selectedUser ? (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <HiOutlineCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{selectedUser.fullName}</p>
              <p className="truncate text-xs text-(--muted-foreground)">
                {selectedUser.phone || selectedUser.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="rounded-lg border border-gray-200/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
            >
              {ar ? "تغيير" : "Change"}
            </button>
          </div>
        ) : (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-3">
              <HiOutlineSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-gray-200/80 bg-transparent py-2.5 ps-9 pe-3 text-sm transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
              />
            </div>

            {/* User list */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.04]">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-(--muted-foreground)">{t.noResults}</p>
              ) : (
                <div className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
                  {filtered.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{user.fullName}</p>
                          {user.isVerified && (
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              {t.verified}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-(--muted-foreground)">
                          {user.phone || user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Commission & Notes */}
      {selectedUser && (
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HiOutlineReceiptPercent className="h-4 w-4 text-(--muted-foreground)" />
              {t.commission}
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--muted-foreground)">
                {t.commission}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm tabular-nums transition-colors focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
              />
              <p className="mt-1.5 text-xs text-(--muted-foreground)/70">{t.commissionHint}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--muted-foreground)">
                {t.notesLabel}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={saving || isPending}
              onClick={handleSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--foreground) px-5 py-3 text-sm font-semibold text-(--background) shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
            >
              <HiOutlineUserPlus className="h-4 w-4" />
              {saving || isPending ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
