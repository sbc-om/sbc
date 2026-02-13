"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type {
  Website,
  WebsitePage,
  WebsiteBlock,
  WebsiteNavItem,
  Locale,
} from "@/lib/db/types";

/* ─── helpers ─────────────────────────────────────────────── */

function loc(v: { en: string; ar: string } | undefined, locale: Locale) {
  if (!v) return "";
  return v[locale] || v.en || v.ar || "";
}

/* ─── SVG icon helpers (inline so we avoid an icon-lib dep) ─ */

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.708-5.278" />
    </svg>
  );
}

/* social SVG icons */

function SocialIcon({ type }: { type: string }) {
  const base = "w-5 h-5";
  switch (type) {
    case "instagram":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
        </svg>
      );
    case "x":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── theme toggle (hydration-safe, matches SBC main) ────── */

function SiteThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch { /* */ }
  };

  const label = theme === "dark"
      ? (locale === "ar" ? "مظهر فاتح" : "Light mode")
      : (locale === "ar" ? "مظهر داكن" : "Dark mode");

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
    >
      {theme === "dark" ? (
        <IconSun className="w-[18px] h-[18px]" />
      ) : (
        <IconMoon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}

/* ─── language switcher (matches SBC main) ────────────────── */

function SiteLanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const target: Locale = locale === "en" ? "ar" : "en";

  // Replace locale prefix: /en/site/slug/... → /ar/site/slug/...
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const rest = first === "en" || first === "ar" ? segments.slice(1) : segments;
  const href = `/${target}/${rest.join("/")}`.replace(/\/$/, "") || `/${target}`;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
    >
      <IconGlobe className="w-[18px] h-[18px]" />
      <span>{target === "ar" ? "العربية" : "English"}</span>
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLOCK RENDERERS
   ═══════════════════════════════════════════════════════════ */

function BlockRenderer({ block, locale }: { block: WebsiteBlock; locale: Locale }) {
  switch (block.type) {
    /* ── Hero ─────────────────────────────────────────────── */
    case "hero":
      return (
        <section className="relative isolate overflow-hidden">
          {/* gradient bg when there is no image */}
          {!block.data.imageUrl && (
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--site-primary)]/10 via-transparent to-[var(--site-secondary)]/10 dark:from-[var(--site-primary)]/20 dark:to-[var(--site-secondary)]/20" />
          )}
          {block.data.imageUrl && (
            <>
              <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${block.data.imageUrl})` }}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            </>
          )}

          <div className="mx-auto max-w-4xl px-6 py-28 md:py-40 text-center">
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 ${
                block.data.imageUrl
                  ? "text-white drop-shadow-lg"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {loc(block.data.heading, locale)}
            </h1>

            {block.data.subheading && (
              <p
                className={`max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-10 ${
                  block.data.imageUrl
                    ? "text-white/85"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {loc(block.data.subheading, locale)}
              </p>
            )}

            {block.data.ctaText && block.data.ctaLink && (
              <a
                href={block.data.ctaLink}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white shadow-lg shadow-[var(--site-primary)]/25 bg-[var(--site-primary)] hover:brightness-110 active:scale-[.97] transition-all duration-200"
              >
                {loc(block.data.ctaText, locale)}
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </a>
            )}
          </div>
        </section>
      );

    /* ── Text ─────────────────────────────────────────────── */
    case "text":
      return (
        <section className="mx-auto max-w-3xl px-6 py-14">
          <div
            className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-[var(--site-primary)] max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: loc(block.data.content, locale) }}
          />
        </section>
      );

    /* ── Image ────────────────────────────────────────────── */
    case "image":
      return (
        <section className="mx-auto max-w-4xl px-6 py-14">
          <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 ring-1 ring-gray-200/50 dark:ring-white/10">
            <Image src={block.data.url} alt={block.data.alt || ""} width={1600} height={900} className="w-full h-auto object-cover" />
          </div>
          {block.data.caption && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {loc(block.data.caption, locale)}
            </p>
          )}
        </section>
      );

    /* ── Gallery ──────────────────────────────────────────── */
    case "gallery":
      return (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {block.data.images.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-gray-200/50 dark:ring-white/10"
              >
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </section>
      );

    /* ── Features ─────────────────────────────────────────── */
    case "features":
      return (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {block.data.items.map((item, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-8 bg-white dark:bg-white/[0.04] ring-1 ring-gray-200 dark:ring-white/10 shadow-sm hover:shadow-xl hover:shadow-[var(--site-primary)]/5 transition-all duration-300"
              >
                {/* accent bar */}
                <div className="absolute top-0 inset-x-6 h-[3px] rounded-b-full bg-gradient-to-r from-[var(--site-primary)] to-[var(--site-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                {item.icon && (
                  <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--site-primary)]/10 text-[var(--site-primary)] text-2xl">
                    {item.icon}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {loc(item.title, locale)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {loc(item.description, locale)}
                </p>
              </div>
            ))}
          </div>
        </section>
      );

    /* ── CTA ──────────────────────────────────────────────── */
    case "cta":
      return (
        <section className="relative isolate overflow-hidden py-20 px-6">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--site-primary)]/10 via-transparent to-[var(--site-secondary)]/10 dark:from-[var(--site-primary)]/20 dark:to-[var(--site-secondary)]/20" />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5">
              {loc(block.data.heading, locale)}
            </h2>
            {block.data.description && (
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                {loc(block.data.description, locale)}
              </p>
            )}
            <a
              href={block.data.buttonLink}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white shadow-lg shadow-[var(--site-primary)]/25 bg-[var(--site-primary)] hover:brightness-110 active:scale-[.97] transition-all duration-200"
            >
              {loc(block.data.buttonText, locale)}
            </a>
          </div>
        </section>
      );

    /* ── Testimonials ─────────────────────────────────────── */
    case "testimonials":
      return (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2">
            {block.data.items.map((t, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-8 bg-white dark:bg-white/[0.04] ring-1 ring-gray-200 dark:ring-white/10 shadow-sm"
              >
                {/* quote mark */}
                <svg className="absolute top-6 end-6 w-10 h-10 text-[var(--site-primary)]/15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                </svg>
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">
                  &ldquo;{loc(t.text, locale)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  {t.avatarUrl ? (
                    <div className="relative w-11 h-11 rounded-full object-cover ring-2 ring-[var(--site-primary)]/20 overflow-hidden">
                      <Image src={t.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[var(--site-primary)]/10 flex items-center justify-center text-[var(--site-primary)] font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</div>
                    {t.role && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t.role}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    /* ── Contact Form ─────────────────────────────────────── */
    case "contact-form":
      return (
        <section className="mx-auto max-w-lg px-6 py-20">
          {block.data.heading && (
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              {loc(block.data.heading, locale)}
            </h2>
          )}
          <form
            className="space-y-5 rounded-2xl bg-white dark:bg-white/[0.04] ring-1 ring-gray-200 dark:ring-white/10 p-8 shadow-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            {block.data.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                  {field}
                </label>
                {field === "message" ? (
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-transparent px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--site-primary)]/40 focus:border-[var(--site-primary)] outline-none transition"
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-transparent px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--site-primary)]/40 focus:border-[var(--site-primary)] outline-none transition"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-[var(--site-primary)]/25 bg-[var(--site-primary)] hover:brightness-110 active:scale-[.98] transition-all duration-200"
            >
              {locale === "ar" ? "إرسال" : "Send Message"}
            </button>
          </form>
        </section>
      );

    /* ── Map ──────────────────────────────────────────────── */
    case "map":
      return (
        <section className="mx-auto max-w-5xl px-6 py-14">
          <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200 dark:ring-white/10 shadow-lg">
            <iframe
              className="w-full h-80 md:h-96 border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${block.data.longitude - 0.01},${block.data.latitude - 0.01},${block.data.longitude + 0.01},${block.data.latitude + 0.01}&layer=mapnik&marker=${block.data.latitude},${block.data.longitude}`}
            />
          </div>
        </section>
      );

    /* ── Video ────────────────────────────────────────────── */
    case "video":
      return (
        <section className="mx-auto max-w-4xl px-6 py-14">
          {block.data.title && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
              {loc(block.data.title, locale)}
            </h3>
          )}
          <div className="relative pb-[56.25%] overflow-hidden rounded-2xl ring-1 ring-gray-200 dark:ring-white/10 shadow-lg">
            <iframe className="absolute inset-0 w-full h-full" src={block.data.url} allowFullScreen />
          </div>
        </section>
      );

    /* ── Divider ──────────────────────────────────────────── */
    case "divider":
      return (
        <div className="mx-auto max-w-xs py-10">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent" />
        </div>
      );

    /* ── Custom HTML ──────────────────────────────────────── */
    case "html":
      return (
        <section className="mx-auto max-w-4xl px-6 py-14">
          <div dangerouslySetInnerHTML={{ __html: block.data.code }} />
        </section>
      );

    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */

function SiteNavigation({
  website,
  basePath,
  locale,
}: {
  website: Website;
  basePath: string;
  locale: Locale;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll
  useState(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-sm shadow-black/5 dark:shadow-black/30"
          : "bg-white/60 dark:bg-gray-950/60 backdrop-blur-md"
      } border-b border-gray-200/60 dark:border-white/10`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
        {/* Logo + title */}
        <Link href={basePath} className="flex items-center gap-2.5 group">
          {website.branding.logoUrl ? (
            <div className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-white/10">
              <Image src={website.branding.logoUrl} alt="" fill sizes="36px" className="object-contain" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-[var(--site-primary)] flex items-center justify-center text-white font-bold text-sm">
              {loc(website.title, locale).charAt(0)}
            </div>
          )}
          <span className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-[var(--site-primary)] transition-colors">
            {loc(website.title, locale)}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {website.navigation.map((item) => (
            <NavItem key={item.id} item={item} basePath={basePath} locale={locale} />
          ))}
          <div className="ms-3 ps-3 border-s border-gray-200 dark:border-white/10 flex items-center gap-2">
            <SiteLanguageSwitcher locale={locale} />
            <SiteThemeToggle locale={locale} />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1.5">
          <SiteLanguageSwitcher locale={locale} />
          <SiteThemeToggle locale={locale} />
          <button
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <IconX className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-96 border-t border-gray-200/60 dark:border-white/10" : "max-h-0"
        }`}
      >
        <div className="px-6 py-4 space-y-1 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
          {website.navigation.map((item) => (
            <NavItem key={item.id} item={item} basePath={basePath} locale={locale} mobile />
          ))}
          {/* Mobile language switch row */}
          <div className="pt-3 mt-2 border-t border-gray-200/60 dark:border-white/10">
            <SiteLanguageSwitcher locale={locale} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  item,
  basePath,
  locale,
  mobile,
}: {
  item: WebsiteNavItem;
  basePath: string;
  locale: Locale;
  mobile?: boolean;
}) {
  const href = item.href.startsWith("http")
    ? item.href
    : `${basePath}/${item.href.replace(/^\//, "")}`;

  if (mobile) {
    return (
      <Link
        href={href}
        className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[var(--site-primary)] transition-colors"
      >
        {loc(item.label, locale)}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[var(--site-primary)] hover:bg-[var(--site-primary)]/5 transition-colors"
    >
      {loc(item.label, locale)}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════ */

function SiteFooter({ website, locale }: { website: Website; locale: Locale }) {
  const year = new Date().getFullYear();
  const hasSocials = website.socials && Object.values(website.socials).some(Boolean);

  const socialLinks: { type: string; url: string }[] = [];
  if (website.socials) {
    const s = website.socials;
    if (s.instagram) socialLinks.push({ type: "instagram", url: `https://instagram.com/${s.instagram}` });
    if (s.x) socialLinks.push({ type: "x", url: `https://x.com/${s.x}` });
    if (s.facebook) socialLinks.push({ type: "facebook", url: s.facebook });
    if (s.youtube) socialLinks.push({ type: "youtube", url: s.youtube });
    if (s.whatsapp) socialLinks.push({ type: "whatsapp", url: `https://wa.me/${s.whatsapp}` });
    if (s.linkedin) socialLinks.push({ type: "linkedin", url: s.linkedin });
    if (s.tiktok) socialLinks.push({ type: "tiktok", url: `https://tiktok.com/@${s.tiktok}` });
  }

  return (
    <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* footer text */}
        {website.footerText && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {loc(website.footerText, locale)}
          </p>
        )}

        {/* social row */}
        {hasSocials && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {socialLinks.map(({ type, url }) => (
              <a
                key={type}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-[var(--site-primary)] hover:bg-[var(--site-primary)]/10 transition-colors"
                aria-label={type}
              >
                <SocialIcon type={type} />
              </a>
            ))}
          </div>
        )}

        {/* divider + copyright */}
        <div className="pt-6 border-t border-gray-200/60 dark:border-white/5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            © {year} {loc(website.title, locale)}
          </p>

          {website.package === "starter" && (
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
              Powered by{" "}
              <a
                href="https://sbc.om"
                className="font-medium text-[var(--site-primary)] hover:underline"
              >
                SBC
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN RENDERER
   ═══════════════════════════════════════════════════════════ */

export default function WebsiteRenderer({
  website,
  page,
  locale,
}: {
  website: Website;
  page: WebsitePage;
  locale: Locale;
}) {
  const basePath = `/${locale}/site/${website.slug}`;

  return (
    <div
      className="min-h-dvh flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      style={
        {
          "--site-primary": website.branding.primaryColor,
          "--site-secondary": website.branding.secondaryColor,
          fontFamily: website.branding.fontFamily || "inherit",
        } as React.CSSProperties
      }
    >
      <SiteNavigation website={website} basePath={basePath} locale={locale} />

      <main className="flex-1">
        {page.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} locale={locale} />
        ))}

        {page.blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-lg font-medium">
              {locale === "ar" ? "لا يوجد محتوى بعد" : "No content yet"}
            </p>
          </div>
        )}
      </main>

      <SiteFooter website={website} locale={locale} />
    </div>
  );
}
