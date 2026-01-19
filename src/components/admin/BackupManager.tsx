"use client";

import { useState, useEffect } from "react";
import { FiDownload, FiTrash2, FiUpload, FiRefreshCw, FiDatabase, FiAlertCircle, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/Button";

interface BackupMetadata {
  id: string;
  timestamp: string;
  type: "full" | "database-only" | "files-only";
  size: number;
  encrypted: boolean;
  description?: string;
  version: string;
}

interface BackupManagerProps {
  locale: "ar" | "en";
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: "danger" | "warning";
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="sbc-card rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {type === "danger" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              {type === "warning" && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-(--muted-foreground) hover:bg-(--surface-subtle) transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <p className="mb-6 text-sm text-(--muted-foreground) leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant={type === "danger" ? "destructive" : "primary"}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BackupManager({ locale }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    type: "danger",
    onConfirm: () => {},
  });

  const ar = locale === "ar";

  // Load backups
  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup/list");

      if (!res.ok) throw new Error("Failed to load backups");

      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في تحميل قائمة النسخ الاحتياطية" : "Failed to load backups list"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create backup
  const createBackup = async (type: "full" | "database-only" | "files-only") => {
    setCreating(true);
    setMessage(null);
    
    try {
      const res = await fetch("/api/admin/backup/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          description: `${type} backup created at ${new Date().toISOString()}`,
          includeMedia: true,
          includeCerts: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to create backup");

      setMessage({ 
        type: "success", 
        text: ar ? "تم إنشاء النسخة الاحتياطية بنجاح" : "Backup created successfully"
      });
      loadBackups();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في إنشاء النسخة الاحتياطية" : "Failed to create backup"
      });
    } finally {
      setCreating(false);
    }
  };

  // Delete backup
  const deleteBackup = async (backupId: string) => {
    setModalConfig({
      isOpen: true,
      title: ar ? "حذف النسخة الاحتياطية" : "Delete Backup",
      message: ar 
        ? "هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this backup? This action cannot be undone.",
      confirmText: ar ? "حذف" : "Delete",
      cancelText: ar ? "إلغاء" : "Cancel",
      type: "danger",
      onConfirm: async () => {
        await performDelete(backupId);
      },
    });
  };

  const performDelete = async (backupId: string) => {
    try {
      const res = await fetch(`/api/admin/backup/delete/${backupId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete backup");

      setMessage({ 
        type: "success", 
        text: ar ? "تم حذف النسخة الاحتياطية" : "Backup deleted successfully"
      });
      loadBackups();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في حذف النسخة الاحتياطية" : "Failed to delete backup"
      });
    }
  };

  // Download backup
  const downloadBackup = async (backupId: string) => {
    try {
      const res = await fetch(`/api/admin/backup/download/${backupId}`);

      if (!res.ok) throw new Error("Failed to download backup");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backupId}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ 
        type: "success", 
        text: ar ? "بدأ تنزيل النسخة الاحتياطية" : "Backup download started"
      });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في تنزيل النسخة الاحتياطية" : "Failed to download backup"
      });
    }
  };

  // Restore backup
  const restoreBackup = async (backupId: string) => {
    setModalConfig({
      isOpen: true,
      title: ar ? "استعادة النسخة الاحتياطية" : "Restore Backup",
      message: ar
        ? "هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية بالبيانات من هذه النسخة. هذا الإجراء لا يمكن التراجع عنه."
        : "Are you sure you want to restore this backup? All current data will be replaced with data from this backup. This action cannot be undone.",
      confirmText: ar ? "استعادة" : "Restore",
      cancelText: ar ? "إلغاء" : "Cancel",
      type: "warning",
      onConfirm: async () => {
        await performRestore(backupId);
      },
    });
  };

  const performRestore = async (backupId: string) => {
    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupId,
          restoreDatabase: true,
          restoreFiles: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to restore backup");

      setMessage({ 
        type: "success", 
        text: ar ? "تمت استعادة النسخة الاحتياطية بنجاح" : "Backup restored successfully"
      });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في استعادة النسخة الاحتياطية" : "Failed to restore backup"
      });
    }
  };

  // Upload backup
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/backup/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload backup");

      setMessage({ 
        type: "success", 
        text: ar ? "تم رفع ملف النسخة الاحتياطية" : "Backup file uploaded successfully"
      });
      loadBackups();
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: ar ? "خطأ في رفع الملف" : "Failed to upload file"
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "full":
        return ar ? "كاملة" : "Full";
      case "database-only":
        return ar ? "قاعدة البيانات فقط" : "Database Only";
      case "files-only":
        return ar ? "الملفات فقط" : "Files Only";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create Backup Section */}
      <div className="sbc-card rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {ar ? "إنشاء نسخة احتياطية جديدة" : "Create New Backup"}
          </h3>
          <Button
            onClick={loadBackups}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => createBackup("full")}
            disabled={creating}
            variant="primary"
            size="sm"
          >
            <FiDatabase className="inline" />
            <span className={ar ? "mr-2" : "ml-2"}>
              {ar ? "نسخة كاملة" : "Full Backup"}
            </span>
          </Button>
          <Button
            onClick={() => createBackup("database-only")}
            disabled={creating}
            variant="secondary"
            size="sm"
          >
            <FiDatabase className="inline" />
            <span className={ar ? "mr-2" : "ml-2"}>
              {ar ? "قاعدة البيانات فقط" : "Database Only"}
            </span>
          </Button>
          <Button
            onClick={() => createBackup("files-only")}
            disabled={creating}
            variant="secondary"
            size="sm"
          >
            <FiUpload className="inline" />
            <span className={ar ? "mr-2" : "ml-2"}>
              {ar ? "الملفات فقط" : "Files Only"}
            </span>
          </Button>
        </div>
        {creating && (
          <p className="mt-4 text-sm text-(--muted-foreground)">
            {ar ? "جاري إنشاء النسخة الاحتياطية..." : "Creating backup..."}
          </p>
        )}
      </div>

      {/* Upload Backup Section */}
      <div className="sbc-card rounded-2xl p-6">
        <h3 className="mb-4 text-base font-semibold">
          {ar ? "رفع نسخة احتياطية" : "Upload Backup"}
        </h3>
        <label className="block">
          <input
            type="file"
            accept=".tar.gz"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-(--muted-foreground) file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-(--chip-bg) file:text-(--foreground) hover:file:bg-(--chip-hover-bg) disabled:opacity-50"
          />
        </label>
        {uploading && (
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar ? "جاري الرفع..." : "Uploading..."}
          </p>
        )}
      </div>

      {/* Backups List */}
      <div className="sbc-card rounded-2xl p-6">
        <h3 className="mb-4 text-base font-semibold">
          {ar ? `النسخ الاحتياطية المتوفرة (${backups.length})` : `Available Backups (${backups.length})`}
        </h3>

        {loading ? (
          <p className="py-8 text-center text-sm text-(--muted-foreground)">
            {ar ? "جاري التحميل..." : "Loading..."}
          </p>
        ) : backups.length === 0 ? (
          <div className="rounded-xl border border-(--surface-border) bg-(--surface-subtle) p-8 text-center">
            <FiDatabase className="mx-auto h-12 w-12 text-(--muted-foreground) opacity-40" />
            <p className="mt-3 text-sm text-(--muted-foreground)">
              {ar ? "لا توجد نسخ احتياطية" : "No backups available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between rounded-xl border border-(--surface-border) p-4 hover:bg-(--surface-subtle) transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-mono text-sm font-medium">{backup.id}</h4>
                    {backup.encrypted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        🔒 {ar ? "مشفر" : "Encrypted"}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-(--chip-bg) px-2 py-0.5 text-xs font-medium text-(--muted-foreground)">
                      {getTypeLabel(backup.type)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-(--muted-foreground)">
                    {new Date(backup.timestamp).toLocaleString(ar ? "ar" : "en")} • {formatSize(backup.size)}
                  </p>
                  {backup.description && (
                    <p className="mt-1 text-xs text-(--muted-foreground) line-clamp-1">{backup.description}</p>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    onClick={() => downloadBackup(backup.id)}
                    variant="ghost"
                    size="sm"
                    title={ar ? "تنزيل" : "Download"}
                  >
                    <FiDownload />
                  </Button>
                  <Button
                    onClick={() => restoreBackup(backup.id)}
                    variant="ghost"
                    size="sm"
                    title={ar ? "استعادة" : "Restore"}
                  >
                    <FiRefreshCw />
                  </Button>
                  <Button
                    onClick={() => deleteBackup(backup.id)}
                    variant="ghost"
                    size="sm"
                    title={ar ? "حذف" : "Delete"}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {ar ? "ملاحظات الأمان" : "Security Notes"}
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
              <li>
                • {ar 
                  ? "النسخ المشفرة تحتاج مفتاح التشفير الصحيح للاستعادة"
                  : "Encrypted backups require the correct encryption key for restoration"}
              </li>
              <li>
                • {ar 
                  ? "احتفظ بالنسخ في مكان آمن"
                  : "Store backups in a secure location"}
              </li>
              <li>
                • {ar 
                  ? "أنشئ نسخة جديدة قبل أي استعادة"
                  : "Create a new backup before any restoration"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
  