import { apiClient } from "@services/api/client";
import { useCallback, useState } from "react";

export interface SendMessagePayload {
  event_code: string;
  product_id: string;
  message: string;
}

export function useMessageSeller() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (payload: SendMessagePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ thread_id: string }>(
        "/api/messages/threads",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
