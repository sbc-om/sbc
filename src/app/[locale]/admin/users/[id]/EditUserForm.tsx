"use client";

import { useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import type { Role, User } from "@/lib/db/types";
import { updateUserAdminAction, deleteUserAction } from "@/app/[locale]/admin/users/actions";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
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
  const [phone, setPhone] = useState<string>(user.phone ?? "");
  const [isVerified, setIsVerified] = useState<boolean>(user.isVerified ?? false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(user.isPhoneVerified ?? false);
  const [isActive, setIsActive] = useState<boolean>(user.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("role", role);
      formData.set("isVerified", String(isVerified));
      formData.set("isPhoneVerified", String(isPhoneVerified));
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

  const onDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteUserAction(locale, user.id);
      router.push(`/${locale}/admin/users`);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : (locale === "ar" ? "تعذر حذف المستخدم" : "Could not delete user"));
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
            <PhoneInput name="phone" value={phone} onChange={setPhone} required />
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Role */}
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">{locale === "ar" ? "الدور" : "Role"}</span>
            <RoleSelect
              value={role}
              onChange={(value) => setRole(value)}
              placeholder={locale === "ar" ? "اختر الدور" : "Select role"}
              locale={locale}
            />
          </div>

          {/* Phone Verification (WhatsApp OTP) */}
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              {locale === "ar" ? "توثيق الهاتف" : "Phone Verified"}
            </span>
            <button
              type="button"
              onClick={() => setIsPhoneVerified(!isPhoneVerified)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isPhoneVerified
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-(--muted)/50 text-(--muted-foreground)"
              }`}
            >
              {isPhoneVerified ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              )}
              {isPhoneVerified 
                ? (locale === "ar" ? "موثق" : "Verified") 
                : (locale === "ar" ? "غير موثق" : "Not Verified")}
            </button>
          </div>

          {/* Blue Check Badge */}
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              {locale === "ar" ? "العلامة الزرقاء" : "Blue Badge"}
            </span>
            <button
              type="button"
              onClick={() => setIsVerified(!isVerified)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isVerified
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-(--muted)/50 text-(--muted-foreground)"
              }`}
            >
              {isVerified ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {isVerified 
                ? (locale === "ar" ? "مفعل" : "Enabled") 
                : (locale === "ar" ? "معطل" : "Disabled")}
            </button>
          </div>

          {/* Account Status */}
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              {locale === "ar" ? "حالة الحساب" : "Account Status"}
            </span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {isActive ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
              {isActive 
                ? (locale === "ar" ? "نشط" : "Active") 
                : (locale === "ar" ? "معطل" : "Suspended")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || deleting}>
          {saving
            ? locale === "ar"
              ? "جارٍ الحفظ..."
              : "Saving..."
            : locale === "ar"
              ? "حفظ التغييرات"
              : "Save changes"}
        </Button>
        
        <Button
          type="button"
          variant="destructive"
          disabled={saving || deleting}
          onClick={() => setShowDeleteConfirm(true)}
        >
          {locale === "ar" ? "حذف المستخدم" : "Delete User"}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="sbc-card rounded-2xl p-6 max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              {locale === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
            </h3>
            <p className="text-sm text-(--muted-foreground)">
              {locale === "ar" 
                ? `هل أنت متأكد من حذف "${user.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${user.fullName}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting
                  ? (locale === "ar" ? "جارٍ الحذف..." : "Deleting...")
                  : (locale === "ar" ? "نعم، احذف" : "Yes, Delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
