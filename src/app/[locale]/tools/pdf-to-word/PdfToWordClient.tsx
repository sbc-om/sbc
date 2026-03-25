"use client";

import React, { useCallback, useState } from "react";
import { FileText, Upload, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "uploading" | "success" | "error";

export function PdfToWordClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const dir = localeDir(locale);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setError("");
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    if (!f.type.includes("pdf") && !f.name.toLowerCase().endsWith(".pdf")) {
      setError(ar ? "يرجى اختيار ملف PDF فقط" : "Please select a PDF file only");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(ar ? "حجم الملف يتجاوز 10 ميغابايت" : "File size exceeds 10 MB");
      return;
    }
    setFile(f);
    setError("");
    setStatus("idle");
  }, [ar]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tools/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? (ar ? "فشل في تحويل الملف" : "Conversion failed"),
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, ".docx");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : (ar ? "حدث خطأ" : "An error occurred"));
      setStatus("error");
    }
  }, [file, ar]);

  return (
    <section dir={dir} className="mx-auto max-w-2xl py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {ar ? "تحويل PDF إلى Word" : "PDF to Word Converter"}
        </h1>
        <p className="mt-3 text-base text-(--muted-foreground)">
          {ar
            ? "حوّل ملفات PDF إلى Word بمحرك تحويل أقوى يدعم العربية والإنجليزية بشكل أفضل ويحافظ على التنسيق والجداول والصور قدر الإمكان."
            : "Convert PDF files to Word with a stronger conversion engine for better Arabic and English support and better preservation of layout, tables, and images."}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`sbc-card rounded-2xl p-8 transition-all !border-0 ${
          dragActive ? "ring-2 ring-accent ring-offset-2" : ""
        }`}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,application/pdf";
            input.onchange = () => handleFiles(input.files);
            input.click();
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl p-10 text-center transition-colors hover:bg-accent/5"
        >
          <Upload className="h-10 w-10 text-(--muted-foreground)" />
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-(--muted-foreground)">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {ar ? "اسحب ملف PDF هنا أو اضغط للاختيار" : "Drag a PDF here or click to select"}
              </p>
              <p className="text-xs text-(--muted-foreground)">
                {ar ? "الحد الأقصى: 10 ميغابايت" : "Max size: 10 MB"}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {ar
                ? "تم التحويل بنجاح! يتم تنزيل الملف الآن."
                : "Conversion successful! Your file is downloading."}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={handleConvert}
            disabled={!file || status === "uploading"}
            className="gap-2"
          >
            {status === "uploading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {status === "uploading"
              ? ar
                ? "جارٍ التحويل..."
                : "Converting..."
              : ar
                ? "تحويل وتنزيل"
                : "Convert & Download"}
          </Button>

          {file && (
            <Button variant="secondary" onClick={reset}>
              {ar ? "إعادة" : "Reset"}
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 sbc-card rounded-2xl p-5 !border-0">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {ar ? "ملاحظات" : "Notes"}
        </h2>
        <ul className="space-y-2 text-xs text-(--muted-foreground) list-disc ps-4">
          <li>{ar ? "يستخدم المحرك مسار تحويل احترافي أولاً للحفاظ على التخطيط والجداول والصور، خاصة في ملفات العربية والإنجليزية." : "The converter now uses a professional conversion path first to preserve layout, tables, and images, especially in Arabic and English PDFs."}</li>
          <li>{ar ? "أفضل النتائج تكون عادةً مع ملفات PDF الرقمية. ملفات PDF الممسوحة ضوئياً قد تحتاج OCR للحصول على دقة أعلى." : "Best results are usually achieved with digital PDFs. Scanned PDFs may still require OCR for higher accuracy."}</li>
          <li>{ar ? "إذا تعذّر المسار الاحترافي، يتم استخدام مسار بديل حتى لا تفشل الأداة بالكامل." : "If the professional conversion path is unavailable, the tool falls back to an alternate path instead of failing outright."}</li>
          <li>{ar ? "الملفات لا تُخزن على السيرفر وتُحذف فوراً بعد التحويل." : "Files are not stored on the server and are discarded immediately after conversion."}</li>
          <li>{ar ? "الحد الأقصى لحجم الملف 10 ميغابايت." : "Maximum file size is 10 MB."}</li>
        </ul>
      </div>
    </section>
  );
}
