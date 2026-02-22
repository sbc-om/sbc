import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireAgent } from "@/lib/auth/requireUser";
import { isAgentClient, listAgentClients } from "@/lib/db/agents";
import { getOwnerIdsWithBusiness } from "@/lib/db/businesses";
import { getBusinessRequestStatusByUserIds } from "@/lib/db/businessRequests";
import { listActiveProducts } from "@/lib/db/products";
import {
  listActiveProgramSubscriptionsForUsers,
  listProgramSubscriptionsByUser,
} from "@/lib/db/subscriptions";
import { getUserById } from "@/lib/db/users";
import { getUserWallet } from "@/lib/db/wallet";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import ClientQuickActions from "./ClientQuickActions";
import ClientActivationManager from "./ClientActivationManager";

export const runtime = "nodejs";

export default async function AgentClientDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; clientId: string }>;
  searchParams?: Promise<{ updated?: string }>;
}) {
  const { locale, clientId } = await params;
  const { updated } = (await searchParams) ?? {};
  if (!isLocale(locale)) notFound();

  const user = await requireAgent(locale as Locale);
  const allowed = await isAgentClient(user.id, clientId);
  if (!allowed) notFound();

  const [client, wallet, myClients, ownersWithBiz, requestStatusMap, activeMap, allSubscriptions, products] =
    await Promise.all([
      getUserById(clientId),
      getUserWallet(clientId),
      listAgentClients(user.id),
      getOwnerIdsWithBusiness([clientId]),
      getBusinessRequestStatusByUserIds([clientId]),
      listActiveProgramSubscriptionsForUsers([clientId]),
      listProgramSubscriptionsByUser(clientId),
      listActiveProducts(),
    ]);

  if (!client) notFound();

  const ar = locale === "ar";
  const clientRow = myClients.find((c) => c.clientUserId === clientId);
  const activeSubscriptions = activeMap.get(clientId) || [];
  const hasBusiness = ownersWithBiz.has(clientId);
  const requestStatus = requestStatusMap.get(clientId) || null;

  const t = {
    title: ar ? "تفاصيل العميل" : "Client Details",
    back: ar ? "العودة إلى العملاء" : "Back to clients",
    profile: ar ? "الملف الشخصي" : "Profile",
    wallet: ar ? "المحفظة" : "Wallet",
    businessStatus: ar ? "حالة النشاط التجاري" : "Business Status",
    assignedAt: ar ? "تاريخ الإسناد" : "Assigned At",
    phone: ar ? "الهاتف" : "Phone",
    email: ar ? "البريد" : "Email",
    role: ar ? "الدور" : "Role",
    phoneVerification: ar ? "تفعيل الهاتف" : "Phone Verification",
    verified: ar ? "مفعّل" : "Verified",
    notVerified: ar ? "غير مفعّل" : "Not Verified",
    activeProducts: ar ? "المنتجات المفعلة" : "Active Products",
    noActiveProducts: ar ? "لا توجد منتجات مفعلة" : "No active products",
    subscriptionHistory: ar ? "سجل الاشتراكات" : "Subscriptions History",
    noHistory: ar ? "لا يوجد سجل اشتراكات" : "No subscription history",
    expiresAt: ar ? "ينتهي في" : "Expires",
    startedAt: ar ? "بدأ في" : "Started",
    noBusiness: ar ? "بدون نشاط" : "No business",
    hasBusiness: ar ? "لديه نشاط" : "Has business",
    requestPending: ar ? "طلب قيد المراجعة" : "Request pending",
    requestRejected: ar ? "طلب مرفوض" : "Request rejected",
  };

  const businessBadge = hasBusiness || requestStatus === "approved"
    ? { label: t.hasBusiness, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" }
    : requestStatus === "pending"
      ? { label: t.requestPending, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" }
      : requestStatus === "rejected"
        ? { label: t.requestRejected, className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" }
        : { label: t.noBusiness, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };

  const walletHighlight = updated === "wallet"
    ? "ring-2 ring-blue-400/60 animate-pulse"
    : "";
  const productsHighlight = updated === "products"
    ? "ring-2 ring-emerald-400/60 animate-pulse"
    : "";

  return (
    <AppPage>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {(client.displayName || client.fullName || client.email)}
          </p>
        </div>
        <Link href={`/${locale}/agent/clients`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <HiOutlineArrowLeft className="me-1 h-4 w-4" />
          {t.back}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`sbc-card rounded-2xl p-4 transition-all ${walletHighlight}`}>
          <div className="text-xs text-(--muted-foreground)">{t.wallet}</div>
          <div className="mt-2 text-2xl font-semibold">{(wallet ? Number(wallet.balance) : 0).toFixed(3)} OMR</div>
        </div>
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{t.businessStatus}</div>
          <div className="mt-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${businessBadge.className}`}>
              {businessBadge.label}
            </span>
          </div>
        </div>
        <div className={`sbc-card rounded-2xl p-4 transition-all ${productsHighlight}`}>
          <div className="text-xs text-(--muted-foreground)">{t.activeProducts}</div>
          <div className="mt-2 text-2xl font-semibold">{activeSubscriptions.length}</div>
        </div>
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{t.assignedAt}</div>
          <div className="mt-2 text-sm font-medium">
            {clientRow?.createdAt ? new Date(clientRow.createdAt).toLocaleString(locale) : "-"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="sbc-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold">{t.profile}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-xs text-(--muted-foreground)">{t.email}</div>
              <div className="font-medium">{client.email}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-foreground)">{t.phone}</div>
              <div className="font-medium">{client.phone || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-foreground)">{t.role}</div>
              <div className="font-medium">{client.role}</div>
            </div>
            <div>
              <div className="text-xs text-(--muted-foreground)">{t.phoneVerification}</div>
              <div className="font-medium">{client.isPhoneVerified ? t.verified : t.notVerified}</div>
            </div>
          </div>
        </div>

        <div className="sbc-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold">{t.activeProducts}</h2>
          {activeSubscriptions.length === 0 ? (
            <p className="mt-3 text-sm text-(--muted-foreground)">{t.noActiveProducts}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {activeSubscriptions.map((sub) => (
                <div key={sub.id} className="rounded-xl border border-(--surface-border) p-3">
                  <div className="font-medium">{ar ? sub.productNameAr : sub.productNameEn}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {t.startedAt}: {new Date(sub.startDate).toLocaleDateString(locale)}
                  </div>
                  <div className="text-xs text-(--muted-foreground)">
                    {t.expiresAt}: {new Date(sub.endDate).toLocaleDateString(locale)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <ClientActivationManager
          locale={locale as Locale}
          clientId={clientId}
          initialName={client.displayName || client.fullName || client.email}
          initialPhone={client.phone || ""}
          initialEmail={client.email || ""}
          isPhoneVerified={!!client.isPhoneVerified}
        />
      </div>

      <div className="mt-6">
        <ClientQuickActions
          locale={locale as Locale}
          clientId={clientId}
          clientWalletBalance={wallet ? Number(wallet.balance) : 0}
          isPhoneVerified={!!client.isPhoneVerified}
          products={products.map((p) => ({
            slug: p.slug,
            name: ar ? p.name.ar : p.name.en,
            price: p.price,
            currency: p.currency,
          }))}
        />
      </div>

      <div className="mt-6 sbc-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold">{t.subscriptionHistory}</h2>
        {allSubscriptions.length === 0 ? (
          <p className="mt-3 text-sm text-(--muted-foreground)">{t.noHistory}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-(--surface-border) text-xs text-(--muted-foreground)">
                  <th className="px-2 py-2 text-start">Product</th>
                  <th className="px-2 py-2 text-start">Program</th>
                  <th className="px-2 py-2 text-start">Status</th>
                  <th className="px-2 py-2 text-start">{t.startedAt}</th>
                  <th className="px-2 py-2 text-start">{t.expiresAt}</th>
                </tr>
              </thead>
              <tbody>
                {allSubscriptions.slice(0, 20).map((sub) => (
                  <tr key={sub.id} className="border-b border-(--surface-border)">
                    <td className="px-2 py-2">{sub.productSlug}</td>
                    <td className="px-2 py-2">{sub.program}</td>
                    <td className="px-2 py-2">
                      {sub.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-2 py-2">{new Date(sub.startDate).toLocaleDateString(locale)}</td>
                    <td className="px-2 py-2">{new Date(sub.endDate).toLocaleDateString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppPage>
  );
}
