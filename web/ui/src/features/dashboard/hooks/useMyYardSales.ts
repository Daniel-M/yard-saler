import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@services/api/client";
import { useAuth } from "@context/AuthContext";

export interface YardSale {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  event_code: string;
}

export function useMyYardSales() {
  const [yardSales, setYardSales] = useState<YardSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchMyYardSales = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ yard_sales: YardSale[] }>(
        "/api/yard-sales/me",
        { signal }
      );
      setYardSales(data.yard_sales || []);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err?.message || "Failed to load your yard sales");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyYardSales(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchMyYardSales]);

  return {
    yardSales,
    isLoading,
    error,
    refetch: fetchMyYardSales,
  };
}
