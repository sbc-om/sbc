"use client";

import React from "react";

import type { StoreProduct } from "@/lib/store/products";
import {
  addToCart,
  emptyCart,
  getCartStorageKey,
  getItemCount,
  readCartFromStorage,
  removeFromCart,
  writeCartToStorage,
  type CartState,
} from "@/lib/store/cart";

export type CartContextValue = {
  state: CartState;
  itemCount: number;
  add: (slug: StoreProduct["slug"], quantity?: number) => void;
  remove: (slug: StoreProduct["slug"]) => void;
  clear: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({
  children,
  userKey,
}: {
  children: React.ReactNode;
  userKey: string;
}) {
  const [state, setState] = React.useState<CartState>(() => emptyCart());
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage whenever the current user changes.
  React.useEffect(() => {
    setHydrated(false);
    setState(readCartFromStorage(userKey));
    setHydrated(true);
  }, [userKey]);

  // Persist on every change (after hydration).
  React.useEffect(() => {
    if (!hydrated) return;
    writeCartToStorage(state, userKey);
  }, [state, hydrated, userKey]);

  // Sync cart across tabs.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getCartStorageKey(userKey);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setState(readCartFromStorage(userKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userKey]);

  const value = React.useMemo<CartContextValue>(() => {
    return {
      state,
      itemCount: getItemCount(state),
      add: (slug, quantity) => setState((s) => addToCart(s, slug, quantity ?? 1)),
      remove: (slug) => setState((s) => removeFromCart(s, slug)),
      clear: () => setState(emptyCart()),
    };
  }, [state]);

  return <CartContext value={value}>{children}</CartContext>;
}
