import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ProductInCart = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  stock: number;
};

type CartItem = {
  id: string;
  quantity: number;
  product: ProductInCart;
  subtotal: number;
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  itemsCount: number;
  isInCart: (productId: string) => boolean;
  addToCart: (product: ProductInCart) => boolean;
  incrementItemQuantity: (productId: string) => boolean;
  decrementItemQuantity: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "react_marketplace_cart_v1";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const round2 = (n: number) => Number(n.toFixed(2));

/**
 * Persist to localStorage, stripping imageUrl so stale signed URLs
 * don't get reloaded on the next session. imageUrl is restored at
 * runtime (CheckOut refreshes them from /products on mount).
 */
const persist = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  const payload = items.map(({ quantity, product }) => ({
    quantity,
    product: { id: product.id, name: product.name, price: product.price, stock: product.stock, imageUrl: "" },
  }));
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
};

const readStored = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<{ quantity: number; product: ProductInCart }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item.quantity > 0 && item.product?.id)
      .map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
        product: item.product,
        subtotal: round2(Number(item.product.price) * item.quantity),
      }));
  } catch {
    return [];
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStored());

  /**
   * itemsRef always holds the latest items synchronously.
   * Cart operations read from it to avoid stale closures without
   * needing to add `items` to every useCallback dependency array.
   */
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const commit = useCallback((next: CartItem[]) => {
    setItems(next);
    persist(next);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────

  /** Returns false if the product is already at max stock. */
  const addToCart = useCallback(
    (product: ProductInCart): boolean => {
      const current = itemsRef.current;
      const existing = current.find((i) => i.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return false;
        const next = current.map((i) => {
          if (i.product.id !== product.id) return i;
          const quantity = i.quantity + 1;
          return { ...i, quantity, subtotal: round2(Number(i.product.price) * quantity) };
        });
        commit(next);
        return true;
      }

      const next: CartItem[] = [
        ...current,
        { id: product.id, quantity: 1, product, subtotal: round2(Number(product.price)) },
      ];
      commit(next);
      return true;
    },
    [commit],
  );

  /** Returns false if the product is already at max stock. */
  const incrementItemQuantity = useCallback(
    (productId: string): boolean => {
      const current = itemsRef.current;
      const existing = current.find((i) => i.product.id === productId);
      if (!existing || existing.quantity >= existing.product.stock) return false;

      const next = current.map((i) => {
        if (i.product.id !== productId) return i;
        const quantity = i.quantity + 1;
        return { ...i, quantity, subtotal: round2(Number(i.product.price) * quantity) };
      });
      commit(next);
      return true;
    },
    [commit],
  );

  /** Decrements quantity; removes item if quantity reaches 0. */
  const decrementItemQuantity = useCallback(
    (productId: string): void => {
      const current = itemsRef.current;
      const existing = current.find((i) => i.product.id === productId);
      if (!existing) return;

      const next =
        existing.quantity <= 1
          ? current.filter((i) => i.product.id !== productId)
          : current.map((i) => {
              if (i.product.id !== productId) return i;
              const quantity = i.quantity - 1;
              return { ...i, quantity, subtotal: round2(Number(i.product.price) * quantity) };
            });
      commit(next);
    },
    [commit],
  );

  const removeFromCart = useCallback(
    (productId: string): void => {
      const next = itemsRef.current.filter((i) => i.product.id !== productId);
      commit(next);
    },
    [commit],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const isInCart = useCallback(
    (productId: string) => items.some((i) => i.product.id === productId),
    [items],
  );

  const total = useMemo(
    () => round2(items.reduce((acc, i) => acc + i.subtotal, 0)),
    [items],
  );

  const itemsCount = useMemo(
    () => items.reduce((acc, i) => acc + i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total,
      itemsCount,
      isInCart,
      addToCart,
      incrementItemQuantity,
      decrementItemQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      total,
      itemsCount,
      isInCart,
      addToCart,
      incrementItemQuantity,
      decrementItemQuantity,
      removeFromCart,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
