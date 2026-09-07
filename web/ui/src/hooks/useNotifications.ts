import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@services/api/client";
import { useAuth } from "@context/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiClient<{ notifications: Notification[] }>("/api/notifications", {
        method: "GET",
        signal,
      });
      if (data && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch notifications", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await apiClient(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await apiClient("/api/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
