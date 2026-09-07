import { useState, useEffect } from "react";
import { useAuth } from "@context/AuthContext";
import { apiClient } from "@services/api/client";

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

export function useExploreListings() {
  const { user } = useAuth();
  const [yardSales, setYardSales] = useState<YardSale[]>([]);
  const [filteredYardSales, setFilteredYardSales] = useState<YardSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract city name from user socials/location (e.g., "Seattle, WA 98101" -> "seattle")
  const userLocation = user?.socials || "";
  const userCity = userLocation.split(",")[0]?.trim().toLowerCase() || "";

  useEffect(() => {
    const fetchYardSales = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient<{ yard_sales: YardSale[] }>("/api/yard-sales?limit=100");
        const list = data.yard_sales || [];
        setYardSales(list);

        if (userCity) {
          const matched = list.filter((ys) => {
            const ysLocation = ys.location ? ys.location.toLowerCase() : "";
            const ysCity = ysLocation.split(",")[0]?.trim() || "";
            return ysLocation.includes(userCity) || ysCity.includes(userCity);
          });
          setFilteredYardSales(matched);
        } else {
          setFilteredYardSales([]);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch explore listings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchYardSales();
  }, [userCity]);

  return {
    yardSales,
    filteredYardSales,
    userCity: user?.socials?.split(",")[0]?.trim() || "",
    isLoading,
    error,
  };
}
