import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getProgramSubscriptionById } from "@/lib/db/subscriptions";
import { query } from "@/lib/db/postgres";
import SubscriptionEditForm from "@/components/admin/SubscriptionEditForm";

export const runtime = "nodejs";

async function getSubscriptionWithUser(id: string) {
  const result = await query(
    `SELECT ps.*, u.email as user_email, COALESCE(u.display_name, u.email) as user_name, u.avatar_url as user_avatar, u.phone as user_phone
     FROM program_subscriptions ps
     LEFT JOIN users u ON ps.user_id = u.id
     WHERE ps.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: (row.user_name || "") as string,
    userEmail: (row.user_email || "") as string,
    userAvatar: (row.user_avatar || null) as string | null,
    userPhone: (row.user_phone || "") as string,
    productId: row.product_id as string,
    productSlug: row.product_slug as string,
    program: row.program as string,
    plan: (row.plan || row.product_slug) as string,
    startDate: row.start_date?.toISOString() || new Date().toISOString(),
    endDate: row.end_date?.toISOString() || new Date().toISOString(),
    isActive: row.is_active ?? true,
    paymentId: (row.payment_id || undefined) as string | undefined,
    paymentMethod: (row.payment_method || undefined) as string | undefined,
    amount: parseFloat(row.amount) || 0,
    currency: (row.currency || "OMR") as string,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export default async function AdminSubscriptionEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale as Locale);

  const subscription = await getSubscriptionWithUser(id);
  if (!subscription) notFound();

  return (
    <AppPage>
      <SubscriptionEditForm subscription={subscription} locale={locale} />
    </AppPage>
  );
}
