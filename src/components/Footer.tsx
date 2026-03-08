import Link from "next/link";
import Image from "next/image";
import { HiChevronDown } from "react-icons/hi";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { FiInfo, FiMail } from "react-icons/fi";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
  homepageOnlyInstagram?: boolean;
}

export function Footer({ locale, dict, homepageOnlyInstagram = true }: FooterProps) {

  const brand = locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center";
  const instagramUrl = "https://www.instagram.com/sbc._.om";

  const socials = homepageOnlyInstagram
    ? [
      {
        key: "instagram",
        label: "Instagram",
        href: instagramUrl,
        icon: <FaInstagram className="h-4 w-4" />,
        external: true,
      },
    ]
    : [
    {
      key: "instagram",
      label: "Instagram",
      href: instagramUrl,
      icon: <FaInstagram className="h-4 w-4" />,
      external: true,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
      icon: <FaFacebook className="h-4 w-4" />,
      external: true,
    },
    {
      key: "twitter",
      label: "Twitter",
      href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
      icon: <FaTwitter className="h-4 w-4" />,
      external: true,
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);

  const footerActionIcons = [
    ...socials.map((s) => ({ ...s, href: s.href as string })),
    {
      key: "about",
      label: locale === "ar" ? "عن المشروع" : "About",
      href: `/${locale}/about`,
      icon: <FiInfo className="h-4 w-4" />,
      external: false,
    },
    {
      key: "contact",
      label: locale === "ar" ? "تواصل معنا" : "Contact",
      href: `/${locale}/contact`,
      icon: <FiMail className="h-4 w-4" />,
      external: false,
    },
  ];

  const platformLinks = [
    {
      key: "directory",
      label: locale === "ar" ? "دليل الأعمال" : "Business Directory",
      description: locale === "ar" ? "اكتشفك عملاء أكثر" : "Get discovered by nearby customers",
      href: `/${locale}/directory`,
      Icon: HiOutlineBuildingOffice2,
    },
    {
      key: "website",
      label: locale === "ar" ? "منشئ المواقع" : "Website Builder",
      description: locale === "ar" ? "موقع احترافي جاهز للنمو" : "Launch a professional business website",
      href: `/${locale}/dashboard/websites`,
      Icon: HiOutlineGlobeAlt,
    },
    {
      key: "loyalty",
      label: locale === "ar" ? "نظام الولاء" : "Loyalty System",
      description: locale === "ar" ? "أعد العملاء للشراء بالنقاط" : "Bring customers back with rewards",
      href: `/${locale}/loyalty`,
      Icon: HiOutlineSparkles,
    },
    {
      key: "marketing",
      label: locale === "ar" ? "أدوات التسويق" : "Marketing Tools",
      description: locale === "ar" ? "رسائل وحملات مؤتمتة" : "Run campaigns and messaging from one app",
      href: `/${locale}/services`,
      Icon: HiOutlineMegaphone,
    },
    {
      key: "agent-builder",
      label: locale === "ar" ? "منشئ وكيل AI" : "AI Agent Builder",
      description: locale === "ar" ? "أتمتة ذكية بدون كود" : "Build no-code AI workflows",
      href: `/${locale}/ai`,
      Icon: HiOutlineCpuChip,
    },
    {
      key: "ai-indexing",
      label: "AI Business Indexing",
      description: locale === "ar" ? "حضور أقوى داخل محركات AI" : "Optimize visibility across AI search",
      href: `/${locale}/ai-business-indexing`,
      Icon: HiOutlineGlobeAlt,
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
                  className="transition-transform duration-300 hover:scale-105"
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

              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-4 text-center">
                <details className="group relative w-full max-w-md">
                  <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-foreground">
                    <span
                      className="inline-flex w-full items-center justify-between rounded-xl border border-(--surface-border) px-4 py-2.5"
                      style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
                    >
                      <span>{locale === "ar" ? "المنصة" : "Platform"}</span>
                      <HiChevronDown className="h-4 w-4 text-(--muted-foreground) transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 w-[min(94vw,760px)] -translate-x-1/2 opacity-0 transition-all duration-200 group-open:pointer-events-auto group-open:opacity-100"
                    style={{ transformOrigin: "bottom center" }}
                  >
                    <div
                      className="rounded-2xl border border-(--surface-border) p-2 shadow-2xl"
                      style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {platformLinks.map((item) => (
                          <Link
                            key={item.key}
                            href={item.href}
                            className="group/item flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 text-start transition hover:border-(--surface-border) hover:bg-(--chip-bg)"
                            style={{ background: "rgb(var(--surface-rgb, 255, 255, 255))" }}
                          >
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
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

                </details>
              </div>

              {/* Right side: Social Links */}
              {footerActionIcons.length ? (
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                      >
                        {s.icon}
                      </a>
                    ) : (
                      <Link
                        key={s.key}
                        href={s.href}
                        aria-label={s.label}
                        title={s.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                      >
                        {s.icon}
                      </Link>
                    )
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
