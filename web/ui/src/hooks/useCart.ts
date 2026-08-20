import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@services/api/client";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name?: string;
  price?: number;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCart = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ items: CartItem[] }>("/api/cart", {
        method: "GET",
        signal,
      });
      if (data && data.items) {
        setCartItems(data.items);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<CartItem>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      setCartItems((prev) => {
        const exists = prev.find((item) => item.product_id === productId);
        if (exists) {
          return prev.map((item) =>
            item.product_id === productId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, data];
      });
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const item = cartItems.find((i) => i.product_id === productId);
    if (!item) return;

    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<CartItem>(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCartItems((prev) =>
        prev.map((i) =>
          i.product_id === productId ? { ...i, quantity } : i
        )
      );
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  const removeFromCart = useCallback(async (productId: string) => {
    const item = cartItems.find((i) => i.product_id === productId);
    if (!item) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiClient<void>(`/api/cart/items/${item.id}`, {
        method: "DELETE",
      });
      setCartItems((prev) => prev.filter((i) => i.product_id !== productId));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cartItems]);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchCart(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchCart]);

  return { cartItems, addToCart, updateQuantity, removeFromCart, isLoading, error };
}
