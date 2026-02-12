"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HiOutlineKey } from "react-icons/hi";
import { RoleSelect } from "@/components/ui/RoleSelect";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { approveUserAction, restoreUserAction, updateUserActiveAction, updateUserPasswordAction, updateUserRoleAction, updateUserVerifiedAction } from "./actions";
import type { Role } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import type { UserListItem } from "@/lib/db/users";

interface UserRoleManagementProps {
  users: UserListItem[];
  archivedCount: number;
  showArchived: boolean;
  locale: Locale;
  currentUserId: string;
  /** IDs of users who have an agent record in the agents table */
  agentUserIds: Set<string> | string[];
  /** Map of userId → wallet balance */
  walletBalances: Record<string, number>;
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

export function UserRoleManagement({ users, archivedCount, showArchived, locale, currentUserId, agentUserIds, walletBalances }: UserRoleManagementProps) {
  const router = useRouter();
  const agentSet = useMemo(() => new Set(agentUserIds), [agentUserIds]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Role>>({});
  const [verifiedOverrides, setVerifiedOverrides] = useState<Record<string, boolean>>({});
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [savingRoleUserId, setSavingRoleUserId] = useState<string | null>(null);
  const [savingVerifiedUserId, setSavingVerifiedUserId] = useState<string | null>(null);
  const [savingActiveUserId, setSavingActiveUserId] = useState<string | null>(null);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [restoringUserId, setRestoringUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [passwordModal, setPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const pageSize = 20;

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

  const handleRoleChange = async (userId: string, newRole: Role, previousRole: Role) => {
    setRoleOverrides((prev) => ({ ...prev, [userId]: newRole }));
    setSavingRoleUserId(userId);

    try {
      const formData = new FormData();
      formData.append("role", newRole);
      await updateUserRoleAction(locale, userId, formData);
    } catch (error) {
      console.error("Failed to update role:", error);
      setRoleOverrides((prev) => ({ ...prev, [userId]: previousRole }));
      const msg = error instanceof Error ? error.message : "";
      if (msg === "NOT_AN_AGENT") {
        alert(locale === "ar"
          ? "يجب إضافة المستخدم كوكيل أولاً من صفحة إدارة الوكلاء"
          : "User must be added as an agent first from the Agents management page");
      }
    } finally {
      setSavingRoleUserId(null);
    }
  };

  const handleVerifiedToggle = async (userId: string, currentValue: boolean) => {
    const nextValue = !currentValue;
    setVerifiedOverrides((prev) => ({ ...prev, [userId]: nextValue }));
    setSavingVerifiedUserId(userId);

    try {
      await updateUserVerifiedAction(locale, userId, nextValue);
    } catch (error) {
      console.error("Failed to update verification:", error);
      setVerifiedOverrides((prev) => ({ ...prev, [userId]: currentValue }));
    } finally {
      setSavingVerifiedUserId(null);
    }
  };

  const handleActiveToggle = async (userId: string, currentValue: boolean) => {
    const nextValue = !currentValue;
    setActiveOverrides((prev) => ({ ...prev, [userId]: nextValue }));
    setSavingActiveUserId(userId);

    try {
      await updateUserActiveAction(locale, userId, nextValue);
    } catch (error) {
      console.error("Failed to update active status:", error);
      setActiveOverrides((prev) => ({ ...prev, [userId]: currentValue }));
    } finally {
      setSavingActiveUserId(null);
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

  const restoreUser = async (userId: string) => {
    setRestoringUserId(userId);
    try {
      await restoreUserAction(locale, userId);
      router.refresh();
    } finally {
      setRestoringUserId(null);
    }
  };

  const openPasswordModal = (userId: string, userName: string) => {
    setPasswordModal({ userId, userName });
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const closePasswordModal = () => {
    if (changingPassword) return;
    setPasswordModal(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const changePassword = async () => {
    if (!passwordModal) return;

    if (newPassword.trim().length < 8) {
      setPasswordError(locale === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setChangingPassword(true);
    setPasswordError("");
    try {
      await updateUserPasswordAction(locale, passwordModal.userId, newPassword);
      closePasswordModal();
      alert(locale === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      setPasswordError(msg || (locale === "ar" ? "فشل تغيير كلمة المرور" : "Failed to change password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const filteredApprovedUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return approvedUsers.filter((u) => {
      const matchesSearch = term
        ? [u.fullName, u.email, u.phone, u.id]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term))
        : true;

      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const isVerified = verifiedOverrides[u.id] ?? u.isVerified ?? false;
      const matchesVerified =
        verifiedFilter === "all"
          ? true
          : verifiedFilter === "verified"
            ? isVerified
            : !isVerified;
      const isActive = activeOverrides[u.id] ?? u.isActive ?? true;
      const matchesActive =
        activeFilter === "all"
          ? true
          : activeFilter === "active"
            ? isActive
            : !isActive;

      return matchesSearch && matchesRole && matchesVerified && matchesActive;
    });
  }, [approvedUsers, search, roleFilter, verifiedFilter, activeFilter, verifiedOverrides, activeOverrides]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, verifiedFilter, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApprovedUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredApprovedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: "var(--surface-border)" }}>
            <div>
              <h2 className="text-lg font-semibold">
                {showArchived 
                  ? (locale === "ar" ? "جميع المستخدمين (شامل المؤرشف)" : "All users (including archived)")
                  : (locale === "ar" ? "قائمة المستخدمين" : "All users")}
              </h2>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {locale === "ar"
                  ? `${approvedUsers.length} مستخدم معتمد`
                  : `${approvedUsers.length} approved users`}
              </p>
            </div>
            {archivedCount > 0 && (
              <Link
                href={showArchived ? `/${locale}/admin/users` : `/${locale}/admin/users?archived=true`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {showArchived 
                  ? (locale === "ar" ? "إخفاء المؤرشفين" : "Hide archived")
                  : (locale === "ar" ? `عرض المؤرشفين (${archivedCount})` : `Show archived (${archivedCount})`)}
              </Link>
            )}
          </div>

          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--surface-border)" }}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-(--muted-foreground)">
                  {locale === "ar" ? "بحث" : "Search"}
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-xl px-3 text-sm border"
                  style={{ borderColor: "var(--surface-border)", backgroundColor: "var(--background)" }}
                  placeholder={locale === "ar" ? "البريد، الاسم، الهاتف أو المعرف" : "Email, name, phone, or ID"}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-(--muted-foreground)">
                  {locale === "ar" ? "الدور" : "Role"}
                </span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
                  className="h-10 rounded-xl px-3 text-sm border"
                  style={{ borderColor: "var(--surface-border)", backgroundColor: "var(--background)" }}
                >
                  <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
                  <option value="admin">{locale === "ar" ? "مدير" : "Admin"}</option>
                  <option value="user">{locale === "ar" ? "مستخدم" : "User"}</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-(--muted-foreground)">
                  {locale === "ar" ? "التوثيق" : "Verification"}
                </span>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as "all" | "verified" | "unverified")}
                  className="h-10 rounded-xl px-3 text-sm border"
                  style={{ borderColor: "var(--surface-border)", backgroundColor: "var(--background)" }}
                >
                  <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
                  <option value="verified">{locale === "ar" ? "موثق" : "Verified"}</option>
                  <option value="unverified">{locale === "ar" ? "غير موثق" : "Unverified"}</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-(--muted-foreground)">
                  {locale === "ar" ? "الحالة" : "Status"}
                </span>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")}
                  className="h-10 rounded-xl px-3 text-sm border"
                  style={{ borderColor: "var(--surface-border)", backgroundColor: "var(--background)" }}
                >
                  <option value="all">{locale === "ar" ? "الكل" : "All"}</option>
                  <option value="active">{locale === "ar" ? "نشط" : "Active"}</option>
                  <option value="inactive">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-(--muted-foreground)">
              <thead className="text-xs uppercase bg-(--chip-bg) text-(--muted-foreground)">
                <tr>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "المستخدم" : "User"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "الرصيد" : "Balance"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "الحالة" : "Status"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "التوثيق" : "Verified"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "الدور" : "Role"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "الإنشاء" : "Created"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "التفعيل" : "Active"}</th>
                  <th scope="col" className="px-5 py-3">{locale === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => {
                  const currentRole = roleOverrides[u.id] ?? u.role;
                  const isCurrentUser = u.id === currentUserId;
                  const isSavingRole = savingRoleUserId === u.id;
                  const isVerified = verifiedOverrides[u.id] ?? u.isVerified ?? false;
                  const isSavingVerified = savingVerifiedUserId === u.id;
                  const isActive = activeOverrides[u.id] ?? u.isActive ?? true;
                  const isSavingActive = savingActiveUserId === u.id;
                  const edited = isEditedUser(u.createdAt, u.updatedAt);
                  const fresh = isNewUser(u.createdAt);

                  return (
                    <tr key={u.id} className="border-b" style={{ borderColor: "var(--surface-border)" }}>
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link 
                                href={`/${locale}/admin/users/${u.id}`}
                                className="truncate text-sm font-semibold text-foreground hover:text-accent transition-colors"
                              >
                                {u.fullName}
                              </Link>
                              {isVerified ? (
                                <span
                                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
                                  aria-label={locale === "ar" ? "حساب موثق" : "Verified account"}
                                  title={locale === "ar" ? "حساب موثق" : "Verified account"}
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                                  </svg>
                                </span>
                              ) : null}
                            </div>
                            {u.isArchived ? (
                              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-600">
                                {locale === "ar" ? "مؤرشف" : "Archived"}
                              </span>
                            ) : null}
                            {isCurrentUser ? (
                              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                                {locale === "ar" ? "أنت" : "You"}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-xs text-(--muted-foreground) truncate">{u.email}</div>
                          {u.phone ? <div className="text-xs text-(--muted-foreground) truncate">{u.phone}</div> : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium tabular-nums">
                          {(walletBalances[u.id] ?? 0).toFixed(3)} <span className="text-xs text-(--muted-foreground)">OMR</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
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
                      </td>
                      <td className="px-5 py-4">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={isVerified}
                            onChange={() => handleVerifiedToggle(u.id, isVerified)}
                            disabled={isSavingVerified}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <span className={isVerified ? "text-blue-600" : "text-(--muted-foreground)"}>
                            {isVerified ? (locale === "ar" ? "موثق" : "Verified") : (locale === "ar" ? "غير موثق" : "Unverified")}
                          </span>
                          {isSavingVerified ? (
                            <span className="inline-flex items-center">
                              <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                            </span>
                          ) : null}
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative">
                          <RoleSelect
                            value={currentRole}
                            onChange={(newRole) => handleRoleChange(u.id, newRole, currentRole)}
                            placeholder={locale === "ar" ? "اختر الدور" : "Select role"}
                            locale={locale}
                            disabled={isCurrentUser}
                            disabledRoles={agentSet.has(u.id) ? [] : ["agent"]}
                          />
                          {isSavingRole && (
                            <div className="absolute top-0 right-0 -mr-6 flex items-center justify-center">
                              <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-(--muted-foreground)">
                        {formatDate(u.createdAt, locale)}
                      </td>
                      <td className="px-5 py-4">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleActiveToggle(u.id, isActive)}
                            disabled={isSavingActive || isCurrentUser}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span className={isActive ? "text-emerald-600" : "text-(--muted-foreground)"}>
                            {isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
                          </span>
                          {isSavingActive ? (
                            <span className="inline-flex items-center">
                              <span className="animate-spin h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full" />
                            </span>
                          ) : null}
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {u.isArchived ? (
                            <button
                              type="button"
                              onClick={() => restoreUser(u.id)}
                              disabled={restoringUserId === u.id}
                              className={buttonVariants({ variant: "secondary", size: "sm" })}
                            >
                              {restoringUserId === u.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                  {locale === "ar" ? "استعادة..." : "Restoring..."}
                                </span>
                              ) : (
                                locale === "ar" ? "استعادة" : "Restore"
                              )}
                            </button>
                          ) : (
                            <>
                              <Link
                                href={`/${locale}/admin/users/${u.id}`}
                                className={buttonVariants({ variant: "secondary", size: "sm" })}
                              >
                                {locale === "ar" ? "تعديل" : "Edit"}
                              </Link>
                              <button
                                type="button"
                                onClick={() => openPasswordModal(u.id, u.fullName || u.email)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                                title={locale === "ar" ? "تغيير كلمة المرور" : "Change password"}
                                aria-label={locale === "ar" ? "تغيير كلمة المرور" : "Change password"}
                              >
                                <HiOutlineKey className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "var(--surface-border)" }}>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? `عرض ${(currentPage - 1) * pageSize + (pagedUsers.length ? 1 : 0)}-${
                    (currentPage - 1) * pageSize + pagedUsers.length
                  } من ${filteredApprovedUsers.length}`
                : `Showing ${(currentPage - 1) * pageSize + (pagedUsers.length ? 1 : 0)}-${
                    (currentPage - 1) * pageSize + pagedUsers.length
                  } of ${filteredApprovedUsers.length}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ borderColor: "var(--surface-border)" }}
              >
                {locale === "ar" ? "السابق" : "Prev"}
              </button>
              <span className="text-xs font-semibold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ borderColor: "var(--surface-border)" }}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {passwordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-gray-200/70 bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-gray-900/95">
            <h3 className="text-lg font-semibold">
              {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
            </h3>
            <p className="mt-1 text-sm text-(--muted-foreground)">{passwordModal.userName}</p>

            <div className="mt-4 space-y-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">{locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}</span>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={locale === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
                  autoFocus
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium">{locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</span>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                />
              </label>
            </div>

            {passwordError ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                {passwordError}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={changePassword}
                disabled={changingPassword}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                {changingPassword
                  ? locale === "ar" ? "جارٍ الحفظ..." : "Saving..."
                  : locale === "ar" ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
