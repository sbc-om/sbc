"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  deleteRequestAction 
} from "./actions";

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
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleRespond = async (status: "approved" | "rejected") => {
    if (!response.trim()) {
      toast({ message: ar ? "الرجاء إدخال رد" : "Please enter a response", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      await respondToRequestAction(locale, request.id, status, response);
      setShowResponse(false);
      setResponse("");
      router.refresh();
    } catch {
      toast({ message: ar ? "فشل إرسال الرد" : "Failed to send response", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm(ar ? "هل تريد تحويل هذا الطلب إلى نشاط تجاري؟" : "Convert this request to a business?")) {
      return;
    }

    setConverting(true);
    try {
      await convertRequestToBusinessAction(locale, request.id);
      router.push(`/${locale}/admin/businesses`);
    } catch (err) {
      toast({ message: ar ? `فشل التحويل: ${err}` : `Conversion failed: ${err}`, variant: "error" });
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(ar ? "هل تريد حذف هذا الطلب؟" : "Delete this request?")) {
      return;
    }

    try {
      await deleteRequestAction(locale, request.id);
      router.refresh();
    } catch {
      toast({ message: ar ? "فشل الحذف" : "Delete failed", variant: "error" });
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    approved: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  const statusLabels = {
    pending: ar ? "معلقة" : "Pending",
    approved: ar ? "موافق عليها" : "Approved",
    rejected: ar ? "مرفوضة" : "Rejected",
  };

  return (
    <div className="sbc-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{ar ? request.name.ar : request.name.en}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
              {statusLabels[request.status]}
            </span>
          </div>
          {request.description && (
            <p className="text-sm text-(--muted-foreground) mb-3">{request.description}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {user && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "المستخدم:" : "User:"}</span>{" "}
                <span className="font-medium">{user.email}</span>
              </div>
            )}
            {agent && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "الوكيل:" : "Agent:"}</span>{" "}
                <span className="font-medium">{agent.fullName || agent.email}</span>
              </div>
            )}
            {category && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "التصنيف:" : "Category:"}</span>{" "}
                <span className="font-medium">{ar ? category.name.ar : category.name.en}</span>
              </div>
            )}
            {request.city && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "المدينة:" : "City:"}</span>{" "}
                <span className="font-medium">{request.city}</span>
              </div>
            )}
            {request.phone && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "الهاتف:" : "Phone:"}</span>{" "}
                <span className="font-medium">{request.phone}</span>
              </div>
            )}
            {request.email && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "البريد:" : "Email:"}</span>{" "}
                <span className="font-medium">{request.email}</span>
              </div>
            )}
            {request.website && (
              <div>
                <span className="text-(--muted-foreground)">{ar ? "الموقع:" : "Website:"}</span>{" "}
                <a href={request.website} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                  {request.website}
                </a>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-(--muted-foreground)">
            {ar ? "تم الإرسال في:" : "Submitted:"} {new Date(request.createdAt).toLocaleDateString(ar ? "ar" : "en")}
          </div>
        </div>
      </div>

      {/* Admin Response */}
      {request.adminResponse && (
        <div className="mb-4 p-4 bg-(--muted) rounded-lg">
          <div className="text-sm font-semibold mb-1">{ar ? "رد الإدارة:" : "Admin Response:"}</div>
          <p className="text-sm">{request.adminResponse}</p>
          {request.respondedAt && (
            <div className="mt-2 text-xs text-(--muted-foreground)">
              {ar ? "تم الرد في:" : "Responded:"} {new Date(request.respondedAt).toLocaleDateString(ar ? "ar" : "en")}
            </div>
          )}
        </div>
      )}

      {/* Response Form */}
      {showResponse && request.status === "pending" && (
        <div className="mb-4 p-4 border-2 border-dashed rounded-lg">
          <label className="block text-sm font-medium mb-2">
            {ar ? "رد على الطلب" : "Response to Request"}
          </label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={ar ? "اكتب ردك هنا..." : "Write your response here..."}
            rows={3}
            className="mb-3"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleRespond("approved")}
              disabled={loading}
              variant="primary"
              size="sm"
            >
              {loading ? (ar ? "جاري الموافقة..." : "Approving...") : (ar ? "موافقة" : "Approve")}
            </Button>
            <Button
              onClick={() => handleRespond("rejected")}
              disabled={loading}
              variant="secondary"
              size="sm"
            >
              {loading ? (ar ? "جاري الرفض..." : "Rejecting...") : (ar ? "رفض" : "Reject")}
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {request.status === "pending" && (
          <>
            <Button
              onClick={() => setShowResponse(!showResponse)}
              variant="secondary"
              size="sm"
            >
              {showResponse ? (ar ? "إخفاء النموذج" : "Hide Form") : (ar ? "الرد" : "Respond")}
            </Button>
            <Button
              onClick={handleConvert}
              disabled={converting}
              variant="primary"
              size="sm"
            >
              {converting ? (ar ? "جاري التحويل..." : "Converting...") : (ar ? "تحويل إلى نشاط" : "Convert to Business")}
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
            {converting ? (ar ? "جاري التحويل..." : "Converting...") : (ar ? "تحويل إلى نشاط" : "Convert to Business")}
          </Button>
        )}
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="sm"
        >
          {ar ? "حذف" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
