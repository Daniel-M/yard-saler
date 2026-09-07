import { useState, useCallback } from "react";
import { apiClient } from "@services/api/client";
import type { Product } from "@components/common/ProductCard";

export interface UpdateProductVariables {
  yardSaleId: string;
  productId: string;
  data: {
    name: string;
    description: string;
    price: number;
    condition: string;
    status: string;
    images: string[];
    product_code: string;
  };
}

export function useUpdateProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  const mutate = useCallback(
    async ({ yardSaleId, productId, data }: UpdateProductVariables): Promise<Product> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
        const res = await apiClient<Product>(
          `/api/yard-sales/${yardSaleId}/products/${productId}`,
          {
            method: "PUT",
            body: JSON.stringify(data),
          },
        );
        setIsSuccess(true);
        return res;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { mutate, isLoading, error, isSuccess, reset };
}
