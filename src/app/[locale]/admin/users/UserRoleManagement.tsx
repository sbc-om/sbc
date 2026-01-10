"use client";

import { useState } from "react";
import { RoleSelect } from "@/components/ui/RoleSelect";
import { updateUserRoleAction } from "./actions";
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

  return (
    <div className="mt-8 grid gap-3">
      {users.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "لا يوجد مستخدمون بعد." : "No users yet."}
        </div>
      ) : (
        <div className="sbc-card rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_140px_140px] gap-3 px-5 py-3 text-xs font-semibold text-(--muted-foreground) border-b" style={{ borderColor: "var(--surface-border)" }}>
            <div>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</div>
            <div>{locale === "ar" ? "الدور" : "Role"}</div>
            <div>{locale === "ar" ? "تاريخ الإنشاء" : "Created"}</div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
            {users.map((u) => {
              const currentRole = pendingRoles[u.id] ?? u.role;
              const isCurrentUser = u.id === currentUserId;
              const isSaving = savingUserId === u.id;

              return (
                <div key={u.id} className="px-5 py-4 sm:grid sm:grid-cols-[1fr_140px_140px] sm:gap-3 sm:items-center">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{u.email}</div>
                    <div className="mt-1 text-xs text-(--muted-foreground) truncate">
                      ID: {u.id}
                      {isCurrentUser && (
                        <span className="ml-2 text-accent">
                          ({locale === "ar" ? "أنت" : "You"})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 relative">
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

                  <div className="mt-3 sm:mt-0 text-xs text-(--muted-foreground)">
                    {formatDate(u.createdAt, locale)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
