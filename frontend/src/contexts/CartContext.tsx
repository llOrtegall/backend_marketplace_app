import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ProductInCart = {
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
  isCartLoading: boolean;
  isInCart: (productId: string) => boolean;
  addToCart: (product: ProductInCart) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const CART_STORAGE_KEY = "astro_marketplace_cart_v1";

const toCartItems = (items: Array<{ quantity: number; product: ProductInCart }>): CartItem[] =>
  items.map((item) => ({
    ...item,
    id: item.product.id,
    subtotal: Number((Number(item.product.price) * item.quantity).toFixed(2)),
  }));

const readStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<{ quantity: number; product: ProductInCart }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return toCartItems(parsed).filter((item) => item.quantity > 0);
  } catch {
    return [];
  }
};

const writeStoredCart = (items: CartItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = items.map((item) => ({
    quantity: item.quantity,
    product: item.product,
  }));

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setIsCartLoading(true);
    const storedItems = readStoredCart();
    setItems(storedItems);
    setTotal(Number(storedItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)));
    setIsCartLoading(false);
  }, []);

  const addToCart = useCallback(async (product: ProductInCart) => {
    let added = true;

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);

      if (!existing) {
        const next = [...prev, {
          id: product.id,
          quantity: 1,
          product,
          subtotal: Number(product.price),
        }];
        writeStoredCart(next);
        return next;
      }

      if (existing.quantity >= product.stock) {
        added = false;
        return prev;
      }

      const next = prev.map((item) => {
        if (item.product.id !== product.id) {
          return item;
        }

        const quantity = item.quantity + 1;
        return {
          ...item,
          quantity,
          subtotal: Number((Number(item.product.price) * quantity).toFixed(2)),
        };
      });

      writeStoredCart(next);
      return next;
    });

    return added;
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    const existing = items.some((item) => item.product.id === productId);
    if (!existing) {
      return false;
    }

    setItems((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      writeStoredCart(next);
      return next;
    });

    return true;
  }, [items]);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items],
  );

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    setTotal(Number(items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)));
  }, [items]);

  const itemsCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total,
      itemsCount,
      isCartLoading,
      isInCart,
      addToCart,
      removeFromCart,
      refreshCart,
    }),
    [items, total, itemsCount, isCartLoading, isInCart, addToCart, removeFromCart, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}