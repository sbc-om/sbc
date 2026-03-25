"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Gentle slide-up entrance animation on every client-side navigation.
 * No exit animation — avoids the flash/blink that AnimatePresence causes.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
