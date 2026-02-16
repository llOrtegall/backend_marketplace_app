import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ProductInCart = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
};

type CartItem = {
  id: string;
  quantity: number;
  product: ProductInCart;
  subtotal: number;
};

type CartResponse = {
  data: {
    items: CartItem[];
    total: number;
  };
};

type CartContextValue = {
  items: CartItem[];
  total: number;
  itemsCount: number;
  isCartLoading: boolean;
  isInCart: (productId: string) => boolean;
  addToCart: (productId: string) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const toCartState = (response: CartResponse) => ({
  items: response.data.items,
  total: response.data.total,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const applyResponse = useCallback((response: CartResponse) => {
    const next = toCartState(response);
    setItems(next.items);
    setTotal(next.total);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setIsCartLoading(true);
      const response = await axios.get<CartResponse>("/cart");
      applyResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setItems([]);
        setTotal(0);
        return;
      }

      throw error;
    } finally {
      setIsCartLoading(false);
    }
  }, [applyResponse]);

  const addToCart = useCallback(async (productId: string) => {
    try {
      setIsCartLoading(true);
      const response = await axios.post<CartResponse>("/cart/items", { productId, quantity: 1 });
      applyResponse(response.data);
      return true;
    } catch {
      return false;
    } finally {
      setIsCartLoading(false);
    }
  }, [applyResponse]);

  const removeFromCart = useCallback(async (productId: string) => {
    const cartItem = items.find((item) => item.product?.id === productId);

    if (!cartItem) {
      return false;
    }

    try {
      setIsCartLoading(true);
      const response = await axios.delete<CartResponse>(`/cart/items/${cartItem.id}`);
      applyResponse(response.data);
      return true;
    } catch {
      return false;
    } finally {
      setIsCartLoading(false);
    }
  }, [applyResponse, items]);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product?.id === productId),
    [items],
  );

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

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