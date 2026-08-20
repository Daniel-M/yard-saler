import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@services/api/client";

export interface WishlistItem {
  id: string;
  product_id: string;
}

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWishlist = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ items: WishlistItem[] }>("/api/wishlist", {
        method: "GET",
        signal,
      });
      if (data && data.items) {
        setWishlistItems(data.items);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);
    const item = wishlistItems.find((i) => i.product_id === productId);
    try {
      if (item) {
        await apiClient<void>(`/api/wishlist/items/${item.id}`, {
          method: "DELETE",
        });
        setWishlistItems((prev) => prev.filter((i) => i.product_id !== productId));
      } else {
        const data = await apiClient<WishlistItem>("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ product_id: productId }),
        });
        setWishlistItems((prev) => [...prev, data]);
      }
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wishlistItems]);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchWishlist(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchWishlist]);

  return { wishlistItems, toggleWishlist, isLoading, error };
}
