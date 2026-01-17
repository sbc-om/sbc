"use client";

import { useState } from "react";
import { RoleSelect } from "@/components/ui/RoleSelect";
import { approveUserAction, updateUserRoleAction } from "./actions";
import type { Role } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import type { UserListItem } from "@/lib/db/users";

interface UserRoleManagementProps {
  users: UserListItem[];
  locale: Locale;
  currentUserId: string;
}

function formatDate(iso: string, locale: Locale) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function UserRoleManagement({ users, locale, currentUserId }: UserRoleManagementProps) {
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);

  const now = Date.now();
  const recentMs = 1000 * 60 * 60 * 48;

  const pendingApprovals = users
    .filter((u) => u.approvalStatus && u.approvalStatus !== "approved")
    .sort((a, b) =>
      (b.approvalRequestedAt ?? b.createdAt).localeCompare(
        a.approvalRequestedAt ?? a.createdAt
      )
    );

  const approvedUsers = users.filter((u) => !u.approvalStatus || u.approvalStatus === "approved");

  const isNewUser = (createdAt: string) => now - new Date(createdAt).getTime() <= recentMs;
  const isEditedUser = (createdAt: string, updatedAt?: string) => {
    if (!updatedAt) return false;
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    return updated > created && now - updated <= recentMs;
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
    
    // Auto-save after a short delay
    setSavingUserId(userId);
    
    try {
      const formData = new FormData();
      formData.append("role", newRole);
      await updateUserRoleAction(locale, userId, formData);
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setSavingUserId(null);
      // Clear pending state after save
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const approveUser = async (userId: string) => {
    setApprovingUserId(userId);
    try {
      await approveUserAction(locale, userId);
    } finally {
      setApprovingUserId(null);
    }
  };

  return (
    <div className="mt-8 grid gap-6">
      {users.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "لا يوجد مستخدمون بعد." : "No users yet."}
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {locale === "ar" ? "الحسابات بانتظار الموافقة" : "Pending approvals"}
            </h2>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? `${pendingApprovals.length} حساب بحاجة للمراجعة`
                : `${pendingApprovals.length} accounts need review`}
            </p>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "لا توجد حسابات بانتظار الموافقة حالياً."
              : "No accounts awaiting approval right now."}
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingApprovals.map((u) => {
              const reason =
                u.approvalReason === "contact_update"
                  ? locale === "ar"
                    ? "تعديل بيانات الاتصال"
                    : "Contact update"
                  : locale === "ar"
                    ? "حساب جديد"
                    : "New account";
              const isApproving = approvingUserId === u.id;

              return (
                <div key={u.id} className="sbc-card rounded-2xl p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold truncate">
                          {u.fullName}
                        </div>
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          {reason}
                        </span>
                        {isNewUser(u.createdAt) ? (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            {locale === "ar" ? "جديد" : "New"}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid gap-1 text-sm text-(--muted-foreground)">
                        <div className="truncate">{u.email}</div>
                        <div className="truncate">{u.phone || "-"}</div>
                        {u.pendingEmail || u.pendingPhone ? (
                          <div className="text-xs">
                            {locale === "ar" ? "قيد الاعتماد:" : "Pending:"} {" "}
                            {[u.pendingEmail, u.pendingPhone].filter(Boolean).join(" • ")}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="text-(--muted-foreground)">
                        {locale === "ar" ? "طلب في" : "Requested"}: {" "}
                        {formatDate(u.approvalRequestedAt ?? u.createdAt, locale)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isApproving}
                          onClick={() => approveUser(u.id)}
                          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-(--accent-foreground) shadow-(--shadow) hover:brightness-[1.05] disabled:opacity-60"
                        >
                          {isApproving
                            ? locale === "ar"
                              ? "جارٍ التأكيد..."
                              : "Approving..."
                            : locale === "ar"
                              ? "تأكيد الحساب"
                              : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {users.length > 0 ? (
        <div className="sbc-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
            <h2 className="text-lg font-semibold">
              {locale === "ar" ? "قائمة المستخدمين" : "All users"}
            </h2>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? `${approvedUsers.length} مستخدم معتمد`
                : `${approvedUsers.length} approved users`}
            </p>
          </div>

          <div className="hidden lg:grid grid-cols-[1.6fr_1.2fr_200px_160px_160px] gap-3 px-5 py-3 text-xs font-semibold text-(--muted-foreground) border-b" style={{ borderColor: "var(--surface-border)" }}>
            <div>{locale === "ar" ? "المستخدم" : "User"}</div>
            <div>{locale === "ar" ? "الاتصال" : "Contact"}</div>
            <div>{locale === "ar" ? "الحالة" : "Status"}</div>
            <div>{locale === "ar" ? "الدور" : "Role"}</div>
            <div>{locale === "ar" ? "الإنشاء" : "Created"}</div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
            {approvedUsers.map((u) => {
              const currentRole = pendingRoles[u.id] ?? u.role;
              const isCurrentUser = u.id === currentUserId;
              const isSaving = savingUserId === u.id;
              const edited = isEditedUser(u.createdAt, u.updatedAt);
              const fresh = isNewUser(u.createdAt);

              return (
                <div
                  key={u.id}
                  className="px-5 py-4 lg:grid lg:grid-cols-[1.6fr_1.2fr_200px_160px_160px] lg:gap-3 lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">{u.fullName}</div>
                      {isCurrentUser ? (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                          {locale === "ar" ? "أنت" : "You"}
                        </span>
                      ) : null}
                    </div>
                      <div className="mt-1 text-xs text-(--muted-foreground) truncate">ID: {u.id}</div>
                  </div>

                  <div className="mt-3 lg:mt-0 text-xs text-(--muted-foreground)">
                    <div className="truncate">{u.email}</div>
                    <div className="truncate">{u.phone || "-"}</div>
                  </div>

                  <div className="mt-3 lg:mt-0 flex flex-wrap gap-2">
                    {fresh ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        {locale === "ar" ? "جديد" : "New"}
                      </span>
                    ) : null}
                    {edited ? (
                      <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-600">
                        {locale === "ar" ? "تم التعديل" : "Edited"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 lg:mt-0 relative">
                    <RoleSelect
                      value={currentRole}
                      onChange={(newRole) => handleRoleChange(u.id, newRole)}
                      placeholder={locale === "ar" ? "اختر الدور" : "Select role"}
                      locale={locale}
                      disabled={isCurrentUser}
                    />
                    {isSaving && (
                      <div className="absolute top-0 right-0 -mr-6 flex items-center justify-center">
                        <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 lg:mt-0 text-xs text-(--muted-foreground)">
                    {formatDate(u.createdAt, locale)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
