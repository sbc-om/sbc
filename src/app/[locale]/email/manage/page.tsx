import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function EmailManagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const ar = locale === "ar";

  await getProgramSubscriptionByUser(user.id);
  const active = await isProgramSubscriptionActive(user.id);

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "البريد المؤسسي" : "Business Email"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "أنشئ حسابات بريد إلكتروني باسم نطاقك الخاص."
              : "Create email accounts with your own domain."}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {dict.nav.dashboard}
        </Link>
      </div>

      {!active ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">
            {ar ? "الاشتراك غير مفعل" : "Subscription not active"}
          </div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "لاستخدام البريد المؤسسي، اشترِ باقة البريد الإلكتروني من المتجر."
              : "To use Business Email, purchase an email package from the store."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/store?q=email`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "شراء اشتراك" : "Buy subscription"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          {/* Domain setup */}
          <div className="sbc-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              {ar ? "إعداد النطاق (Domain)" : "Domain Setup"}
            </h2>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "أضف نطاقك الخاص وقم بتوجيه سجلات DNS لتفعيل البريد المؤسسي."
                : "Add your custom domain and point DNS records to activate business email."}
            </p>

            <div className="mt-4 sbc-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">
                {ar ? "سجلات DNS المطلوبة" : "Required DNS Records"}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-(--muted-foreground) border-b border-(--surface-border)">
                      <th className="text-start pb-2 pe-4">{ar ? "النوع" : "Type"}</th>
                      <th className="text-start pb-2 pe-4">{ar ? "الاسم" : "Name"}</th>
                      <th className="text-start pb-2">{ar ? "القيمة" : "Value"}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-(--surface-border)/50">
                      <td className="py-2 pe-4">MX</td>
                      <td className="py-2 pe-4">@</td>
                      <td className="py-2">mail.sbc.om (Priority: 10)</td>
                    </tr>
                    <tr className="border-b border-(--surface-border)/50">
                      <td className="py-2 pe-4">TXT</td>
                      <td className="py-2 pe-4">@</td>
                      <td className="py-2">v=spf1 include:sbc.om ~all</td>
                    </tr>
                    <tr>
                      <td className="py-2 pe-4">CNAME</td>
                      <td className="py-2 pe-4">_dkim</td>
                      <td className="py-2">dkim.sbc.om</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-3 text-xs text-(--muted-foreground)">
              {ar
                ? "بعد إضافة السجلات، اتصل بالدعم الفني للتحقق من إعدادات النطاق."
                : "After adding the records, contact support to verify your domain settings."}
            </p>
          </div>

          {/* Email accounts section */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">
                {ar ? "حسابات البريد" : "Email Accounts"}
              </h2>
              <button
                disabled
                className={buttonVariants({ variant: "primary", size: "sm" }) + " opacity-60"}
              >
                {ar ? "إضافة حساب" : "Add Account"}
              </button>
            </div>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "ستتمكن من إنشاء حسابات بريد إلكتروني مثل info@yourdomain.com لفريقك بعد التحقق من النطاق."
                : "You'll be able to create email accounts like info@yourdomain.com for your team after domain verification."}
            </p>

            <div className="mt-6 rounded-xl border-2 border-dashed border-(--surface-border) p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/12">
                <svg className="h-6 w-6 text-orange-600 dark:text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <p className="text-sm font-medium">
                {ar ? "لم يتم إعداد نطاق بعد" : "No domain configured yet"}
              </p>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                {ar
                  ? "أضف نطاقك وتحقق من الإعدادات لبدء إنشاء حسابات البريد."
                  : "Add your domain and verify settings to start creating email accounts."}
              </p>
            </div>
          </div>

          {/* Webmail access */}
          <div className="sbc-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              {ar ? "الوصول إلى البريد" : "Webmail Access"}
            </h2>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "يمكن لمستخدمي البريد الدخول إلى صندوق الوارد عبر بوابة الويب أو إعداد IMAP/SMTP في أي تطبيق بريد."
                : "Email users can access their inbox via webmail or configure IMAP/SMTP in any email client."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="sbc-chip rounded-full px-3 py-1 text-xs">
                <span className="text-(--muted-foreground)">IMAP: </span>
                <span className="font-semibold font-mono">imap.sbc.om:993</span>
              </div>
              <div className="sbc-chip rounded-full px-3 py-1 text-xs">
                <span className="text-(--muted-foreground)">SMTP: </span>
                <span className="font-semibold font-mono">smtp.sbc.om:587</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
}
