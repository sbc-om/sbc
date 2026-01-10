"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";

type MediaState = {
  cover?: string;
  logo?: string;
  banner?: string;
  gallery?: string[];
  videos?: string[];
};

type Kind = "cover" | "logo" | "banner" | "gallery" | "video";

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

export function BusinessMediaManager({
  businessId,
  locale,
  initialMedia,
}: {
  businessId: string;
  locale: "en" | "ar";
  initialMedia?: MediaState;
}) {
  const [media, setMedia] = useState<MediaState>(initialMedia ?? {});
  const [busy, setBusy] = useState<{ [K in Kind]?: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => `/api/businesses/${businessId}/media`, [businessId]);

  async function upload(kind: Kind, files: FileList | null) {
    setError(null);
    if (!files || files.length === 0) return;

    setBusy((b) => ({ ...b, [kind]: true }));
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      for (const f of Array.from(files)) fd.append("files", f);

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = (await res.json()) as
        | { ok: true; urls: string[]; media?: MediaState }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      // Prefer server-returned media; fall back to optimistic merge.
      if (json.media) {
        setMedia(json.media);
      } else {
        setMedia((m) => {
          if (kind === "cover") return { ...m, cover: json.urls[0] };
          if (kind === "logo") return { ...m, logo: json.urls[0] };
          if (kind === "banner") return { ...m, banner: json.urls[0] };
          if (kind === "gallery") return { ...m, gallery: uniq([...(m.gallery ?? []), ...json.urls]) };
          return { ...m, videos: uniq([...(m.videos ?? []), ...json.urls]) };
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusy((b) => ({ ...b, [kind]: false }));
    }
  }

  async function remove(kind: Kind, url: string) {
    setError(null);
    setBusy((b) => ({ ...b, [kind]: true }));
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, url }),
      });

      const json = (await res.json()) as
        | { ok: true; media?: MediaState }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      if (json.media) {
        setMedia(json.media);
      } else {
        setMedia((m) => {
          if (kind === "cover") return { ...m, cover: undefined };
          if (kind === "logo") return { ...m, logo: undefined };
          if (kind === "banner") return { ...m, banner: undefined };
          if (kind === "gallery") return { ...m, gallery: (m.gallery ?? []).filter((u) => u !== url) };
          return { ...m, videos: (m.videos ?? []).filter((u) => u !== url) };
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusy((b) => ({ ...b, [kind]: false }));
    }
  }

  const t = useMemo(() => {
    const ar = locale === "ar";
    return {
      title: ar ? "الصور والفيديو" : "Media (images & video)",
      subtitle: ar
        ? "ارفع الصورة الرئيسية والشعار وصورة البنر وصور المعرض أو فيديوهات لهذا النشاط التجاري. يتم التخزين داخل .data/uploads."
        : "Upload cover image, logo, banner image, gallery images, and videos for this business. Stored under .data/uploads.",
      cover: ar ? "الصورة الرئيسية" : "Main image",
      logo: ar ? "شعار العمل" : "Business logo",
      banner: ar ? "صورة البنر" : "Banner image",
      gallery: ar ? "معرض الصور" : "Gallery",
      video: ar ? "الفيديو" : "Videos",
      upload: ar ? "رفع" : "Upload",
      remove: ar ? "حذف" : "Remove",
      hintImg: ar ? "PNG/JPG/WebP/GIF حتى 10MB" : "PNG/JPG/WebP/GIF up to 10MB",
      hintVid: ar ? "MP4/WebM/MOV حتى 200MB" : "MP4/WebM/MOV up to 200MB",
    };
  }, [locale]);

  return (
    <section className="mt-10 rounded-2xl border border-(--surface-border) bg-(--surface) p-5 shadow-(--shadow)">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
        <p className="text-sm text-(--muted-foreground)">{t.subtitle}</p>
        {error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6">
        {/* Main image (cover) */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t.cover}</div>
              <div className="text-xs text-(--muted-foreground)">{t.hintImg}</div>
            </div>
            {media.cover ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy.cover}
                onClick={() => remove("cover", media.cover!)}
              >
                {t.remove}
              </Button>
            ) : null}
          </div>

          {media.cover ? (
            <div className="grid gap-2">
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-(--surface-border) bg-(--surface) sm:h-56">
                <Image
                  src={media.cover}
                  alt="cover"
                  fill
                  sizes="(min-width: 640px) 768px, 100vw"
                  className="object-cover"
                />
              </div>
              <a
                href={media.cover}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {media.cover}
              </a>
            </div>
          ) : (
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد صورة رئيسية بعد." : "No main image yet."}
            </div>
          )}

          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => upload("cover", e.target.files)}
              disabled={busy.cover}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:brightness-[1.05]"
            />
          </label>
        </div>

        {/* Logo */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t.logo}</div>
              <div className="text-xs text-(--muted-foreground)">{t.hintImg}</div>
            </div>
            {media.logo ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy.logo}
                onClick={() => remove("logo", media.logo!)}
              >
                {t.remove}
              </Button>
            ) : null}
          </div>

          {media.logo ? (
            <div className="flex items-center gap-4">
              <Image
                src={media.logo}
                alt="logo"
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl border border-(--surface-border) bg-(--surface) object-cover"
              />
              <a
                href={media.logo}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {media.logo}
              </a>
            </div>
          ) : (
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا يوجد شعار بعد." : "No logo yet."}
            </div>
          )}

          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => upload("logo", e.target.files)}
              disabled={busy.logo}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:brightness-[1.05]"
            />
          </label>
        </div>

        {/* Banner */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t.banner}</div>
              <div className="text-xs text-(--muted-foreground)">{t.hintImg}</div>
            </div>
            {media.banner ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy.banner}
                onClick={() => remove("banner", media.banner!)}
              >
                {t.remove}
              </Button>
            ) : null}
          </div>

          {media.banner ? (
            <div className="grid gap-2">
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-(--surface-border) bg-(--surface) sm:h-56">
                <Image
                  src={media.banner}
                  alt="banner"
                  fill
                  sizes="(min-width: 640px) 768px, 100vw"
                  className="object-cover"
                />
              </div>
              <a
                href={media.banner}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {media.banner}
              </a>
            </div>
          ) : (
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد صورة بنر بعد." : "No banner image yet."}
            </div>
          )}

          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => upload("banner", e.target.files)}
              disabled={busy.banner}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:brightness-[1.05]"
            />
          </label>
        </div>

        {/* Gallery */}
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-semibold">{t.gallery}</div>
            <div className="text-xs text-(--muted-foreground)">{t.hintImg}</div>
          </div>

          {(media.gallery?.length ?? 0) > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(media.gallery ?? []).map((url) => (
                <div key={url} className="group relative">
                  <Image
                    src={url}
                    alt="gallery"
                    width={400}
                    height={400}
                    className="aspect-square w-full rounded-xl border border-(--surface-border) bg-(--surface) object-cover"
                  />
                  <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 transition group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="xs"
                      disabled={busy.gallery}
                      onClick={() => remove("gallery", url)}
                    >
                      {t.remove}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد صور في المعرض." : "No gallery images."}
            </div>
          )}

          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => upload("gallery", e.target.files)}
              disabled={busy.gallery}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:brightness-[1.05]"
            />
          </label>
        </div>

        {/* Videos */}
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-semibold">{t.video}</div>
            <div className="text-xs text-(--muted-foreground)">{t.hintVid}</div>
          </div>

          {(media.videos?.length ?? 0) > 0 ? (
            <div className="grid gap-3">
              {(media.videos ?? []).map((url) => (
                <div
                  key={url}
                  className="flex flex-col gap-2 rounded-xl border border-(--surface-border) bg-(--surface) p-3"
                >
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    className="w-full rounded-lg"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {url}
                    </a>
                    <Button
                      variant="secondary"
                      size="xs"
                      disabled={busy.video}
                      onClick={() => remove("video", url)}
                    >
                      {t.remove}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد فيديوهات." : "No videos."}
            </div>
          )}

          <label className="inline-flex items-center gap-3">
            <input
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => upload("video", e.target.files)}
              disabled={busy.video}
              className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:brightness-[1.05]"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
