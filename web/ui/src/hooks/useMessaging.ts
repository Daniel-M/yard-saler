import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@services/api/client";
import { useAuth } from "@context/AuthContext";

export interface MessageThread {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  product_code?: string;
  event_code?: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface ThreadDetail {
  thread_id: string;
  product_id: string;
  product_name: string;
  product_code?: string;
  event_code?: string;
  other_user_name: string;
  messages: Message[];
  avatarUrl?: string;
}

export function useMessageThreads() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetchThreads = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    try {
      const data = await apiClient<{ threads: MessageThread[] }>("/api/messages/threads", {
        method: "GET",
        signal,
      });
      if (data && data.threads) {
        setThreads(data.threads);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    fetchThreads(controller.signal).finally(() => setIsLoading(false));

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchThreads();
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchThreads();
      }
    }, 8000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchThreads, token]);

  return { threads, isLoading, error, refetch: fetchThreads };
}

export function useMessageHistory(threadId: string) {
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetchHistory = useCallback(async (signal?: AbortSignal) => {
    if (!token || !threadId) return;
    try {
      const data = await apiClient<ThreadDetail>(`/api/messages/threads/${threadId}`, {
        method: "GET",
        signal,
      });
      if (data) {
        setDetail(data);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    }
  }, [token, threadId]);

  const addOptimisticMessage = useCallback((message: Message) => {
    setDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, message],
      };
    });
  }, []);

  useEffect(() => {
    if (!token || !threadId) {
      setDetail(null);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    fetchHistory(controller.signal).finally(() => setIsLoading(false));

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHistory();
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchHistory();
      }
    }, 4000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchHistory, threadId, token]);

  return { detail, isLoading, error, refetch: fetchHistory, setDetail, addOptimisticMessage };
}

export function useSendMessage(threadId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId || !content.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<Message>(`/api/messages/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      return data;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  return { sendMessage, isLoading, error };
}

export function useMarkThreadAsRead() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAsRead = useCallback(async (threadId: string) => {
    if (!threadId) return;
    setIsLoading(true);
    setError(null);
    try {
      await apiClient(`/api/messages/threads/${threadId}/read`, {
        method: "POST",
      });
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { markAsRead, isLoading, error };
}

export function useUnreadCount() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  const fetchUnreadCount = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ unread_count: number }>("/api/messages/unread", {
        method: "GET",
        signal,
      });
      if (data && typeof data.unread_count === "number") {
        setCount(data.unread_count);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    fetchUnreadCount(controller.signal);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    }, 15000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  return { count, isLoading, error, refetch: fetchUnreadCount };
}
