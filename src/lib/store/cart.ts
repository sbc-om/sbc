import type { StoreProduct } from "@/lib/store/types";

export type CartItem = {
  slug: StoreProduct["slug"];
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = "sbc.cart.v1";

export function getCartStorageKey(userKey: string) {
  const safe = userKey.trim().toLowerCase().replace(/\s+/g, "_");
  return `${CART_STORAGE_KEY}:${safe}`;
}

export function normalizeQuantity(qty: number) {
  // Store items are one-time purchases (no quantities).
  // Keep `quantity` in the persisted shape for backward compatibility, but always normalize to 1.
  void qty;
  return 1;
}

export function getItemCount(state: CartState): number {
  // Unique items only.
  return state.items.length;
}

export function emptyCart(): CartState {
  return { items: [] };
}

export function addToCart(state: CartState, slug: string, quantity = 1): CartState {
  const existing = state.items.find((i) => i.slug === slug);
  if (existing) return state;
  // Quantity is always 1.
  void quantity;
  return { items: [...state.items, { slug, quantity: 1 }] };
}

export function setCartItemQuantity(state: CartState, slug: string, quantity: number): CartState {
  // Quantities are not supported; keep API but normalize to 1.
  void quantity;
  return {
    items: state.items.map((i) => (i.slug === slug ? { ...i, quantity: 1 } : i)),
  };
}

export function removeFromCart(state: CartState, slug: string): CartState {
  return { items: state.items.filter((i) => i.slug !== slug) };
}

export function readCartFromStorage(userKey?: string): CartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    const key = userKey ? getCartStorageKey(userKey) : CART_STORAGE_KEY;
    let raw = window.localStorage.getItem(key);
    // Migration: if we just switched to per-user carts and the new key is empty,
    // try the legacy global cart key.
    if (!raw && userKey) {
      raw = window.localStorage.getItem(CART_STORAGE_KEY);
    }
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return emptyCart();
    const items = (parsed as Record<string, unknown>).items;
    if (!Array.isArray(items)) return emptyCart();

    const normalized: CartItem[] = [];
    for (const it of items) {
      if (typeof it === "string") {
        normalized.push({ slug: it, quantity: 1 });
        continue;
      }
      if (!it || typeof it !== "object") continue;
      const slug = (it as Record<string, unknown>).slug;
      if (typeof slug !== "string") continue;
      // Accept legacy persisted quantity but normalize to 1.
      normalized.push({ slug, quantity: 1 });
    }

    // Ensure uniqueness.
    const seen = new Set<string>();
    const unique = normalized.filter((i) => {
      if (seen.has(i.slug)) return false;
      seen.add(i.slug);
      return true;
    });

    return { items: unique };
  } catch {
    return emptyCart();
  }
}

export function writeCartToStorage(state: CartState, userKey?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = userKey ? getCartStorageKey(userKey) : CART_STORAGE_KEY;
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}
