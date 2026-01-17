"use client";

import { useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { Role, User } from "@/lib/db/types";
import { updateUserAdminAction } from "@/app/[locale]/admin/users/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RoleSelect } from "@/components/ui/RoleSelect";
import { Button } from "@/components/ui/Button";

export function EditUserForm({
  locale,
  user,
}: {
  locale: Locale;
  user: User;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [isVerified, setIsVerified] = useState<boolean>(user.isVerified ?? false);
  const [isActive, setIsActive] = useState<boolean>(user.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("role", role);
      formData.set("isVerified", String(isVerified));
      formData.set("isActive", String(isActive));

      await updateUserAdminAction(locale, user.id, formData);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError(locale === "ar" ? "تعذر حفظ التغييرات" : "Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-6">
      <div className="sbc-card rounded-2xl p-6 grid gap-5">
        <div>
          <h2 className="text-lg font-semibold">{locale === "ar" ? "بيانات الحساب" : "Account details"}</h2>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "تعديل بيانات المستخدم الأساسية" : "Update the user's primary information."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "الاسم الكامل" : "Full name"}</span>
            <Input name="fullName" defaultValue={user.fullName} required />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span>
            <Input name="email" type="email" defaultValue={user.email} required />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "رقم الهاتف" : "Phone"}</span>
            <Input name="phone" defaultValue={user.phone} required />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "اسم العرض" : "Display name"}</span>
            <Input name="displayName" defaultValue={user.displayName ?? ""} />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "نبذة" : "Bio"}</span>
          <Textarea name="bio" defaultValue={user.bio ?? ""} rows={4} />
        </label>
      </div>

      <div className="sbc-card rounded-2xl p-6 grid gap-5">
        <div>
          <h2 className="text-lg font-semibold">{locale === "ar" ? "إدارة الصلاحيات" : "Permissions"}</h2>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "اضبط الدور والتوثيق والحالة." : "Adjust role, verification, and status."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "الدور" : "Role"}</span>
            <RoleSelect
              value={role}
              onChange={(value) => setRole(value)}
              placeholder={locale === "ar" ? "اختر الدور" : "Select role"}
              locale={locale}
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className={isVerified ? "text-blue-600" : "text-(--muted-foreground)"}>
              {isVerified ? (locale === "ar" ? "موثق" : "Verified") : (locale === "ar" ? "غير موثق" : "Unverified")}
            </span>
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            <span className={isActive ? "text-emerald-600" : "text-(--muted-foreground)"}>
              {isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "غير نشط" : "Inactive")}
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? locale === "ar"
              ? "جارٍ الحفظ..."
              : "Saving..."
            : locale === "ar"
              ? "حفظ التغييرات"
              : "Save changes"}
        </Button>
        {success ? (
          <span className="text-sm text-emerald-600">
            {locale === "ar" ? "تم حفظ التغييرات" : "Changes saved"}
          </span>
        ) : null}
        {error ? (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        ) : null}
      </div>
    </form>
  );
}
