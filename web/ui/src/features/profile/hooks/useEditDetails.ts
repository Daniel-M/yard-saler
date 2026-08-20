import { useCallback, useEffect, useRef, useState } from "react";

import { UserApiClient } from "../api/auth.api";
import type { UserDTO, UserResponseDTO } from "../types/auth.types";

export const useEditDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (variables: UserDTO): Promise<UserResponseDTO> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const client = new UserApiClient();
        const response = await client.editDetails(
          variables,
          abortControllerRef.current.signal,
        );
        setIsSuccess(true);
        return response;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          throw err;
        }
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mutate,
    isLoading,
    error,
    isSuccess,
    reset,
  };
};
