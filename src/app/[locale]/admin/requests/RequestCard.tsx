"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMap,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineRocketLaunch,
} from "react-icons/hi2";

import type { BusinessRequest } from "@/lib/db/businessRequests";
import type { UserListItem } from "@/lib/db/users";
import type { Category } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useModalDialogs } from "@/components/ui/useModalDialogs";
import {
  respondToRequestAction,
  convertRequestToBusinessAction,
  deleteRequestAction,
} from "./actions";

/* ------------------------------------------------------------------ */
/*  Contact row                                                        */
/* ------------------------------------------------------------------ */

function ContactRow({
  icon: Icon,
  value,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  href?: string;
  color: string;
}) {
  const content = (
    <div className="flex items-center gap-3 text-sm group/row">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate font-medium group-hover/row:text-accent transition-colors">
        {value}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RequestCard({
  request,
  user,
  agent,
  category,
  locale,
}: {
  request: BusinessRequest;
  user?: UserListItem;
  agent?: UserListItem;
  category?: Category | null;
  locale: Locale;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog } = useModalDialogs();
  const [expanded, setExpanded] = useState(
    request.status === "pending" || request.status === "revision_requested",
  );
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleRespond = async (
    status: "approved" | "rejected" | "revision_requested",
  ) => {
    if (!response.trim()) {
      toast({
        message: ar ? "الرجاء إدخال رد" : "Please enter a response",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await respondToRequestAction(locale, request.id, status, response);
      setShowResponse(false);
      setResponse("");
      router.refresh();
    } catch {
      toast({
        message: ar ? "فشل إرسال الرد" : "Failed to send response",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    const accepted = await confirm({
      title: ar ? "تحويل الطلب إلى نشاط" : "Convert Request to Business",
      message: ar
        ? "سيتم إنشاء النشاط التجاري من بيانات هذا الطلب ونقلك مباشرة إلى قائمة الأنشطة. هل تريد المتابعة؟"
        : "This will create a business from the request details and take you to the businesses list. Do you want to continue?",
      confirmText: ar ? "تحويل الآن" : "Convert Now",
      cancelText: ar ? "إلغاء" : "Cancel",
      variant: "primary",
    });

    if (!accepted) return;

    setConverting(true);
    try {
      await convertRequestToBusinessAction(locale, request.id);
      router.push(`/${locale}/admin/businesses`);
    } catch (err) {
      toast({
        message: ar
          ? `فشل التحويل: ${err}`
          : `Conversion failed: ${err}`,
        variant: "error",
      });
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    const accepted = await confirm({
      title: ar ? "حذف الطلب" : "Delete Request",
      message: ar
        ? "سيتم حذف هذا الطلب نهائيًا ولا يمكن التراجع عن العملية. هل تريد المتابعة؟"
        : "This request will be permanently deleted and cannot be recovered. Do you want to continue?",
      confirmText: ar ? "حذف" : "Delete",
      cancelText: ar ? "إلغاء" : "Cancel",
      variant: "destructive",
    });

    if (!accepted) return;

    try {
      await deleteRequestAction(locale, request.id);
      router.refresh();
    } catch {
      toast({
        message: ar ? "فشل الحذف" : "Delete failed",
        variant: "error",
      });
    }
  };

  /* ---- Status config ---- */
  const statusCfg = {
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      dot: "bg-yellow-500",
      Icon: HiOutlineClock,
      label: ar ? "معلقة" : "Pending",
    },
    approved: {
      bg: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      dot: "bg-green-500",
      Icon: HiOutlineCheckCircle,
      label: ar ? "موافق عليها" : "Approved",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      dot: "bg-red-500",
      Icon: HiOutlineXCircle,
      label: ar ? "مرفوضة" : "Rejected",
    },
    revision_requested: {
      bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      dot: "bg-orange-500",
      Icon: HiOutlineExclamationTriangle,
      label: ar ? "بانتظار تعديل" : "Revision Requested",
    },
  };

  const st = statusCfg[request.status];
  const StatusIcon = st.Icon;

  const heroImage = request.coverUrl || request.bannerUrl;
  const hasLocation = request.latitude != null && request.longitude != null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${request.latitude},${request.longitude}`
    : null;
  const categoryLabel = category
    ? ar
      ? category.name.ar
      : category.name.en
    : request.category;
  const dateStr = new Date(request.createdAt).toLocaleDateString(
    ar ? "ar-OM" : "en-OM",
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <>
      {dialog}
      <article
      className="overflow-hidden rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
      style={{
        background: "var(--business-card-bg, var(--card))",
        border: "1px solid var(--surface-border, var(--border))",
      }}
    >
      {/* ══════ Hero banner/cover ══════ */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-linear-to-br from-accent/10 to-accent-2/10">
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl font-black bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-15">
              {request.name.en.charAt(0)}
            </div>
          </div>
        )}

        {/* Status badge on hero */}
        <div className="absolute top-3 end-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md ${st.bg}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {st.label}
          </span>
        </div>

        {/* Date on hero */}
        <div className="absolute bottom-3 end-3 text-[11px] text-white/80 backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded-md">
          {dateStr}
        </div>
      </div>

      {/* ══════ Content below hero ══════ */}
      <div className="relative px-5 pb-5">
        {/* Logo + Name row overlapping hero */}
        <div className="flex items-center gap-3 -mt-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg"
            style={{
              background: "var(--background)",
              border: "2.5px solid var(--surface-border, var(--border))",
            }}
          >
            {request.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-xl font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent">
                {request.name.en.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-bold truncate leading-tight">
                  {request.name.en}
                </h3>
                {request.name.ar && request.name.ar !== request.name.en && (
                  <p className="text-sm text-(--muted-foreground) truncate" dir="rtl">
                    {request.name.ar}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-(--chip-bg) transition-colors text-(--muted-foreground)"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <HiOutlineChevronUp className="h-4 w-4" />
                ) : (
                  <HiOutlineChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2">
          {/* Category + City row */}
          <div className="flex items-center gap-3 text-xs text-(--muted-foreground) flex-wrap">
            {categoryLabel && (
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {categoryLabel}
              </span>
            )}
            {request.city && (
              <span className="inline-flex items-center gap-1">
                <HiOutlineMapPin className="h-3 w-3" />
                {request.city}
              </span>
            )}
            {user && (
              <span className="inline-flex items-center gap-1">
                <HiOutlineUser className="h-3 w-3" />
                {user.fullName || user.email}
              </span>
            )}
          </div>

          {/* Tags */}
          {request.tags && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {request.tags.split(",").map((t) => (
                <span
                  key={t.trim()}
                  className="inline-block rounded-full bg-(--chip-bg) px-2.5 py-0.5 text-[11px] font-medium"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ══════ Expanded details ══════ */}
        {expanded && (
          <div className="mt-4 space-y-5">
            {/* ── Description English ── */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-2">
                Description — English
              </div>
              {request.descEn || request.description ? (
                <div className="text-sm whitespace-pre-line rounded-xl bg-(--chip-bg)/50 p-4 leading-relaxed">
                  {request.descEn || request.description}
                </div>
              ) : (
                <p className="text-sm italic text-(--muted-foreground)">
                  {ar ? "— غير مُدخل" : "— not provided"}
                </p>
              )}
            </div>

            {/* ── Description Arabic ── */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-2">
                الوصف — العربية
              </div>
              {request.descAr ? (
                <div className="text-sm whitespace-pre-line rounded-xl bg-(--chip-bg)/50 p-4 leading-relaxed" dir="rtl">
                  {request.descAr}
                </div>
              ) : (
                <p className="text-sm italic text-(--muted-foreground)">
                  {ar ? "— غير مُدخل" : "— not provided"}
                </p>
              )}
            </div>

            {/* ── Contact ── */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-3">
                {ar ? "التواصل" : "Contact"}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {request.phone && (
                  <ContactRow
                    icon={HiOutlinePhone}
                    value={request.phone}
                    href={`tel:${request.phone}`}
                    color="bg-green-500/15 text-green-600 dark:text-green-400"
                  />
                )}
                {request.contactPhone && request.contactPhone !== request.phone && (
                  <ContactRow
                    icon={HiOutlinePhone}
                    value={request.contactPhone}
                    href={`tel:${request.contactPhone}`}
                    color="bg-green-500/15 text-green-600 dark:text-green-400"
                  />
                )}
                {request.email && (
                  <ContactRow
                    icon={HiOutlineEnvelope}
                    value={request.email}
                    href={`mailto:${request.email}`}
                    color="bg-red-500/15 text-red-600 dark:text-red-400"
                  />
                )}
                {request.contactEmail && request.contactEmail !== request.email && (
                  <ContactRow
                    icon={HiOutlineEnvelope}
                    value={request.contactEmail}
                    href={`mailto:${request.contactEmail}`}
                    color="bg-red-500/15 text-red-600 dark:text-red-400"
                  />
                )}
                {request.website && (
                  <ContactRow
                    icon={HiOutlineGlobeAlt}
                    value={request.website.replace(/^https?:\/\//, "")}
                    href={request.website}
                    color="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  />
                )}
                {!request.phone && !request.email && !request.website && (
                  <p className="text-sm italic text-(--muted-foreground)">
                    {ar ? "لا توجد بيانات تواصل" : "No contact info"}
                  </p>
                )}
              </div>
            </div>

            {/* ── Location ── */}
            {(request.address || hasLocation) && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-2">
                  {ar ? "الموقع" : "Location"}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
                  {request.address && (
                    <span>
                      <span className="text-(--muted-foreground)">{ar ? "العنوان:" : "Address:"} </span>
                      <span className="font-medium">{request.address}</span>
                    </span>
                  )}
                  {hasLocation && (
                    <a
                      href={mapsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                    >
                      <HiOutlineMap className="h-3.5 w-3.5" />
                      {request.latitude!.toFixed(5)}, {request.longitude!.toFixed(5)}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Media thumbnails ── */}
            {(request.logoUrl || request.coverUrl || request.bannerUrl) && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-2">
                  {ar ? "الوسائط" : "Media"}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {request.logoUrl && (
                    <a href={request.logoUrl} target="_blank" rel="noopener noreferrer" className="group/media">
                      <div className="text-[9px] font-semibold uppercase text-(--muted-foreground) mb-0.5 text-center">
                        {ar ? "شعار" : "Logo"}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.logoUrl}
                        alt="Logo"
                        className="h-16 w-16 rounded-lg object-cover ring-1 ring-(--border) group-hover/media:ring-accent transition-all"
                      />
                    </a>
                  )}
                  {request.coverUrl && (
                    <a href={request.coverUrl} target="_blank" rel="noopener noreferrer" className="group/media">
                      <div className="text-[9px] font-semibold uppercase text-(--muted-foreground) mb-0.5 text-center">
                        {ar ? "غلاف" : "Cover"}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.coverUrl}
                        alt="Cover"
                        className="h-16 w-24 rounded-lg object-cover ring-1 ring-(--border) group-hover/media:ring-accent transition-all"
                      />
                    </a>
                  )}
                  {request.bannerUrl && (
                    <a href={request.bannerUrl} target="_blank" rel="noopener noreferrer" className="group/media">
                      <div className="text-[9px] font-semibold uppercase text-(--muted-foreground) mb-0.5 text-center">
                        {ar ? "بانر" : "Banner"}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.bannerUrl}
                        alt="Banner"
                        className="h-16 w-24 rounded-lg object-cover ring-1 ring-(--border) group-hover/media:ring-accent transition-all"
                      />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Gallery ── */}
            {request.galleryUrls && request.galleryUrls.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-2">
                  {ar ? `المعرض (${request.galleryUrls.length})` : `Gallery (${request.galleryUrls.length})`}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {request.galleryUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Gallery ${i + 1}`}
                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-(--border) hover:ring-accent hover:scale-105 transition-all"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Requester ── */}
            {(agent || (request.updatedAt !== request.createdAt)) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-(--muted-foreground)">
                {agent && (
                  <span>
                    {ar ? "الوكيل:" : "Agent:"}{" "}
                    <span className="font-medium text-(--foreground)">{agent.fullName || agent.email}</span>
                  </span>
                )}
                {request.updatedAt !== request.createdAt && (
                  <span>
                    {ar ? "آخر تحديث:" : "Updated:"}{" "}
                    <span className="font-medium text-(--foreground)">
                      {new Date(request.updatedAt).toLocaleDateString(
                        ar ? "ar-OM" : "en-OM",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* ── Admin Response (existing) ── */}
            {(request.adminResponse || request.adminNotes) && (
              <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                  {ar ? "رد الإدارة" : "Admin Response"}
                </div>
                <p className="text-sm whitespace-pre-line text-amber-900 dark:text-amber-200">
                  {request.adminResponse || request.adminNotes}
                </p>
                {request.respondedAt && (
                  <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    {new Date(request.respondedAt).toLocaleString(
                      ar ? "ar-OM" : "en-OM",
                      { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Response Form ── */}
            {showResponse &&
              (request.status === "pending" ||
                request.status === "revision_requested") && (
                <div className="mt-5 p-4 rounded-xl bg-(--chip-bg)/50">
                  <label className="block text-sm font-semibold mb-2">
                    {ar ? "رد على الطلب" : "Response to Request"}
                  </label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={
                      ar
                        ? "اكتب ملاحظاتك وحدد البنود التي تحتاج تعديل..."
                        : "Write your notes and specify which fields need revision..."
                    }
                    rows={4}
                    className="mb-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleRespond("approved")}
                      disabled={loading}
                      variant="primary"
                      size="sm"
                    >
                      {loading
                        ? ar
                          ? "جاري الموافقة..."
                          : "Approving..."
                        : ar
                          ? "موافقة"
                          : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleRespond("revision_requested")}
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                    >
                      {loading
                        ? ar
                          ? "جاري الإرسال..."
                          : "Sending..."
                        : ar
                          ? "طلب تعديل"
                          : "Request Revision"}
                    </Button>
                    <Button
                      onClick={() => handleRespond("rejected")}
                      disabled={loading}
                      variant="secondary"
                      size="sm"
                    >
                      {loading
                        ? ar
                          ? "جاري الرفض..."
                          : "Rejecting..."
                        : ar
                          ? "رفض"
                          : "Reject"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowResponse(false);
                        setResponse("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}

            {/* ── Action buttons ── */}
            <div className="mt-5 flex flex-wrap items-center gap-2 pt-4">
              {(request.status === "pending" ||
                request.status === "revision_requested") && (
                <>
                  <Button
                    onClick={() => setShowResponse(!showResponse)}
                    variant="secondary"
                    size="sm"
                  >
                    <HiOutlineChatBubbleLeftRight className="h-4 w-4 me-1.5" />
                    {showResponse
                      ? ar
                        ? "إخفاء"
                        : "Hide"
                      : ar
                        ? "الرد"
                        : "Respond"}
                  </Button>
                  <Button
                    onClick={handleConvert}
                    disabled={converting}
                    variant="primary"
                    size="sm"
                  >
                    <HiOutlineRocketLaunch className="h-4 w-4 me-1.5" />
                    {converting
                      ? ar
                        ? "جاري التحويل..."
                        : "Converting..."
                      : ar
                        ? "تحويل إلى نشاط"
                        : "Convert to Business"}
                  </Button>
                </>
              )}
              {request.status === "approved" && (
                <Button
                  onClick={handleConvert}
                  disabled={converting}
                  variant="primary"
                  size="sm"
                >
                  <HiOutlineRocketLaunch className="h-4 w-4 me-1.5" />
                  {converting
                    ? ar
                      ? "جاري التحويل..."
                      : "Converting..."
                    : ar
                      ? "تحويل إلى نشاط"
                      : "Convert to Business"}
                </Button>
              )}
              <div className="flex-1" />
              <Button onClick={handleDelete} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <HiOutlineTrash className="h-4 w-4 me-1" />
                {ar ? "حذف" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </div>
      </article>
    </>
  );
}
