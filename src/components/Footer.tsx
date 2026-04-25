"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaFacebook, FaTwitter, FaThLarge } from "react-icons/fa";
import {
  HiOutlineBuildingOffice2,
  HiOutlineServerStack,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { AnimatePresence, motion } from "motion/react";
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

  React.useEffect(() => {
    if (!platformOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setPlatformOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [platformOpen]);

  const brand = locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center";
  const tagline = locale === "ar"
    ? "نمّي أعمالك مع أدوات ذكية"
    : "Grow your business with smart tools";
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

  const quickLinks = [
    {
      key: "services",
      label: locale === "ar" ? "الخدمات" : "Services",
      href: `/${locale}/services`,
    },
    {
      key: "tools",
      label: locale === "ar" ? "الأدوات" : "Tools",
      href: `/${locale}/tools`,
    },
    {
      key: "mcp",
      label: locale === "ar" ? "MCP" : "MCP",
      href: `/${locale}/mcp-business-review`,
    },
    {
      key: "loyalty",
      label: locale === "ar" ? "نظام الولاء" : "Loyalty",
      href: `/${locale}/loyalty`,
    },
    {
      key: "businesses",
      label: locale === "ar" ? "استكشف الأعمال" : "Explore Businesses",
      href: `/${locale}/businesses`,
    },
    {
      key: "about",
      label: locale === "ar" ? "عن المشروع" : "About",
      href: `/${locale}/about`,
    },
    {
      key: "contact",
      label: locale === "ar" ? "تواصل معنا" : "Contact",
      href: `/${locale}/contact`,
    },
  ];

  const featuredPlatformLinks = [
    {
      key: "directory",
      label: locale === "ar" ? "دليل الأعمال" : "Business Directory",
      description: locale === "ar"
        ? "سجّل نشاطك التجاري واجعل العملاء القريبين يكتشفونك بسهولة"
        : "List your business and get discovered by nearby customers instantly",
      href: `/${locale}/directory`,
      Icon: HiOutlineBuildingOffice2,
      color: "#F59E0B",
    },
    {
      key: "loyalty",
      label: locale === "ar" ? "نظام الولاء" : "Loyalty System",
      description: locale === "ar"
        ? "كافئ عملاءك بالنقاط واجعلهم يعودون للشراء مرة بعد مرة"
        : "Reward your customers with points and keep them coming back",
      href: `/${locale}/loyalty`,
      Icon: HiOutlineSparkles,
      color: "#F472B6",
    },
  ];

  const platformLinks = [
    {
      key: "tools",
      label: locale === "ar" ? "الأدوات" : "Tools",
      description: locale === "ar" ? "أدوات مجانية احترافية لأعمالك" : "Free professional tools for your business",
      href: `/${locale}/tools`,
      Icon: HiOutlineWrenchScrewdriver,
      color: "#10B981",
    },
    {
      key: "mcp-business-review",
      label: locale === "ar" ? "مراجعة الأعمال بالـ MCP" : "MCP Business Review",
      description: locale === "ar"
        ? "راجع الأنشطة التجارية عبر عميل AI باستخدام بروتوكول MCP"
        : "Review member businesses from an AI client using MCP",
      href: `/${locale}/mcp-business-review`,
      Icon: HiOutlineServerStack,
      color: "#3B82F6",
    },
  ];



  return (
    <footer className="mt-auto">
      <div className="py-6">
        <Container size="lg">
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-md"
            style={{
              background:
                "linear-gradient(165deg, rgba(var(--surface-rgb, 255, 255, 255), 0.94), rgba(var(--surface-rgb, 255, 255, 255), 0.84))",
            }}
          >
            {/* Top gradient accent line */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(0, 121, 244, 0.4) 25%, rgba(6, 182, 212, 0.5) 50%, rgba(0, 121, 244, 0.4) 75%, transparent 100%)",
              }}
            />

            <div className="px-6 pt-8 pb-6">
              {/* Main grid: Brand | Quick Links | Connect */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
                {/* Brand column */}
                <div className="md:col-span-4 flex flex-col items-center md:items-start gap-3">
                  <Link
                    href={`/${locale}`}
                    className="flex items-center gap-3 group"
                  >
                    <Image
                      src="/images/sbc.svg"
                      alt="SBC Logo"
                      width={36}
                      height={36}
                      className="h-9 w-9 transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="font-bold text-lg bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                      {brand}
                    </span>
                  </Link>
                  <p className="text-sm text-(--muted-foreground) text-center md:text-start max-w-xs leading-relaxed">
                    {tagline}
                  </p>
                </div>

                {/* Quick Links column */}
                <div className="md:col-span-4 flex flex-col items-center md:items-start">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground) mb-3">
                    {locale === "ar" ? "روابط سريعة" : "Quick Links"}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className="text-sm text-foreground/70 hover:text-accent transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Connect column */}
                <div className="md:col-span-4 flex flex-col items-center md:items-end gap-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {locale === "ar" ? "تابعنا" : "Follow Us"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {socials.map((s) =>
                      s.external ? (
                        <a
                          key={s.key}
                          href={s.href as string}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={s.label}
                          title={s.label}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--chip-bg) transition-all duration-200 hover:scale-110 hover:bg-(--accent-soft)"
                        >
                          {s.icon}
                        </a>
                      ) : (
                        <Link
                          key={s.key}
                          href={s.href as string}
                          aria-label={s.label}
                          title={s.label}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--chip-bg) transition-all duration-200 hover:scale-110 hover:bg-(--accent-soft)"
                        >
                          {s.icon}
                        </Link>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setPlatformOpen((v) => !v)}
                      aria-label={locale === "ar" ? "المنصة" : "Platform"}
                      title={locale === "ar" ? "المنصة" : "Platform"}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--chip-bg) transition-all duration-200 hover:scale-110 hover:bg-(--accent-soft)"
                    >
                      <FaThLarge className="h-4 w-4 text-[#8B5CF6]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Copyright bar */}
              <div
                className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2"
                style={{
                  borderTop: "1px solid rgba(var(--foreground-rgb, 0, 0, 0), 0.06)",
                }}
              >
                <p className="text-xs text-(--muted-foreground)">
                  &copy; {new Date().getFullYear()} Smart Business Center
                </p>
                <p className="text-xs text-(--muted-foreground)">
                  {locale === "ar" ? "صُنع في عُمان" : "Made in Oman"}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Platform popup — fixed centered overlay */}
      <AnimatePresence>
        {platformOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center pb-24 sm:items-center sm:pb-0"
            onClick={() => setPlatformOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <motion.div
              className="relative z-10 w-[min(94vw,760px)] rounded-2xl overflow-hidden"
              style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
            >
              <div
                className="absolute top-0 inset-x-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0, 121, 244, 0.5) 25%, rgba(6, 182, 212, 0.6) 50%, rgba(0, 121, 244, 0.5) 75%, transparent 100%)",
                }}
              />

              <div className="p-4 pt-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 px-1">
                  {locale === "ar" ? "منصة SBC" : "SBC Platform"}
                </h3>

                {/* Featured: Business Directory & Loyalty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {featuredPlatformLinks.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setPlatformOpen(false)}
                      className="group/feat relative flex items-start gap-3 rounded-xl p-4 text-start transition-all duration-200 overflow-hidden"
                      style={{ background: `${item.color}0D` }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover/feat:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}14, ${item.color}08)`,
                        }}
                      />
                      <span
                        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover/feat:scale-110"
                        style={{
                          backgroundColor: `${item.color}22`,
                          color: item.color,
                        }}
                      >
                        <item.Icon className="h-6 w-6" />
                      </span>
                      <span className="relative min-w-0">
                        <span className="block text-sm font-bold text-foreground">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--muted-foreground)">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Other platform links */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {platformLinks.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setPlatformOpen(false)}
                      className="group/item flex items-start gap-3 rounded-xl px-3 py-2.5 text-start transition-all duration-200 hover:bg-(--chip-bg)"
                    >
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover/item:scale-110"
                        style={{
                          backgroundColor: `${item.color}1A`,
                          color: item.color,
                        }}
                      >
                        <item.Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-(--muted-foreground)">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
