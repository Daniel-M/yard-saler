import { useState, useEffect, useCallback } from "react";
import { getProjectedEarnings } from "@features/dashboard/api/earningsProjection.api";
import type { ProjectedEarningsResponse } from "@features/dashboard/types/earningsProjection.types";

interface UseProjectedEarningsResult {
  data: ProjectedEarningsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProjectedEarnings = (): UseProjectedEarningsResult => {
  const [data, setData] = useState<ProjectedEarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProjectedEarnings();
      setData(result);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e as Error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
};
