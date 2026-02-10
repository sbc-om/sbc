import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "index, follow",
};

/**
 * Bare layout for public user-built websites.
 * This lives outside /[locale]/ so it does NOT inherit
 * the sidebar / header / footer from the main app shell.
 * The root layout (app/layout.tsx) still provides <html>, fonts, and theme.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
