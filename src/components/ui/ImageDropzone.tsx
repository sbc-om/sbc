"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

type Props = {
  name?: string;
  label: string;
  description?: string;
  accept?: string;
  maxSizeMb?: number;
  valueUrl?: string;
  busy?: boolean;
  onFileSelected?: (file: File) => void | Promise<void>;
  onFileCleared?: () => void;
  onRemoveExisting?: () => void | Promise<void>;
  strings?: Partial<{
    clickToSelect: string;
    orDragDrop: string;
    selected: string;
    current: string;
    change: string;
    remove: string;
    fileTooLarge: (maxMb: number) => string;
  }>;
  className?: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function ImageDropzone({
  name,
  label,
  description,
  accept = "image/png,image/jpeg,image/webp",
  maxSizeMb = 5,
  valueUrl,
  busy = false,
  onFileSelected,
  onFileCleared,
  onRemoveExisting,
  strings,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxBytes = useMemo(() => maxSizeMb * 1024 * 1024, [maxSizeMb]);

  const t = useMemo(
    () => ({
      clickToSelect: "Click to select file",
      orDragDrop: "or drag and drop",
      selected: "Selected",
      current: "Current",
      change: "Change",
      remove: "Remove",
      fileTooLarge: (maxMb: number) => `File is too large (max ${maxMb}MB).`,
      ...strings,
    }),
    [strings],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function setFile(file: File | null) {
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileMeta(null);

    if (!file) return;

    if (file.size > maxBytes) {
      setError(`FILE_TOO_LARGE_${maxSizeMb}MB`);
      return;
    }

    setFileMeta({ name: file.name, size: file.size });
    setPreviewUrl(URL.createObjectURL(file));

    try {
      await onFileSelected?.(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    void setFile(files[0]);
  }

  function onDropFile(file: File) {
    // Ensure the file is included in the form submit by writing it into the input.
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
    void setFile(file);
  }

  const hint = `PNG/JPG/WebP • up to ${maxSizeMb}MB`;

  const displayUrl = previewUrl ?? valueUrl ?? null;
  const mode: "selected" | "current" | "empty" = previewUrl
    ? "selected"
    : valueUrl
      ? "current"
      : "empty";

  return (
    <section className={cn("grid gap-2", className)}>
      <div className="grid gap-0.5">
        <div className="text-sm font-semibold">{label}</div>
        {description ? (
          <div className="text-xs text-(--muted-foreground)">{description}</div>
        ) : (
          <div className="text-xs text-(--muted-foreground)">{hint}</div>
        )}
      </div>

      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error === `FILE_TOO_LARGE_${maxSizeMb}MB` ? t.fileTooLarge(maxSizeMb) : error}
        </div>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed bg-(--surface)/30 transition",
          dragActive
            ? "border-accent bg-(--chip-bg)"
            : "border-(--surface-border) hover:border-accent hover:bg-(--surface)/50",
          busy && "opacity-80",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (busy) return;
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onDropFile(file);
        }}
      >
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!busy) inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className="block w-full cursor-pointer"
        >
          <div className="flex min-h-36 flex-col items-center justify-center gap-2 p-5 text-center">
            {displayUrl ? (
              <div className="grid w-full gap-3 sm:grid-cols-[160px,1fr] sm:items-center">
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-xl border border-(--surface-border) bg-(--surface)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayUrl} alt="Preview" className="h-full w-full object-cover" />
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <div className="grid gap-1 text-left">
                  <div className="text-sm font-semibold">{mode === "selected" ? t.selected : t.current}</div>
                  {mode === "selected" ? (
                    <>
                      <div className="truncate text-sm text-(--muted-foreground)">{fileMeta?.name}</div>
                      <div className="text-xs text-(--muted-foreground)">{fileMeta ? formatBytes(fileMeta.size) : null}</div>
                    </>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        inputRef.current?.click();
                      }}
                    >
                      {t.change}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (mode === "selected") {
                          if (inputRef.current) inputRef.current.value = "";
                          onFileCleared?.();
                          void setFile(null);
                        } else {
                          void onRemoveExisting?.();
                        }
                      }}
                    >
                      {t.remove}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <svg
                  className="h-10 w-10 text-(--muted-foreground)"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-(--muted-foreground)">{t.clickToSelect}</div>
                <div className="text-xs text-(--muted-foreground)">{t.orDragDrop}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
