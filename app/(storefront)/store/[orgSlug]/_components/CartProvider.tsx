"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

const SYNC_EVENT = "storefront-cart-sync";

function cartStorageKey(orgSlug: string): string {
  return `storefront-cart:${orgSlug}`;
}

// Cache parsed items per org, keyed by the raw string last seen, so getSnapshot
// returns a stable array reference when the underlying storage hasn't changed
// (required by useSyncExternalStore to avoid re-render loops).
const parsedCache = new Map<string, { raw: string | null; items: CartItem[] }>();

function readCart(orgSlug: string): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(cartStorageKey(orgSlug));
  } catch {
    raw = null;
  }
  const cached = parsedCache.get(orgSlug);
  if (cached && cached.raw === raw) return cached.items;

  let items: CartItem[] = [];
  try {
    items = raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    items = [];
  }
  parsedCache.set(orgSlug, { raw, items });
  return items;
}

function writeCart(orgSlug: string, items: CartItem[]) {
  window.localStorage.setItem(cartStorageKey(orgSlug), JSON.stringify(items));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SYNC_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SYNC_EVENT, callback);
  };
}

const EMPTY_CART: CartItem[] = [];

export function CartProvider({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const getSnapshot = useCallback(() => readCart(orgSlug), [orgSlug]);
  const getServerSnapshot = useCallback(() => EMPTY_CART, []);
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback(
    (item: CartItem) => {
      const current = readCart(orgSlug);
      const index = current.findIndex((i) => i.productId === item.productId && i.variantId === item.variantId);
      const next =
        index >= 0
          ? current.map((i, idx) => (idx === index ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...current, item];
      writeCart(orgSlug, next);
    },
    [orgSlug]
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      const current = readCart(orgSlug);
      const next =
        quantity <= 0
          ? current.filter((i) => !(i.productId === productId && i.variantId === variantId))
          : current.map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i));
      writeCart(orgSlug, next);
    },
    [orgSlug]
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      writeCart(
        orgSlug,
        readCart(orgSlug).filter((i) => !(i.productId === productId && i.variantId === variantId))
      );
    },
    [orgSlug]
  );

  const clear = useCallback(() => writeCart(orgSlug, []), [orgSlug]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}
