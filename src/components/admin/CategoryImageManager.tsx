"use client";

import { useState } from "react";
import { ImageDropzone } from "@/components/ui/ImageDropzone";

export function CategoryImageManager({
  categoryId,
  locale,
  initialImage,
}: {
  categoryId: string;
  locale: "en" | "ar";
  initialImage?: string;
}) {
  const [image, setImage] = useState<string | undefined>(initialImage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState(0);

  const ar = locale === "ar";

  async function uploadFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("image", file);

      const res = await fetch(`/api/admin/categories/${categoryId}/image`, {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as
        | { ok: true; url: string }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setImage(json.url);
      setDropKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/image`, {
        method: "DELETE",
      });

      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setImage(undefined);
      setDropKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-(--surface-border) bg-(--surface) p-5 shadow-(--shadow)">
      <ImageDropzone
        key={dropKey}
        label={ar ? "صورة التصنيف" : "Category image"}
        description={
          ar
            ? "ارفع صورة جميلة تمثل التصنيف. تُستخدم في صفحة الفئات وفي خيارات الاختيار."
            : "Upload a nice image representing this category. Used in category pages and selection dropdowns."
        }
        valueUrl={image}
        busy={busy}
        onFileSelected={uploadFile}
        onRemoveExisting={image ? remove : undefined}
        strings={{
          clickToSelect: ar ? "اضغط لاختيار ملف" : "Click to select file",
          orDragDrop: ar ? "أو اسحب وأفلت" : "or drag and drop",
          selected: ar ? "تم الاختيار" : "Selected",
          current: ar ? "الحالية" : "Current",
          change: ar ? "تغيير" : "Change",
          remove: ar ? "حذف" : "Remove",
          fileTooLarge: (maxMb) => (ar ? `الملف كبير جداً (الحد ${maxMb}MB).` : `File is too large (max ${maxMb}MB).`),
        }}
      />

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </section>
  );
}
