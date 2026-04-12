"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineMap,
  HiOutlinePhoto,
} from "react-icons/hi2";

import type { BusinessRequest } from "@/lib/db/businessRequests";
import type { UserListItem } from "@/lib/db/users";
import type { Category } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import {
  respondToRequestAction,
  convertRequestToBusinessAction,
  deleteRequestAction,
} from "./actions";

/* ------------------------------------------------------------------ */
/*  Tiny helpers                                                       */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  missing,
  href,
}: {
  label: string;
  value?: string | null;
  missing?: string;
  href?: string;
}) {
  if (!value)
    return missing ? (
      <div className="flex items-start gap-2 text-sm">
        <span className="text-(--muted-foreground) shrink-0">{label}</span>
        <span className="italic text-amber-600 dark:text-amber-400">{missing}</span>
      </div>
    ) : null;

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-(--muted-foreground) shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="font-medium break-all">{value}</span>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-(--muted-foreground)" />
      <h4 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
        {title}
      </h4>
    </div>
  );
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
    if (
      !confirm(
        ar
          ? "هل تريد تحويل هذا الطلب إلى نشاط تجاري؟"
          : "Convert this request to a business?",
      )
    )
      return;

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
    if (!confirm(ar ? "هل تريد حذف هذا الطلب؟" : "Delete this request?"))
      return;

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

  /* ---- Status badge styles ---- */
  const statusCfg = {
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      Icon: HiOutlineClock,
      label: ar ? "معلقة" : "Pending",
    },
    approved: {
      bg: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      Icon: HiOutlineCheckCircle,
      label: ar ? "موافق عليها" : "Approved",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      Icon: HiOutlineXCircle,
      label: ar ? "مرفوضة" : "Rejected",
    },
    revision_requested: {
      bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      Icon: HiOutlineExclamationTriangle,
      label: ar ? "بانتظار تعديل" : "Revision Requested",
    },
  };

  const st = statusCfg[request.status];
  const StatusIcon = st.Icon;

  const hasLocation = request.latitude != null && request.longitude != null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${request.latitude},${request.longitude}`
    : null;

  const missingText = ar ? "— غير مُدخل" : "— not provided";

  return (
    <div className="sbc-card !border-0 overflow-hidden">
      {/* ====== Collapsed header (always visible) ====== */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-start hover:bg-(--chip-bg)/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-base font-semibold truncate">
            {request.name.en}
            {request.name.ar && request.name.ar !== request.name.en && (
              <span className="ms-2 text-(--muted-foreground) font-normal text-sm">
                ({request.name.ar})
              </span>
            )}
          </h3>
          <span
            className={`inline-flex items-center gap-1 shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${st.bg}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {st.label}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs text-(--muted-foreground)">
          <span>
            {new Date(request.createdAt).toLocaleDateString(
              ar ? "ar-OM" : "en-OM",
              { day: "numeric", month: "short", year: "numeric" },
            )}
          </span>
          {expanded ? (
            <HiOutlineChevronUp className="h-4 w-4" />
          ) : (
            <HiOutlineChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* ====== Expanded detail ====== */}
      {expanded && (
        <div className="border-t border-(--border) px-5 pb-5">
          <div className="grid gap-6 md:grid-cols-2 pt-5">
            {/* ── 1. Requester Info ── */}
            <section>
              <SectionHeader
                icon={HiOutlineUser}
                title={ar ? "معلومات مقدّم الطلب" : "Requester Info"}
              />
              <div className="space-y-1.5">
                <Field
                  label={ar ? "المستخدم:" : "User:"}
                  value={
                    user
                      ? `${user.fullName || ""} (${user.email})`.trim()
                      : undefined
                  }
                  missing={missingText}
                />
                {agent && (
                  <Field
                    label={ar ? "الوكيل:" : "Agent:"}
                    value={`${agent.fullName || ""} (${agent.email})`.trim()}
                  />
                )}
                <Field
                  label={ar ? "تاريخ الإرسال:" : "Submitted:"}
                  value={new Date(request.createdAt).toLocaleString(
                    ar ? "ar-OM" : "en-OM",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                />
                {request.updatedAt !== request.createdAt && (
                  <Field
                    label={ar ? "آخر تحديث:" : "Last updated:"}
                    value={new Date(request.updatedAt).toLocaleString(
                      ar ? "ar-OM" : "en-OM",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  />
                )}
              </div>
            </section>

            {/* ── 2. Business Identity ── */}
            <section>
              <SectionHeader
                icon={HiOutlineBuildingOffice2}
                title={ar ? "هوية النشاط" : "Business Identity"}
              />
              <div className="space-y-1.5">
                <Field
                  label={ar ? "الاسم (EN):" : "Name (EN):"}
                  value={request.name.en}
                  missing={missingText}
                />
                <Field
                  label={ar ? "الاسم (AR):" : "Name (AR):"}
                  value={request.name.ar}
                  missing={missingText}
                />
                <Field
                  label={ar ? "التصنيف:" : "Category:"}
                  value={
                    category
                      ? `${category.name.en} / ${category.name.ar}`
                      : request.category
                  }
                  missing={missingText}
                />
                {request.tags && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {request.tags.split(",").map((t) => (
                      <span
                        key={t.trim()}
                        className="inline-block rounded-full bg-(--chip-bg) px-2 py-0.5 text-xs"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {!request.tags && (
                  <Field label={ar ? "الوسوم:" : "Tags:"} missing={missingText} />
                )}
              </div>
            </section>

            {/* ── 3. Descriptions ── */}
            <section className="md:col-span-2">
              <SectionHeader
                icon={HiOutlineDocumentText}
                title={ar ? "الوصف" : "Description"}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-(--muted-foreground) mb-1">
                    English
                  </div>
                  {request.descEn || request.description ? (
                    <p className="text-sm whitespace-pre-line rounded-lg bg-(--chip-bg) p-3">
                      {request.descEn || request.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-amber-600 dark:text-amber-400">
                      {missingText}
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-(--muted-foreground) mb-1">
                    العربية
                  </div>
                  {request.descAr ? (
                    <p className="text-sm whitespace-pre-line rounded-lg bg-(--chip-bg) p-3" dir="rtl">
                      {request.descAr}
                    </p>
                  ) : (
                    <p className="text-sm italic text-amber-600 dark:text-amber-400">
                      {missingText}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── 4. Location ── */}
            <section>
              <SectionHeader
                icon={HiOutlineMapPin}
                title={ar ? "الموقع" : "Location"}
              />
              <div className="space-y-1.5">
                <Field
                  label={ar ? "المدينة:" : "City:"}
                  value={request.city}
                  missing={missingText}
                />
                <Field
                  label={ar ? "العنوان:" : "Address:"}
                  value={request.address}
                  missing={missingText}
                />
                {hasLocation ? (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-(--muted-foreground) shrink-0">
                      {ar ? "الإحداثيات:" : "Coordinates:"}
                    </span>
                    <a
                      href={mapsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                    >
                      <HiOutlineMap className="h-3.5 w-3.5" />
                      {request.latitude!.toFixed(6)}, {request.longitude!.toFixed(6)}
                    </a>
                  </div>
                ) : (
                  <Field
                    label={ar ? "الإحداثيات:" : "Coordinates:"}
                    missing={missingText}
                  />
                )}
              </div>
            </section>

            {/* ── 5. Contact Details ── */}
            <section>
              <SectionHeader
                icon={HiOutlinePhone}
                title={ar ? "بيانات التواصل" : "Contact Details"}
              />
              <div className="space-y-1.5">
                <Field
                  label={ar ? "الهاتف:" : "Phone:"}
                  value={request.phone}
                  missing={missingText}
                />
                <Field
                  label={ar ? "البريد:" : "Email:"}
                  value={request.email}
                  missing={missingText}
                />
                <Field
                  label={ar ? "الموقع الإلكتروني:" : "Website:"}
                  value={request.website}
                  href={request.website ?? undefined}
                  missing={missingText}
                />
                {(request.contactPhone || request.contactEmail) && (
                  <>
                    {request.contactPhone && (
                      <Field
                        label={ar ? "هاتف التواصل:" : "Contact Phone:"}
                        value={request.contactPhone}
                      />
                    )}
                    {request.contactEmail && (
                      <Field
                        label={ar ? "بريد التواصل:" : "Contact Email:"}
                        value={request.contactEmail}
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* ── 6. Media ── */}
          {(request.logoUrl || request.coverUrl || request.bannerUrl || (request.galleryUrls && request.galleryUrls.length > 0)) && (
            <div className="pt-5">
              <SectionHeader
                icon={HiOutlinePhoto}
                title={ar ? "الوسائط" : "Media"}
              />
              <div className="flex flex-wrap gap-3">
                {request.logoUrl && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-1">
                      {ar ? "الشعار" : "Logo"}
                    </div>
                    <a href={request.logoUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.logoUrl}
                        alt="Logo"
                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-(--border) hover:ring-accent transition-all"
                      />
                    </a>
                  </div>
                )}
                {request.coverUrl && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-1">
                      {ar ? "الغلاف" : "Cover"}
                    </div>
                    <a href={request.coverUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.coverUrl}
                        alt="Cover"
                        className="w-full h-24 rounded-xl object-cover ring-1 ring-(--border) hover:ring-accent transition-all"
                      />
                    </a>
                  </div>
                )}
                {request.bannerUrl && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-1">
                      {ar ? "البانر" : "Banner"}
                    </div>
                    <a href={request.bannerUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={request.bannerUrl}
                        alt="Banner"
                        className="w-full h-24 rounded-xl object-cover ring-1 ring-(--border) hover:ring-accent transition-all"
                      />
                    </a>
                  </div>
                )}
              </div>
              {request.galleryUrls && request.galleryUrls.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground) mb-1">
                    {ar ? `المعرض (${request.galleryUrls.length})` : `Gallery (${request.galleryUrls.length})`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.galleryUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Gallery ${i + 1}`}
                          className="h-16 w-16 rounded-lg object-cover ring-1 ring-(--border) hover:ring-accent transition-all"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Admin Response (existing) ── */}
          {(request.adminResponse || request.adminNotes) && (
            <div className="mt-6 p-4 bg-(--muted) rounded-xl">
              <div className="text-sm font-semibold mb-1">
                {ar ? "رد الإدارة:" : "Admin Response:"}
              </div>
              <p className="text-sm whitespace-pre-line">
                {request.adminResponse || request.adminNotes}
              </p>
              {request.respondedAt && (
                <div className="mt-2 text-xs text-(--muted-foreground)">
                  {ar ? "تم الرد في:" : "Responded:"}{" "}
                  {new Date(request.respondedAt).toLocaleString(
                    ar ? "ar-OM" : "en-OM",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Response Form ── */}
          {showResponse &&
            (request.status === "pending" ||
              request.status === "revision_requested") && (
              <div className="mt-5 p-4 rounded-xl bg-(--chip-bg)">
                <label className="block text-sm font-medium mb-2">
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
          <div className="mt-5 flex flex-wrap gap-2">
            {(request.status === "pending" ||
              request.status === "revision_requested") && (
              <>
                <Button
                  onClick={() => setShowResponse(!showResponse)}
                  variant="secondary"
                  size="sm"
                >
                  {showResponse
                    ? ar
                      ? "إخفاء النموذج"
                      : "Hide Form"
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
                {converting
                  ? ar
                    ? "جاري التحويل..."
                    : "Converting..."
                  : ar
                    ? "تحويل إلى نشاط"
                    : "Convert to Business"}
              </Button>
            )}
            <Button onClick={handleDelete} variant="ghost" size="sm">
              {ar ? "حذف" : "Delete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
