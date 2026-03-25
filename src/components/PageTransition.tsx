"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

/**
 * Gentle entrance-only fade on client-side navigation. No exit animation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
