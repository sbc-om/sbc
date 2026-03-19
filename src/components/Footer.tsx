"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaFacebook, FaTwitter, FaThLarge, FaInfoCircle, FaEnvelope } from "react-icons/fa";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
  homepageOnlyInstagram?: boolean;
}

export function Footer({ locale, homepageOnlyInstagram = true }: FooterProps) {
  const [platformOpen, setPlatformOpen] = React.useState(false);
  const platformRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!platformOpen) return;
    function handleClick(e: MouseEvent) {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) {
        setPlatformOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [platformOpen]);

  const brand = locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center";
  const instagramUrl = "https://www.instagram.com/sbc._.om";

  const socials = homepageOnlyInstagram
    ? [
      {
        key: "instagram",
        label: "Instagram",
        href: instagramUrl,
        icon: <FaInstagram className="h-4 w-4 text-[#E4405F]" />,
        external: true,
      },
    ]
    : [
    {
      key: "instagram",
      label: "Instagram",
      href: instagramUrl,
      icon: <FaInstagram className="h-4 w-4 text-[#E4405F]" />,
      external: true,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
      icon: <FaFacebook className="h-4 w-4 text-[#1877F2]" />,
      external: true,
    },
    {
      key: "twitter",
      label: "Twitter",
      href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
      icon: <FaTwitter className="h-4 w-4 text-[#1DA1F2]" />,
      external: true,
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);

  const footerActionIcons = [
    ...socials.map((s) => ({ ...s, href: s.href as string })),
    {
      key: "about",
      label: locale === "ar" ? "عن المشروع" : "About",
      href: `/${locale}/about`,
      icon: <FaInfoCircle className="h-4 w-4 text-[#3B82F6]" />,
      external: false,
    },
    {
      key: "contact",
      label: locale === "ar" ? "تواصل معنا" : "Contact",
      href: `/${locale}/contact`,
      icon: <FaEnvelope className="h-4 w-4 text-[#10B981]" />,
      external: false,
    },
  ];

  const platformLinks = [
    {
      key: "directory",
      label: locale === "ar" ? "دلیل الأعمال" : "Business Directory",
      description: locale === "ar" ? "اكتشفك عملاء أكثر" : "Get discovered by nearby customers",
      href: `/${locale}/directory`,
      Icon: HiOutlineBuildingOffice2,
      color: "#F59E0B",
    },
    {
      key: "website",
      label: locale === "ar" ? "منشئ المواقع" : "Website Builder",
      description: locale === "ar" ? "موقع احترافي جاهز للنمو" : "Launch a professional business website",
      href: `/${locale}/dashboard/websites`,
      Icon: HiOutlineGlobeAlt,
      color: "#3B82F6",
    },
    {
      key: "loyalty",
      label: locale === "ar" ? "نظام الولاء" : "Loyalty System",
      description: locale === "ar" ? "أعد العملاء للشراء بالنقاط" : "Bring customers back with rewards",
      href: `/${locale}/loyalty`,
      Icon: HiOutlineSparkles,
      color: "#F472B6",
    },
    {
      key: "marketing",
      label: locale === "ar" ? "أدوات التسویق" : "Marketing Tools",
      description: locale === "ar" ? "رسائل وحملات مؤتمتة" : "Run campaigns and messaging from one app",
      href: `/${locale}/services`,
      Icon: HiOutlineMegaphone,
      color: "#EF4444",
    },
    {
      key: "tools",
      label: locale === "ar" ? "الأدوات" : "Tools",
      description: locale === "ar" ? "أدوات مجانية احترافية لأعمالك" : "Free professional tools for your business",
      href: `/${locale}/tools`,
      Icon: HiOutlineWrenchScrewdriver,
      color: "#10B981",
    },
    {
      key: "agent-builder",
      label: locale === "ar" ? "منشئ وکیل AI" : "AI Agent Builder",
      description: locale === "ar" ? "أتمتة ذکیة بدون کود" : "Build no-code AI workflows",
      href: `/${locale}/ai`,
      Icon: HiOutlineCpuChip,
      color: "#8B5CF6",
    },
    {
      key: "ai-indexing",
      label: "AI Business Indexing",
      description: locale === "ar" ? "حضور أقوى داخل محرکات AI" : "Optimize visibility across AI search",
      href: `/${locale}/ai-business-indexing`,
      Icon: HiOutlineGlobeAlt,
      color: "#06B6D4",
    },
  ];



  return (
    <footer className="mt-auto">
      <div className="py-5">
        <Container size="lg">
          <div
            className="relative rounded-2xl overflow-visible py-5 px-5"
            style={{
              background: "rgb(var(--surface-rgb, 255, 255, 255))",
              border: "1px solid",
              borderColor: "var(--surface-border)",
              boxShadow: "var(--shadow)",
            }}
          >
            {/* Responsive layout: vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-4">
              {/* Left side: Logo + Brand */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}`}
                  className="hover:translate-y-0 active:scale-100"
                >
                  <Image
                    src="/images/sbc.svg"
                    alt="SBC Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10"
                    priority
                  />
                </Link>
                <Link
                  href={`/${locale}`}
                  className="font-bold text-lg bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  {brand}
                </Link>
              </div>



              {/* Right side: Icons */}
              <div className="flex items-center gap-3">
                {footerActionIcons.map((s) => (
                  s.external ? (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) shadow-(--shadow) hover:scale-110 transition-all"
                    >
                      {s.icon}
                    </a>
                  ) : (
                    <Link
                      key={s.key}
                      href={s.href}
                      aria-label={s.label}
                      title={s.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) shadow-(--shadow) hover:scale-110 transition-all"
                    >
                      {s.icon}
                    </Link>
                  )
                ))}

                {/* Platform icon + popup */}
                <div ref={platformRef}>
                  <button
                    type="button"
                    onClick={() => setPlatformOpen((v) => !v)}
                    aria-label={locale === "ar" ? "المنصة" : "Platform"}
                    title={locale === "ar" ? "المنصة" : "Platform"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) shadow-(--shadow) hover:scale-110 transition-all"
                  >
                    <FaThLarge className="h-4 w-4 text-[#8B5CF6]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Platform popup — fixed centered overlay */}
      {platformOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-24 sm:items-center sm:pb-0"
          onClick={() => setPlatformOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            ref={platformRef}
            className="relative z-10 w-[min(94vw,760px)] rounded-2xl border border-(--surface-border) p-3 shadow-2xl"
            style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {platformLinks.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setPlatformOpen(false)}
                  className="group/item flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 text-start transition hover:border-(--surface-border) hover:bg-(--chip-bg)"
                  style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                  >
                    <item.Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-(--muted-foreground)">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
