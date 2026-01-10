"use client";

import React from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import type { StoreProduct } from "@/lib/store/products";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/store/CartProvider";

export function AddToCartButton({
  productSlug,
  locale,
  size = "sm",
  variant = "primary",
  className,
}: {
  productSlug: StoreProduct["slug"];
  locale: Locale;
  size?: "xs" | "sm" | "md" | "icon";
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "link";
  className?: string;
}) {
  const router = useRouter();
  const { add, state } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const ar = locale === "ar";
  const inCart = state.items.some((it) => it.slug === productSlug);

  return (
    <Button
      className={className}
      variant={inCart ? "secondary" : variant}
      size={size}
      onClick={() => {
        if (inCart) {
          router.push(`/${locale}/store/checkout`);
          return;
        }

        add(productSlug, 1);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 900);
      }}
    >
      {inCart
        ? ar
          ? "في السلة"
          : "In cart"
        : justAdded
          ? ar
            ? "تمت الإضافة"
            : "Added"
          : ar
            ? "إضافة للسلة"
            : "Add to cart"}
    </Button>
  );
}
